# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2026-09-06

### Added
- **Idempotent publishing**: the action now looks up the account's existing articles
  (`GET /articles/me/all`, drafts included) and matches on `canonical_url` (falling back to an
  exact `title` match, logged) — updating the article in place with `PUT` instead of creating a
  duplicate on every run
- New `action` output reporting whether the article was `created` or `updated`
- Hugo `gallery` / `gallery-item` shortcode conversion to plain Markdown: images become
  `![alt](src)` + italic caption, videos become a poster thumbnail linked to the file
  (`[![alt](poster)](file)`); layout attributes are dropped because Dev.to strips `class`/`style`
- `adsense` shortcodes are dropped; any other unrecognised shortcode is left visible and a
  warning lists it (content is never silently deleted)
- New `default-language` input (default `en`) — the default language gets **no** language prefix
  in canonical URLs, matching Hugo's `DefaultContentLanguage`
- New `posts-path` input (default `posts`) for sites whose section isn't `posts`
- Support for an explicit `slug:` front matter field when building the canonical URL
- Rate-limit handling: article writes retry on HTTP 429 honouring `Retry-After`
- Real unit tests for the pure converters (`npm test`) plus gallery and unknown-shortcode fixtures

### Fixed
- Canonical URLs no longer insert a language segment for the default language (previously emitted
  `/en/posts/...`, which 404s since Hugo serves the default language at `/posts/...`)
- Language is now detected from the `content/<lang>/` path segment instead of a naive
  `includes('/en/')` substring test
- Slug derivation now collapses runs of whitespace **and hyphens** to a single hyphen (matching
  Hugo's `urlize`), fixing 404 canonicals for filenames containing ` - `

## [1.1.0] - 2026-01-26

### Added
- Automatic conversion of Hugo mermaid shortcodes to images
- Uses mermaid.ink service to render diagrams as PNG images
- Supports `{{< mermaid >}} ... {{< /mermaid >}}` Hugo shortcode format
- Handles optional HTML wrapper divs around mermaid shortcodes

### Fixed
- Dev.to doesn't support mermaid natively, diagrams now render as images

## [1.0.0] - 2026-01-25

### Added
- Initial release of Publish to Dev.to GitHub Action
- Support for Hugo-style markdown frontmatter
- Automatic canonical URL generation
- Tag support (up to 4 tags)
- Series support
- Cover image support
- Draft/published status control
- Configurable base URL for canonical links
- Action outputs for article URL and ID
- Comprehensive documentation and examples
- Test workflows
- Build and release automation

### Features
- Parse YAML frontmatter from markdown files
- Publish to Dev.to API
- Support for both draft and published articles
- Automatic language detection from file path
- Relative and absolute image URL handling

[1.0.0]: https://github.com/Walsen/hugo2devto/releases/tag/v1.0.0
[1.1.0]: https://github.com/Walsen/hugo2devto/releases/tag/v1.1.0
[1.2.0]: https://github.com/Walsen/hugo2devto/releases/tag/v1.2.0
