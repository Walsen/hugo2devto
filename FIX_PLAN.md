# Fix plan — Dev.to rendering and idempotency (target: v1.2.0)

Status: **proposed**, nothing implemented yet.
Written after publishing a real post with this action and inspecting the result.

## Why this exists

On 2026-09-04, `walsen-blog-content` published "A Kiro Ambassador at the AWS Community Day
Bolivia 2026" through `hugo2devto@v1.1.0`. The workflow reported success, but the published
article was visibly broken and had to be repaired by hand in the Dev.to editor.

Investigating that produced four distinct defects, listed here in priority order.

| # | Defect | Impact | Severity |
|---|---|---|---|
| 1 | Only `mermaid` shortcodes are converted; every other Hugo shortcode reaches Dev.to raw | Galleries render as literal `{{< ... >}}` text | High — visibly broken articles |
| 2 | Action only does `POST`; no lookup, no `PUT` | Re-publishing any post creates a **duplicate** article | High — silently pollutes the Dev.to account |
| 3 | Canonical URL always inserts a language segment | Canonicals point at 404s for the default language | Medium — SEO damage |
| 4 | Slug derived from filename doesn't match Hugo's `urlize` | Canonicals point at 404s for titles containing ` - ` etc. | Medium — SEO damage |

Defects 3 and 4 compound: they already produced wrong canonical URLs on articles published
months ago.

---

## Evidence

The published article (`id 4577624`) fetched back via `GET /api/articles/4577624`:

- `body_markdown` contained **20** lines starting with `{{<` — all rendered as escaped
  literal text (`{{&lt; gallery`) with the URLs inside them autolinked.
- Of 16 intended images and 4 videos, only the cover image and one plain-markdown image
  rendered. Everything inside a `{{< gallery >}}` block was lost.

Canonical URLs on previously published articles, checked against the live site:

```
200  https://blog.walsen.website/posts/a-wild-ride-into-vibe-coding/          ← real URL
404  https://blog.walsen.website/en/posts/a-wild-ride-into-vibe-coding/       ← what we published

200  https://blog.walsen.website/posts/an-incredible-operations-platform-rundeck/
404  https://blog.walsen.website/posts/an-incredible-operations-platform---rundeck/  ← what we published
```

Three of the five articles on the account currently carry a canonical URL that 404s.

---

## Dev.to platform constraints (measured, not assumed)

Verified by inspecting the rendered HTML of the published article. These constrain what
output the converter should aim for:

- `<figure>`, `<figcaption>`, `<img>` and `<a>` **survive** Forem's sanitizer.
- `class` and `style` attributes are **stripped**. A `<figure style="max-width:220px">`
  came back as a bare `<figure>`.
  → **A CSS grid/collage is impossible on Dev.to.** Do not try to reproduce the blog's
  masonry layout; media will always be stacked full-width.
- `<video>` is not usable. Video has to become a poster image wrapped in a link to the file.
- `<img src>` is rewritten through `media2.dev.to` and gets `loading="lazy"` plus inferred
  `width`/`height`.

**Therefore the correct conversion target is plain Markdown:** one image per paragraph, with
an italic caption line beneath it. That is also what the hand-repair used, and it renders
cleanly.

---

## Defect 1 — Unconverted Hugo shortcodes

### Current behaviour

`src/index.ts` has exactly one transform, `convertMermaidToImages()`, applied at:

```ts
const processedMarkdown = convertMermaidToImages(markdown);
```

Everything else in the file body is sent verbatim as `body_markdown`. Dev.to has no concept
of Hugo shortcodes, so they surface as text.

### Shortcodes in use by the consumer repo

`walsen-blog-content` defines these in `layouts/shortcodes/`:

- `gallery` / `gallery-item` — a responsive photo/video collage (the one that broke)
- `adsense` — ad slot, should be **dropped** on Dev.to
- plus theme-provided ones: `mermaid` (handled), `centered`, `table`, `code`, `button`,
  `repo`, `circle`, `math`, `github-sponsors-list`

### Proposed fix

Add a `convertGalleryToMarkdown()` alongside the mermaid converter, and a generic safety net
for anything still unrecognised.

