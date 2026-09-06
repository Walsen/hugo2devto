import * as path from 'path';

/**
 * Pure, dependency-free conversion helpers.
 *
 * These functions take strings and return strings (or plain data) with no
 * side effects and no dependency on `@actions/core`, so they can be unit
 * tested without a network or an Actions runtime. `src/index.ts` (the action)
 * and `scripts/publish-to-devto.ts` (the manual helper) both consume them.
 */

export const VIDEO_EXT = ['.mp4', '.webm', '.mov', '.m4v'];

/**
 * Convert Hugo mermaid shortcodes to mermaid.ink image URLs.
 * Hugo format: {{< mermaid >}} ... {{< /mermaid >}}
 * Dev.to format: ![Mermaid Diagram](https://mermaid.ink/img/base64encodedcontent)
 */
export function convertMermaidToImages(markdown: string): { markdown: string; count: number } {
  // Match Hugo mermaid shortcodes, also handling an optional HTML wrapper div.
  const mermaidRegex = /(?:<div[^>]*>\s*)?{{\s*<\s*mermaid\s*>\s*}}([\s\S]*?){{\s*<\s*\/mermaid\s*>\s*}}(?:\s*<\/div>)?/gi;

  let count = 0;
  const out = markdown.replace(mermaidRegex, (_match, mermaidCode: string) => {
    count++;
    const trimmedCode = mermaidCode.trim();
    const base64Code = Buffer.from(trimmedCode).toString('base64');
    return `![Mermaid Diagram](https://mermaid.ink/img/${base64Code})`;
  });

  return { markdown: out, count };
}

/** Extract a double-quoted attribute value from a shortcode line. */
function attr(line: string, name: string): string | undefined {
  return line.match(new RegExp(`${name}="([^"]*)"`))?.[1];
}

export interface GalleryResult {
  markdown: string;
  galleries: number;
  images: number;
  videos: number;
}

/**
 * Convert Hugo `{{< gallery >}}` blocks containing `{{< gallery-item ... >}}`
 * entries into plain Markdown.
 *
 * Dev.to's sanitizer strips `class`/`style`, so no layout (grid/masonry) is
 * possible — media always stacks full-width. The correct target is therefore
 * one image per paragraph with an italic caption line beneath it.
 *
 * - image -> `![alt](src)` then `*caption*`
 * - video (.mp4/.webm/.mov/.m4v or type="video") ->
 *     `[![alt](poster)](src)` then `*caption — click the thumbnail to watch*`
 * - the wrapper and `cols` are discarded (no layout control on Dev.to)
 */
export function convertGalleryToMarkdown(markdown: string): GalleryResult {
  const galleryRegex = /\{\{<\s*gallery[^>]*>\}\}\n([\s\S]*?)\{\{<\s*\/gallery\s*>\}\}\n?/g;

  let galleries = 0;
  let images = 0;
  let videos = 0;

  const out = markdown.replace(galleryRegex, (_match, inner: string) => {
    galleries++;
    const lines: string[] = [];

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
        VIDEO_EXT.some((ext) => src.toLowerCase().endsWith(ext));

      if (isVideo) {
        videos++;
        lines.push(`[![${alt}](${poster ?? src})](${src})`);
        const suffix = caption ? `${caption} — ` : '';
        lines.push(`*${suffix}click the thumbnail to watch*`);
      } else {
        images++;
        lines.push(`![${alt}](${src})`);
        if (caption) {
          lines.push(`*${caption}*`);
        }
      }
      lines.push('');
    }

    return lines.join('\n').trimEnd() + '\n';
  });

  return { markdown: out, galleries, images, videos };
}

/**
 * Drop ad shortcodes (e.g. `{{< adsense >}}`) outright — they have no meaning
 * on Dev.to and would otherwise surface as literal text.
 */
export function stripAdsense(markdown: string): string {
  // Paired form: {{< adsense >}} ... {{< /adsense >}}
  const paired = /\{\{<\s*adsense[^>]*>\}\}[\s\S]*?\{\{<\s*\/adsense\s*>\}\}\n?/g;
  // Self-closing / standalone form: {{< adsense ... >}}
  const single = /\{\{<\s*adsense[^>]*>\}\}\n?/g;
  return markdown.replace(paired, '').replace(single, '');
}

/**
 * Return the distinct names of any Hugo shortcodes still present in the text.
 * Used to warn (not delete) — a warning plus visible text is easier to debug
 * than content silently vanishing.
 */
export function findUnconvertedShortcodes(markdown: string): string[] {
  const matches = markdown.match(/\{\{<\s*([a-zA-Z0-9_/-]+)/g);
  if (!matches) return [];
  const names = matches.map((m) => m.replace(/\{\{<\s*/, '').replace(/^\//, ''));
  return [...new Set(names)];
}

/**
 * Approximate Hugo's `urlize`: lowercase, collapse runs of whitespace AND
 * hyphens to a single hyphen, and strip leading/trailing hyphens.
 *
 * This still an approximation — Hugo also honours `slug:`/`url:` front matter
 * and has punctuation edge cases — so prefer an explicit `slug:` front matter
 * field or an explicit `canonicalURL` when the filename is unusual.
 */
export function deriveSlug(filePath: string): string {
  return path
    .basename(filePath, '.md')
    .toLowerCase()
    .replace(/[\s-]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Detect the content language from the path. Hugo multilingual layouts live
 * under `content/<lang>/...`, so match that segment rather than doing a naive
 * substring test on the whole path. Falls back to `defaultLanguage` when no
 * `content/<lang>/` segment is present.
 */
export function detectLang(filePath: string, defaultLanguage: string): string {
  const normalized = filePath.replace(/\\/g, '/');
  const match = normalized.match(/(?:^|\/)content\/([a-zA-Z][a-zA-Z-]*)\//);
  return match ? match[1] : defaultLanguage;
}

export interface CanonicalOptions {
  explicit?: string;
  baseUrl: string;
  lang: string;
  defaultLanguage: string;
  slug: string;
  postsPath: string;
}

/**
 * Build the canonical URL.
 *
 * - An explicit (non-empty) `canonicalURL` front matter value always wins.
 * - The default language has NO path prefix in Hugo (DefaultContentLanguage),
 *   so `/posts/<slug>/` for the default language and `/<lang>/posts/<slug>/`
 *   otherwise.
 */
export function buildCanonicalUrl(opts: CanonicalOptions): string {
  if (opts.explicit && opts.explicit.trim() !== '') {
    return opts.explicit.trim();
  }
  const base = opts.baseUrl.replace(/\/+$/, '');
  const prefix = opts.lang === opts.defaultLanguage ? '' : `/${opts.lang}`;
  const postsPath = opts.postsPath.replace(/^\/+|\/+$/g, '');
  return `${base}${prefix}/${postsPath}/${opts.slug}/`;
}
