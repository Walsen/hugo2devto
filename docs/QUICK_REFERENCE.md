# Quick Reference

A cheat sheet for using the Publish to Dev.to GitHub Action.

## Basic Usage

```yaml
- uses: your-username/hugo-to-devto-action@v1
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: 'content/posts/my-post.md'
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `api-key` | ✅ Yes | - | Dev.to API key |
| `file-path` | ✅ Yes | - | Path to markdown file |
| `base-url` | ❌ No | `https://blog.walsen.website` | Base URL for canonical links |

## Outputs

| Output | Description | Example |
|--------|-------------|---------|
| `article-url` | Published article URL | `https://dev.to/username/my-post-123` |
| `article-id` | Article ID on Dev.to | `123456` |

## Frontmatter Format

```yaml
---
title: Your Post Title          # Required
description: Brief description  # Recommended
draft: false                    # true = draft, false = published
tags: tag1, tag2, tag3         # Max 4 tags
series: Series Name            # Optional
canonicalURL: https://...      # Optional (auto-generated)
eyecatch: https://...          # Cover image URL
---
```

## Common Workflows

### Manual Trigger
```yaml
on:
  workflow_dispatch:
    inputs:
      file-path:
        required: true
```

### Auto Publish on Push
```yaml
on:
  push:
    branches: [main]
    paths:
      - '**/*.md'
```

### Scheduled Publishing
```yaml
on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM UTC
```

## Getting Your API Key

1. Go to https://dev.to/settings/extensions
2. Generate API Key
3. Add to GitHub Secrets as `DEVTO_API_KEY`

## Using Outputs

```yaml
- name: Publish
  id: publish
  uses: your-username/hugo-to-devto-action@v1
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: 'post.md'

- name: Use outputs
  run: |
    echo "URL: ${{ steps.publish.outputs.article-url }}"
    echo "ID: ${{ steps.publish.outputs.article-id }}"
```

## Local Testing

```bash
# Set API key
export DEVTO_API_KEY="your-key"

# Test with original script
npx tsx scripts/publish-to-devto.ts path/to/post.md
```

## Troubleshooting

| Error | Solution |
|-------|----------|
| File not found | Check file path is relative to repo root |
| Invalid frontmatter | Ensure YAML is valid and enclosed in `---` |
| API error | Verify API key and check rate limits |
| Build failed | Run `npm run build` and commit `dist/` |

## Best Practices

✅ **Do:**
- Test with `draft: true` first
- Use canonical URLs
- Add descriptions for SEO
- Pin action version (`@v1.0.0`)
- Validate YAML frontmatter

❌ **Don't:**
- Publish too many posts at once (rate limits)
- Forget to commit `dist/` directory
- Use more than 4 tags
- Skip the description field

## Links

- 📖 [Full Documentation](../README.md)
- 🚀 [Setup Guide](SETUP.md)
- 💡 [Examples](EXAMPLES.md)
- 🤝 [Contributing](../CONTRIBUTING.md)
- 📋 [Project Structure](PROJECT_STRUCTURE.md)

## Version Pinning

```yaml
# Latest v1.x.x (recommended for stability)
uses: your-username/hugo-to-devto-action@v1

# Specific version (maximum stability)
uses: your-username/hugo-to-devto-action@v1.0.0

# Latest (not recommended for production)
uses: your-username/hugo-to-devto-action@main
```

## Support

- 🐛 [Report Issues](https://github.com/your-username/hugo-to-devto-action/issues)
- 💬 [Discussions](https://github.com/your-username/hugo-to-devto-action/discussions)
- 📧 Contact maintainers

---

**Need more details?** Check the [full documentation](../README.md) or [setup guide](SETUP.md).
