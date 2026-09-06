# Hugo Blog Compatibility

This GitHub Action is specifically designed to work with Hugo blogs, particularly those using the frontmatter format from [Walsen/weblog](https://github.com/Walsen/weblog).

## Supported Hugo Frontmatter

The action supports the following Hugo frontmatter fields:

### Required Fields

```yaml
---
title: "Your Post Title"
---
```

### Recommended Fields

```yaml
---
title: "Your Post Title"
description: "A brief description of your post"
draft: false
---
```

### Full Example (Hugo Format)

```yaml
---
title: "Devbox: Portable and Isolated Development Environments"
description: "The dependency manager I like the most for development environments."
publishdate: 2025-01-16T23:34:01-04:00
draft: false
eyecatch: "https://walsen-blog-post-images.s3.us-east-1.amazonaws.com/devbox01/cover.jpg"
toc: true
math: false
canonicalURL: ""
---
```

## Field Mapping

| Hugo Field | Dev.to Field | Notes |
|------------|--------------|-------|
| `title` | `title` | Required. Quotes are automatically removed |
| `description` | `description` | Recommended for SEO |
| `draft` | `published` | Inverted: `draft: false` → `published: true` |
| `eyecatch` | `main_image` | Cover image URL |
| `canonicalURL` | `canonical_url` | Auto-generated if empty or missing |
| `tags` | `tags` | Max 4 tags (Dev.to limit) |
| `series` | `series` | Groups related posts |
| `publishdate` | - | Ignored (Dev.to uses its own timestamps) |
| `toc` | - | Ignored (Hugo-specific) |
| `math` | - | Ignored (Hugo-specific) |
| `slug` | - | Used to build the canonical URL when present (overrides the filename-derived slug) |

## Hugo Shortcode Handling

Dev.to has no concept of Hugo shortcodes, and its Markdown sanitizer **strips `class` and
`style` attributes** — so a blog's grid/masonry layout cannot be reproduced. Media always
stacks full-width. The action therefore converts shortcodes to plain, portable Markdown:

| Shortcode | Handling on Dev.to |
|-----------|--------------------|
| `mermaid` | Converted to a rendered image via `mermaid.ink` |
| `gallery` / `gallery-item` | Converted to plain Markdown — see below. Layout attributes (`cols`) are dropped |
| `adsense` | **Dropped** (ad slots are meaningless on Dev.to) |
| everything else (`centered`, `table`, `code`, `button`, `repo`, `circle`, `math`, `github-sponsors-list`, …) | **Passed through and left visible**, and a build **warning** lists them. They will appear as literal text — nothing is silently deleted |

### Gallery conversion

`gallery-item` supports `src`, `caption`, `alt`, `poster`, `type` (and `cols`, which is dropped):

- **Image** → `![alt](src)` followed by an italic `*caption*` line.
- **Video** (`src` ending in `.mp4`/`.webm`/`.mov`/`.m4v`, or `type="video"`) →
  `[![alt](poster)](src)` followed by `*caption — click the thumbnail to watch*`
  (Dev.to does not support `<video>`, so a poster image linked to the file is used).

`alt` falls back to `caption` when omitted. Captions with apostrophes and em dashes are
preserved.

> If you see a warning about unconverted shortcodes, either the content will render as literal
> text on Dev.to (fix it in the source, or set an explicit `canonicalURL`/rewrite), or a new
> converter is needed in this action.

## Hugo-Specific Features

### Quoted Values

Hugo uses quotes around string values. The action handles both:

```yaml
title: "My Post Title"        # With quotes (Hugo style)
title: My Post Title           # Without quotes (also works)
```

### Boolean Values

```yaml
draft: true                    # Boolean without quotes
draft: false
```

### Empty Canonical URLs

Hugo allows empty canonical URLs:

```yaml
canonicalURL: ""               # Empty - will be auto-generated
canonicalURL: "https://..."    # Explicit URL - will be used
```

The action auto-generates canonical URLs based on your blog structure:
- Format: `{base-url}[/{lang}]/{posts-path}/{slug}/`
- The **default language** (`default-language` input, default `en`) has **no** language
  segment, matching Hugo's `DefaultContentLanguage`.
- Default-language example: `https://blog.walsen.website/posts/my-post/`
- Other-language example: `https://blog.walsen.website/es/posts/mi-post/`

### Date/Time Values

```yaml
publishdate: 2025-01-16T23:34:01-04:00
```

The `publishdate` field is parsed but not sent to Dev.to (Dev.to uses its own timestamps).

### Extra Fields

Hugo-specific fields are safely ignored:

```yaml
toc: true                      # Table of contents (Hugo)
math: false                    # Math rendering (Hugo)
weight: 10                     # Post ordering (Hugo)
```

## Image Handling

### Absolute URLs (Recommended)

```yaml
eyecatch: "https://walsen-blog-post-images.s3.us-east-1.amazonaws.com/post/cover.jpg"
```

Absolute URLs (starting with `http://` or `https://`) are used as-is.

### Relative URLs

```yaml
eyecatch: "/images/cover.jpg"
```

Relative URLs are prefixed with your `base-url`:
- Result: `https://blog.walsen.website/images/cover.jpg`

### Images in Content

Images in your markdown content should use absolute URLs for Dev.to:

```markdown
![Description](https://your-cdn.com/image.jpg)
```

## Tags

### Comma-Separated (Recommended)

```yaml
tags: javascript, webdev, tutorial, beginners
```

### Array Format

```yaml
tags: ["javascript", "webdev", "tutorial", "beginners"]
```

**Note:** Dev.to allows maximum 4 tags. If you provide more, only the first 4 will be used.

## File Structure

The action detects language from the `content/<lang>/` segment of your file path:

```
content/
├── en/
│   └── posts/
│       └── my-post.md          # English post (default language)
└── es/
    └── posts/
        └── mi-post.md          # Spanish post
```

This affects the auto-generated canonical URL (assuming `default-language: en`):
- English (default): `{base-url}/posts/{slug}/`  — **no** `/en/` segment
- Spanish: `{base-url}/es/posts/{slug}/`

## Example Workflow for Hugo Blogs

```yaml
name: Publish to Dev.to

on:
  push:
    branches: [main]
    paths:
      - 'content/en/posts/*.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Get changed files
        id: changed
        run: |
          FILES=$(git diff --name-only HEAD^ HEAD | grep -E 'content/en/posts/.*\.md$' || echo "")
          echo "files=$FILES" >> $GITHUB_OUTPUT
      
      - name: Publish to Dev.to
        if: steps.changed.outputs.files != ''
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ steps.changed.outputs.files }}
          base-url: 'https://blog.walsen.website'
```

## Testing with Your Hugo Blog

1. **Clone your Hugo blog repository**
2. **Set your Dev.to API key:**
   ```bash
   export DEVTO_API_KEY="your-api-key"
   ```

3. **Test with a draft post:**
   ```bash
   npx tsx scripts/publish-to-devto.ts content/en/posts/your-post.md
   ```

4. **Verify on Dev.to:**
   - Check that the post appears as a draft
   - Verify title, description, and cover image
   - Check canonical URL points to your blog

## Differences from Dev.to Native Format

| Feature | Hugo | Dev.to Native |
|---------|------|---------------|
| Quotes | Required for strings | Optional |
| Extra fields | Allowed (ignored) | Not allowed |
| Canonical URL | Can be empty | Must be valid URL or omitted |
| Date format | ISO 8601 with timezone | Not used in frontmatter |
| Boolean format | `true`/`false` | `true`/`false` |

## Troubleshooting

### "Invalid frontmatter format"

Ensure your frontmatter:
- Starts and ends with `---`
- Has a blank line after the closing `---`
- Uses valid YAML syntax

### "Title is required"

Make sure you have:
```yaml
title: "Your Post Title"
```

### Images not showing

- Use absolute URLs for images
- Verify image URLs are publicly accessible
- Check that `eyecatch` field is set correctly

### Wrong canonical URL

The action generates canonical URLs based on:
- Your `base-url` input
- Language detected from the `content/<lang>/` path segment (no prefix for `default-language`)
- The `posts-path` input (default `posts`)
- An explicit `slug:` front matter field, or the filename converted to a slug

To use a custom canonical URL:
```yaml
canonicalURL: "https://yourblog.com/custom/path/"
```

## Best Practices

1. **Use drafts first:** Set `draft: true` for testing
2. **Absolute image URLs:** Host images on CDN or S3
3. **Descriptive titles:** Clear, SEO-friendly titles
4. **Good descriptions:** Help readers find your content
5. **Relevant tags:** Use popular Dev.to tags (max 4)
6. **Canonical URLs:** Point back to your blog for SEO

## Example from Walsen/weblog

Here's a real example from the Walsen/weblog repository:

```yaml
---
title: "Devbox: Portable and Isolated Development Environments"
description: "The dependency manager I like the most for development environments."
publishdate: 2025-01-16T23:34:01-04:00
draft: false
eyecatch: "https://walsen-blog-post-images.s3.us-east-1.amazonaws.com/devbox01/devbox01eyecatch.jpg"
toc: true
math: false
canonicalURL: ""
---

## Introduction

Your content here...
```

This will be published to Dev.to with:
- Title: "Devbox: Portable and Isolated Development Environments"
- Description: "The dependency manager I like the most..."
- Status: Published (draft: false)
- Cover image: The S3 URL
- Canonical URL: Auto-generated (empty string)
- Extra fields (toc, math, publishdate): Ignored

## Need Help?

- Check [EXAMPLES.md](EXAMPLES.md) for workflow examples
- See [SETUP.md](SETUP.md) for troubleshooting
- Open an [issue](https://github.com/your-username/hugo-to-devto-action/issues) for support