`gallery-item` accepts `src`, `caption`, `alt`, `poster`, `cols`, `type`. Conversion rules:

- image → `![caption](src)` followed by `*caption*`
- video (`.mp4`, `.webm`, `.mov`, `.m4v`, or `type="video"`) →
  `[![caption](poster)](src)` followed by `*caption — click the thumbnail to watch*`
- the `{{< gallery >}}` / `{{< /gallery >}}` wrapper and `cols` are discarded (no layout
  control on Dev.to)

Sketch:

```ts
const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

function attr(line: string, name: string): string | undefined {
  return line.match(new RegExp(`${name}="([^"]*)"`))?.[1];
}

function convertGalleryToMarkdown(markdown: string): string {
  const galleryRegex = /\{\{<\s*gallery[^>]*>\}\}\n([\s\S]*?)\{\{<\s*\/gallery\s*>\}\}\n?/g;

  return markdown.replace(galleryRegex, (_match, inner: string) => {
    const out: string[] = [];

    for (const raw of inner.trim().split('\n')) {
      const line = raw.trim();
      if (!line.startsWith('{{<')) continue;

      const src = attr(line, 'src');
      if (!src) continue;
      const caption = attr(line, 'caption') ?? '';
      const alt = attr(line, 'alt') ?? caption;
      const poster = attr(line, 'poster');
      const isVideo =
        attr(line, 'type') === 'video' ||
        VIDEO_EXT.some(ext => src.toLowerCase().endsWith(ext));

      if (isVideo) {
        out.push(`[![${alt}](${poster ?? src})](${src})`);
        out.push(`*${caption} — click the thumbnail to watch*`);
      } else {
        out.push(`![${alt}](${src})`);
        out.push(`*${caption}*`);
      }
      out.push('');
    }

    core.info(`   🖼️  Converted a gallery block (${out.filter(l => l.startsWith('![') || l.startsWith('[![')).length} items)`);
    return out.join('\n').trimEnd() + '\n';
  });
}
```

A working reference implementation (Python, used to repair the live article) is in the
consumer repo's history discussion — the logic above is a direct port of it and was validated
against the real post: 3 gallery blocks → 15 images, 4 video thumbnails, 14 captions, zero
leftover shortcodes.

### Safety net

After all known converters run, warn about anything left:

```ts
const leftover = processedMarkdown.match(/\{\{<\s*([a-zA-Z0-9_-]+)/g);
if (leftover) {
  const names = [...new Set(leftover.map(m => m.replace(/\{\{<\s*/, '')))];
  core.warning(`Unconverted Hugo shortcodes will appear as literal text on Dev.to: ${names.join(', ')}`);
}
```

Consider also stripping `{{< adsense >}}`-style ad shortcodes outright.

**Do not** silently delete unknown shortcodes — a warning plus visible text is easier to
debug than content vanishing.

---

## Defect 2 — No update path, so republishing duplicates

### Current behaviour

```ts
const response = await fetch('https://dev.to/api/articles', {
  method: 'POST',
  ...
```

That is the only call to the articles API. There is no `GET`, no `PUT`, and no lookup. Every
run creates a new article.

This is worse than it looks, because the consumer workflow triggers on
`paths: content/*/posts/*.md` — so a repo-wide change (a CDN URL migration, a typo sweep)
would create a duplicate of **every** touched English post in a single run.

> Note: `README.md` and the published blog post "GitHub Action to Publish Hugo posts to
> Dev.to" both claim the action "checks if an article already exists on Dev.to (by canonical
> URL) and updates it instead of creating a duplicate". **That was never implemented.** The
> docs need correcting either way — see "Docs to update".

### Proposed fix

1. Fetch the account's own articles, including drafts:
   `GET https://dev.to/api/articles/me/all?per_page=1000&page=N` with the `api-key` header.
   Paginate until a short page is returned.
2. Find a match on `canonical_url` (exact string compare against the canonical this run
   computed). Fall back to an exact `title` match, and log loudly when falling back.
3. If matched → `PUT https://dev.to/api/articles/{id}` with the same `{ article: {...} }`
   payload. If not → `POST` as today.
4. Add an output so callers can tell which happened, e.g. `action: created | updated`.

Points to confirm while implementing:

- `canonical_url` can be `null` on older articles — guard the compare.
- Forem rate-limits article writes; check the current limit in the Forem API docs and add a
  small retry/backoff rather than hard-failing the job.
- Forem's API has **no DELETE for articles**. Cleaning up duplicates is manual in the UI.
  Design accordingly: getting the match right matters more than usual.

### ⚠️ Sequencing constraint

Article `4577624` was **repaired by hand** in the Dev.to editor. A `PUT` will overwrite that
hand-edit with generated output.

So implement **Defect 1 before enabling Defect 2's `PUT`**. If `PUT` ships first, the next
publish will faithfully overwrite the good manual fix with raw shortcodes again.

---

## Defect 3 — Canonical URL always inserts a language segment

### Current behaviour

```ts
const lang = filePath.includes('/en/') ? 'en' : 'es';
const canonicalUrl = (frontmatter.canonicalURL && frontmatter.canonicalURL.trim() !== '')
  ? frontmatter.canonicalURL
  : `${baseUrl}/${lang}/posts/${slug}/`;
```

In Hugo, the **default** language has no path prefix. `walsen-blog-content` sets
`DefaultContentLanguage: en`, so English posts live at `/posts/<slug>/` and only Spanish gets
`/es/posts/<slug>/`. The action emits `/en/posts/<slug>/`, which 404s.

Two further problems with `lang` detection: it is a substring test on the whole path (a repo
checked out under a directory containing `/en/` would misdetect), and anything not English is
assumed to be Spanish.

### Proposed fix

- Add an optional input `default-language` (default `en`).
- Derive `lang` from the content path segment properly (e.g. match `/content/(<lang>)/`)
  rather than `includes('/en/')`.
- Omit the language segment when `lang === default-language`:

```ts
const prefix = lang === defaultLanguage ? '' : `/${lang}`;
const canonicalUrl = explicit ?? `${baseUrl}${prefix}/posts/${slug}/`;
```

- Also worth adding a `posts-path` input for anyone whose section isn't `posts`.

Explicit `canonicalURL` front matter already takes precedence and works — that is the
recommended escape hatch, and the consumer repo now sets it on new posts.

---

## Defect 4 — Slug derivation doesn't match Hugo

### Current behaviour

```ts
const slug = path.basename(filePath, '.md').toLowerCase().replace(/\s+/g, '-');
```

This only collapses whitespace. Hugo's `urlize` also collapses punctuation and repeated
separators. Measured divergence:

| Filename | Action derives | Hugo serves | Result |
|---|---|---|---|
| `An Incredible Operations Platform - Rundeck.md` | `an-incredible-operations-platform---rundeck` | `an-incredible-operations-platform-rundeck` | **404** |
| `GitHub Action to Publish Hugo posts to Dev.to.md` | `github-action-to-publish-hugo-posts-to-dev.to` | `github-action-to-publish-hugo-posts-to-dev.to` | 200 (dot is kept — matches by luck) |
| `A Kiro Ambassador at the AWS Community Day Bolivia 2026.md` | `a-kiro-ambassador-at-the-aws-community-day-bolivia-2026` | same | 200 |

### Proposed fix

Approximate Hugo's `urlize` more closely: lowercase, replace runs of whitespace **and
hyphens** with a single hyphen, strip the result of leading/trailing hyphens.

```ts
const slug = path
  .basename(filePath, '.md')
  .toLowerCase()
  .replace(/[\s-]+/g, '-')
  .replace(/^-|-$/g, '');
```

Be aware this is still an approximation. Hugo also honours a `slug:` front matter field and
`url:` overrides, and its punctuation handling has edge cases.

Recommended belt-and-braces: **read `slug:` from front matter when present**, and keep
recommending explicit `canonicalURL` in the README for anything unusual. Deriving URLs from
filenames will never be perfectly reliable.

---

## Suggested implementation order

1. **Defect 1** — gallery conversion + unconverted-shortcode warning. Ship as `v1.2.0`.
   This alone makes future publishes render correctly.
2. **Defects 3 and 4** — canonical URL correctness. Cheap, low risk, and needed before
   canonical-based matching in step 3 can be trusted.
3. **Defect 2** — lookup + `PUT`. Depends on 1 (see sequencing constraint) and benefits from
   2 and 3 being right, since matching keys on `canonical_url`.

Steps 1–2 could reasonably be one release; step 3 is the larger change and deserves its own.

---

## Testing

The safe way to test against the real API without spamming the account: set `draft: true` in
the test post's front matter. The action maps `published: !frontmatter.draft`, so the article
is created **unpublished** and is only visible to you.

Existing fixtures: `test/sample-post.md`, `test/hugo-format-post.md`. Neither contains a
gallery — **add a fixture with a `gallery` block containing both images and a video**, plus
one with an unknown shortcode to exercise the warning path.

`package.json` currently has `"test": "echo \"No tests yet\" && exit 0"`. The converters are
pure string functions, which makes them the easy and worthwhile place to start real unit
tests — no API or network needed.

Suggested checks per gallery fixture:

- zero occurrences of `{{<` in the output
- image count matches the number of `gallery-item` entries
- videos produce `[![...](poster)](file.mp4)`, not a bare image
- captions survive, including ones containing apostrophes and em dashes

Manual end-to-end verification, mirroring how these defects were found:

```bash
# after publishing a draft, inspect what Dev.to actually stored
curl -s "https://dev.to/api/articles/<ID>" | jq -r '.body_markdown' | grep -c '{{<'   # want 0
```

---

## Release process for this repo

`dist/` is committed and is what GitHub Actions executes — `action.yml` points at
`dist/index.js`. Two workflows matter:

- `.github/workflows/auto-build.yml` — on push to `main` touching `src/**`, runs
  `npm run build` and commits `dist/` back with `[skip ci]`. So merging to `main` refreshes
  `dist/` automatically.
- `.github/workflows/release.yml` — triggers on tag push, rebuilds, creates the release.

Checklist:

1. Bump `version` in `package.json` (currently `1.1.0`).
2. Add a `## [1.2.0]` section to `CHANGELOG.md` — the file follows Keep a Changelog and the
   repo follows SemVer. Include the link reference at the bottom.
3. `npm run build` locally and commit `dist/` (or let `auto-build.yml` do it on merge).
4. Tag `v1.2.0` **and move the floating `v1` tag**, since consumers may track `v1`.
5. Bump the pin in the consumer: `.github/workflows/publish-devto.yml` in
   `walsen-blog-content` currently pins `Walsen/hugo2devto@v1.1.0` in two places
   (`publish-changed` and `publish-manual`).

---

## Docs to update

- `README.md` — remove or implement the idempotency claim. Right now it advertises behaviour
  the code does not have.
- `docs/HUGO_COMPATIBILITY.md` — document which shortcodes are converted, which are dropped,
  and which pass through as text. Note explicitly that Dev.to strips `class`/`style` so no
  layout is preserved.
- `CHANGELOG.md` — as above.
- Consumer blog post: `content/{en,es}/posts/GitHub Action *Dev.to.md` in
  `walsen-blog-content` contains an "Idempotent Updates" section describing
  `findArticleByCanonicalUrl` / `updateArticle` that never existed. That post is itself
  published on Dev.to, so it is publicly documenting a non-existent feature. Fix it when
  Defect 2 lands (and note that editing it will trigger a republish — which, until Defect 2
  ships, means a duplicate).

---

## Backfill after the fix

Existing articles that need attention once the code is correct:

| ID | Title | Problem |
|---|---|---|
| 3193415 | A Wild Ride Into Vibe Coding | canonical has `/en/` → 404 |
| 3198252 | GitHub Action to Publish Hugo Posts to Dev.to | canonical has `/en/` → 404 |
| 3217989 | An Incredible Operations Platform - Rundeck | canonical has `/en/` **and** `---` slug → 404 |
| 3271304 | DevSecOps Fundamentals Project | canonical looks correct |
| 4577624 | A Kiro Ambassador at the AWS Community Day Bolivia 2026 | canonical correct; body hand-repaired |

Once `PUT` support exists, re-running publish for each source file repairs the canonical in
place. Until then it can only be fixed in the Dev.to UI.
