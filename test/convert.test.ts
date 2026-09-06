import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as fs from 'fs';
import * as path from 'path';

import {
  buildCanonicalUrl,
  convertGalleryToMarkdown,
  convertMermaidToImages,
  deriveSlug,
  detectLang,
  findUnconvertedShortcodes,
  stripAdsense,
} from '../src/convert';
import { matchArticle, type DevToExisting, type Logger } from '../src/devto';
import { buildArticle, parsePost } from '../src/post';

const FIXTURES = path.join(__dirname);
const silent: Logger = { info: () => {}, warning: () => {} };

function collectingLogger() {
  const warnings: string[] = [];
  const infos: string[] = [];
  const logger: Logger = { info: (m) => infos.push(m), warning: (m) => warnings.push(m) };
  return { logger, warnings, infos };
}

// ---------------------------------------------------------------------------
// Defect 1 — gallery conversion
// ---------------------------------------------------------------------------

test('gallery: no {{< left in output', () => {
  const src = fs.readFileSync(path.join(FIXTURES, 'gallery-post.md'), 'utf-8');
  const { markdown } = parsePost(src);
  const { markdown: out } = convertGalleryToMarkdown(markdown);
  assert.equal((out.match(/\{\{</g) || []).length, 0);
});

test('gallery: counts images and videos correctly', () => {
  const src = fs.readFileSync(path.join(FIXTURES, 'gallery-post.md'), 'utf-8');
  const { markdown } = parsePost(src);
  const { images, videos, galleries } = convertGalleryToMarkdown(markdown);
  assert.equal(galleries, 1);
  assert.equal(images, 2, 'two images');
  assert.equal(videos, 2, 'one by extension (.mp4), one by type="video"');
});

test('gallery: image becomes ![alt](src) + *caption*', () => {
  const { markdown } = convertGalleryToMarkdown(
    '{{< gallery >}}\n{{< gallery-item src="a.jpg" caption="Cap" alt="Alt" >}}\n{{< /gallery >}}\n',
  );
  assert.match(markdown, /!\[Alt\]\(a\.jpg\)/);
  assert.match(markdown, /\*Cap\*/);
});

test('gallery: video becomes [![alt](poster)](file), not a bare image', () => {
  const { markdown } = convertGalleryToMarkdown(
    '{{< gallery >}}\n{{< gallery-item src="clip.mp4" poster="p.jpg" caption="Watch" >}}\n{{< /gallery >}}\n',
  );
  assert.match(markdown, /\[!\[Watch\]\(p\.jpg\)\]\(clip\.mp4\)/);
  assert.match(markdown, /click the thumbnail to watch/);
  assert.doesNotMatch(markdown, /^!\[Watch\]\(clip\.mp4\)/m);
});

test('gallery: captions with apostrophes and em dashes survive', () => {
  const src = fs.readFileSync(path.join(FIXTURES, 'gallery-post.md'), 'utf-8');
  const { markdown } = parsePost(src);
  const { markdown: out } = convertGalleryToMarkdown(markdown);
  assert.match(out, /O'Brien's second — a wide shot/);
});

test('gallery: alt falls back to caption when alt is absent', () => {
  const { markdown } = convertGalleryToMarkdown(
    '{{< gallery >}}\n{{< gallery-item src="a.jpg" caption="Only caption" >}}\n{{< /gallery >}}\n',
  );
  assert.match(markdown, /!\[Only caption\]\(a\.jpg\)/);
});

// ---------------------------------------------------------------------------
// Defect 1 — mermaid still works, safety net, adsense
// ---------------------------------------------------------------------------

test('mermaid: converts to a mermaid.ink image', () => {
  const { markdown, count } = convertMermaidToImages('{{< mermaid >}}graph TD; A-->B{{< /mermaid >}}');
  assert.equal(count, 1);
  assert.match(markdown, /!\[Mermaid Diagram\]\(https:\/\/mermaid\.ink\/img\/[A-Za-z0-9+/=]+\)/);
});

test('adsense shortcodes are stripped', () => {
  assert.equal(stripAdsense('before\n{{< adsense >}}\nafter').includes('adsense'), false);
});

test('unconverted shortcodes are detected by name (deduped)', () => {
  const names = findUnconvertedShortcodes('{{< button >}}x{{< /button >}}\n{{< centered >}}y{{< /centered >}}');
  assert.deepEqual(names.sort(), ['button', 'centered']);
});

test('unknown-shortcode fixture: adsense gone, button/centered warned', () => {
  const src = fs.readFileSync(path.join(FIXTURES, 'unknown-shortcode-post.md'), 'utf-8');
  const { logger, warnings } = collectingLogger();
  const { frontmatter, markdown } = parsePost(src);
  const { article } = buildArticle(
    frontmatter,
    markdown,
    { filePath: 'test/unknown-shortcode-post.md', baseUrl: 'https://b', defaultLanguage: 'en', postsPath: 'posts' },
    logger,
  );
  assert.equal(article.body_markdown.includes('adsense'), false);
  assert.equal(warnings.some((w) => w.includes('button') && w.includes('centered')), true);
});

// ---------------------------------------------------------------------------
// Defect 4 — slug derivation matches Hugo urlize
// ---------------------------------------------------------------------------

test('slug: collapses " - " to a single hyphen', () => {
  assert.equal(
    deriveSlug('An Incredible Operations Platform - Rundeck.md'),
    'an-incredible-operations-platform-rundeck',
  );
});

test('slug: keeps dots (matches Hugo by luck for dev.to)', () => {
  assert.equal(
    deriveSlug('GitHub Action to Publish Hugo posts to Dev.to.md'),
    'github-action-to-publish-hugo-posts-to-dev.to',
  );
});

test('slug: plain title', () => {
  assert.equal(
    deriveSlug('A Kiro Ambassador at the AWS Community Day Bolivia 2026.md'),
    'a-kiro-ambassador-at-the-aws-community-day-bolivia-2026',
  );
});

// ---------------------------------------------------------------------------
// Defect 3 — canonical URL language segment
// ---------------------------------------------------------------------------

test('detectLang: reads content/<lang>/ segment', () => {
  assert.equal(detectLang('content/es/posts/foo.md', 'en'), 'es');
  assert.equal(detectLang('content/en/posts/foo.md', 'en'), 'en');
  assert.equal(detectLang('posts/foo.md', 'en'), 'en'); // fallback to default
});

test('canonical: default language has NO language prefix', () => {
  assert.equal(
    buildCanonicalUrl({ baseUrl: 'https://blog.walsen.website', lang: 'en', defaultLanguage: 'en', slug: 'my-post', postsPath: 'posts' }),
    'https://blog.walsen.website/posts/my-post/',
  );
});

test('canonical: non-default language gets a prefix', () => {
  assert.equal(
    buildCanonicalUrl({ baseUrl: 'https://blog.walsen.website', lang: 'es', defaultLanguage: 'en', slug: 'mi-post', postsPath: 'posts' }),
    'https://blog.walsen.website/es/posts/mi-post/',
  );
});

test('canonical: explicit front matter value always wins', () => {
  assert.equal(
    buildCanonicalUrl({ explicit: 'https://x.dev/custom/', baseUrl: 'https://b', lang: 'es', defaultLanguage: 'en', slug: 's', postsPath: 'posts' }),
    'https://x.dev/custom/',
  );
});

test('buildArticle: frontmatter slug overrides filename-derived slug in canonical', () => {
  const { article } = buildArticle(
    { title: 'T', slug: 'explicit-slug' },
    'body',
    { filePath: 'content/en/posts/Some Weird - Name.md', baseUrl: 'https://b', defaultLanguage: 'en', postsPath: 'posts' },
    silent,
  );
  assert.equal(article.canonical_url, 'https://b/posts/explicit-slug/');
});

// ---------------------------------------------------------------------------
// Defect 2 — matching for idempotent update
// ---------------------------------------------------------------------------

const EXISTING: DevToExisting[] = [
  { id: 1, title: 'First', canonical_url: 'https://b/posts/first/' },
  { id: 2, title: 'Second', canonical_url: null },
  { id: 3, title: 'Third', canonical_url: 'https://b/posts/third/' },
];

test('match: exact canonical_url wins', () => {
  const m = matchArticle(EXISTING, 'https://b/posts/third/', 'Different Title', silent);
  assert.equal(m?.id, 3);
});

test('match: null canonical_url never matches', () => {
  const m = matchArticle(EXISTING, 'https://b/posts/missing/', 'No Such', silent);
  assert.equal(m, undefined);
});

test('match: falls back to exact title and warns', () => {
  const { logger, warnings } = collectingLogger();
  const m = matchArticle(EXISTING, 'https://b/posts/missing/', 'Second', logger);
  assert.equal(m?.id, 2);
  assert.equal(warnings.length, 1);
  assert.match(warnings[0], /title/i);
});

test('match: returns undefined when nothing matches', () => {
  const m = matchArticle(EXISTING, 'https://b/posts/none/', 'Nope', silent);
  assert.equal(m, undefined);
});
