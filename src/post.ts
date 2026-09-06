import {
  buildCanonicalUrl,
  convertGalleryToMarkdown,
  convertMermaidToImages,
  deriveSlug,
  detectLang,
  findUnconvertedShortcodes,
  stripAdsense,
} from './convert';
import type { DevToArticle, Logger } from './devto';

export interface HugoFrontmatter {
  title?: string;
  description?: string;
  publishdate?: string;
  draft?: boolean;
  tags?: string[];
  series?: string;
  canonicalURL?: string;
  eyecatch?: string;
  slug?: string;
}

/** Parse a Hugo markdown file into its front matter and body. */
export function parsePost(content: string): { frontmatter: HugoFrontmatter; markdown: string } {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    throw new Error('Invalid frontmatter format');
  }

  const frontmatterText = frontmatterMatch[1];
  const markdown = frontmatterMatch[2].trim();

  const frontmatter: HugoFrontmatter = {};
  frontmatterText.split('\n').forEach((line) => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (!match) return;

    const [, key, value] = match;
    let cleanValue = value.trim();

    // Remove surrounding quotes.
    if (
      (cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
      (cleanValue.startsWith("'") && cleanValue.endsWith("'"))
    ) {
      cleanValue = cleanValue.slice(1, -1);
    }

    if (cleanValue === '') return;

    if (key === 'draft') {
      frontmatter.draft = cleanValue === 'true';
    } else if (key === 'tags') {
      if (cleanValue.startsWith('[')) {
        frontmatter.tags = cleanValue
          .replace(/[\[\]]/g, '')
          .split(',')
          .map((t) => t.trim().replace(/^["']|["']$/g, ''))
          .filter((t) => t !== '');
      } else {
        frontmatter.tags = cleanValue.split(',').map((t) => t.trim()).filter((t) => t !== '');
      }
    } else if (
      ['title', 'description', 'series', 'canonicalURL', 'eyecatch', 'publishdate', 'slug'].includes(key)
    ) {
      (frontmatter as Record<string, string>)[key] = cleanValue;
    }
    // Ignore other fields like toc, math, etc.
  });

  return { frontmatter, markdown };
}

export interface BuildOptions {
  filePath: string;
  baseUrl: string;
  defaultLanguage: string;
  postsPath: string;
}

/**
 * Run every known converter over the body, then warn (never delete) about any
 * shortcode left behind.
 */
export function convertBody(markdown: string, log: Logger): string {
  const mermaid = convertMermaidToImages(markdown);
  if (mermaid.count > 0) {
    log.info(`   🎨 Converted ${mermaid.count} mermaid diagram(s) to images`);
  }

  const gallery = convertGalleryToMarkdown(mermaid.markdown);
  if (gallery.galleries > 0) {
    log.info(
      `   🖼️  Converted ${gallery.galleries} gallery block(s): ${gallery.images} image(s), ${gallery.videos} video(s)`,
    );
  }

  let processed = stripAdsense(gallery.markdown);

  const leftover = findUnconvertedShortcodes(processed);
  if (leftover.length > 0) {
    log.warning(
      `Unconverted Hugo shortcodes will appear as literal text on Dev.to: ${leftover.join(', ')}`,
    );
  }

  return processed;
}

/**
 * Assemble the Dev.to article payload from a parsed Hugo post. Returns the
 * article plus the computed canonical URL and slug for logging.
 */
export function buildArticle(
  frontmatter: HugoFrontmatter,
  markdown: string,
  opts: BuildOptions,
  log: Logger,
): { article: DevToArticle; canonicalUrl: string; slug: string } {
  if (!frontmatter.title) {
    throw new Error('Title is required in frontmatter');
  }

  // Prefer an explicit `slug:` front matter field; otherwise approximate Hugo's urlize.
  const slug = frontmatter.slug && frontmatter.slug.trim() !== ''
    ? frontmatter.slug.trim()
    : deriveSlug(opts.filePath);

  const lang = detectLang(opts.filePath, opts.defaultLanguage);
  const canonicalUrl = buildCanonicalUrl({
    explicit: frontmatter.canonicalURL,
    baseUrl: opts.baseUrl,
    lang,
    defaultLanguage: opts.defaultLanguage,
    slug,
    postsPath: opts.postsPath,
  });

  const body = convertBody(markdown, log);

  const article: DevToArticle = {
    title: frontmatter.title,
    published: !frontmatter.draft,
    body_markdown: body,
    canonical_url: canonicalUrl,
  };

  if (frontmatter.description) {
    article.description = frontmatter.description;
  }
  if (frontmatter.tags && frontmatter.tags.length > 0) {
    article.tags = frontmatter.tags.slice(0, 4); // dev.to allows max 4 tags
  }
  if (frontmatter.series) {
    article.series = frontmatter.series;
  }
  if (frontmatter.eyecatch) {
    article.main_image = frontmatter.eyecatch.startsWith('http')
      ? frontmatter.eyecatch
      : `${opts.baseUrl.replace(/\/+$/, '')}${frontmatter.eyecatch}`;
  }

  return { article, canonicalUrl, slug };
}
