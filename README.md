# Publish to Dev.to GitHub Action

[![Build and Package](https://github.com/Walsen/hugo2devto/actions/workflows/build.yml/badge.svg)](https://github.com/Walsen/hugo2devto/actions/workflows/build.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A GitHub Action to automatically publish Hugo blog posts (or any markdown files with frontmatter) to [dev.to](https://dev.to).

This action is based on the `publish-to-devto.ts` script from the [Walsen/weblog](https://github.com/Walsen/weblog) repository, packaged as a reusable GitHub Action for the community.

> 🎯 **First time here?** Start with [START_HERE.md](docs/START_HERE.md) to find the right guide for you!  
> 🚀 **Want to publish?** Jump to [GETTING_STARTED.md](docs/GETTING_STARTED.md) for a 5-minute setup!  
> 📚 **Need details?** See [SETUP.md](docs/SETUP.md) for comprehensive instructions

## Features

- 📝 Publishes markdown files with YAML frontmatter to dev.to
- 🎨 **Full Hugo blog support** - Works seamlessly with Hugo frontmatter format
- 🔗 Automatic canonical URL generation
- 🏷️ Tag support (up to 4 tags as per dev.to limits)
- 📚 Series support
- 🖼️ Main image/cover image support
- ✅ Draft/published status control
- 🌐 Multi-language support (auto-detects from file path)

## Usage

### Basic Example

```yaml
name: Publish to Dev.to

on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        uses: Walsen/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: 'content/en/posts/my-post.md'
```

### Advanced Example with Multiple Posts

```yaml
name: Publish Multiple Posts

on:
  workflow_dispatch:
    inputs:
      posts:
        description: 'Comma-separated list of post paths'
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        post: ${{ fromJson(format('["{0}"]', github.event.inputs.posts)) }}
    steps:
      - uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        uses: Walsen/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ matrix.post }}
          base-url: 'https://yourblog.com'
```

## Inputs

| Input | Description | Required | Default |
|-------|-------------|----------|---------|
| `api-key` | Dev.to API key (get from https://dev.to/settings/extensions) | Yes | - |
| `file-path` | Path to the markdown file to publish | Yes | - |
| `base-url` | Base URL for canonical links | No | `https://blog.walsen.website` |

## Outputs

| Output | Description |
|--------|-------------|
| `article-url` | URL of the published article on dev.to |
| `article-id` | ID of the published article on dev.to |

## Markdown Frontmatter Format

Your markdown files should have YAML frontmatter with the following supported fields:

```yaml
---
title: "Your Post Title"
description: "A brief description of your post"
draft: false
tags: javascript, webdev, tutorial, beginners
series: "My Tutorial Series"
canonicalURL: "https://yourblog.com/posts/your-post/"
eyecatch: "https://yourblog.com/images/cover.jpg"
---

Your markdown content here...
```

**Hugo Blog Users:** This action fully supports Hugo frontmatter format! See [HUGO_COMPATIBILITY.md](docs/HUGO_COMPATIBILITY.md) for details.

### Supported Frontmatter Fields

- `title` (required): The title of your article
- `description`: A brief description (used as the article description on dev.to)
- `draft`: Set to `true` to publish as draft, `false` to publish publicly
- `tags`: Comma-separated list of tags (max 4 will be used)
- `series`: Name of the series this article belongs to
- `canonicalURL`: Custom canonical URL (auto-generated if not provided)
- `eyecatch`: Cover image URL (can be relative or absolute)

## Setup

### For Users (Publishing Posts)

Users who want to use this action need to:

1. **Get Dev.to API Key**
   - Go to https://dev.to/settings/extensions
   - Generate API Key

2. **Add to Repository Secrets**
   - Go to your repository Settings → Secrets → Actions
   - Add secret: `DEVTO_API_KEY`

3. **Use in Workflow**
   ```yaml
   - uses: Walsen/hugo-to-devto-action@v1
     with:
       api-key: ${{ secrets.DEVTO_API_KEY }}
       file-path: 'content/en/posts/my-post.md'
   ```

See [GETTING_STARTED.md](docs/GETTING_STARTED.md) for detailed setup instructions.

### For Developers (This Repository)

Developers working on this action don't need a Dev.to API key unless testing. See [API_KEY_SETUP.md](docs/API_KEY_SETUP.md) for details.

## Development

### Building the Action

```bash
npm install
npm run build
```

This will compile the TypeScript code and bundle it with dependencies into `dist/index.js`.

### Testing Locally

You can test the core functionality using the original script:

```bash
export DEVTO_API_KEY="your-api-key"
npx tsx scripts/publish-to-devto.ts path/to/your/post.md
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details

## Documentation

- 🔄 [Migration Guide](docs/MIGRATION_GUIDE.md) - Migrate from script to GitHub Action
- 🎨 [Hugo Compatibility](docs/HUGO_COMPATIBILITY.md) - Full guide for Hugo blog users
- 🔑 [API Key Setup](docs/API_KEY_SETUP.md) - Where and how to set up API keys
- 🧪 [Testing Guide](docs/TESTING_GUIDE.md) - How to test the action during development
- 🌿 [Feature Branch Workflow](docs/FEATURE_BRANCH_WORKFLOW.md) - Development workflow guide
- 🤖 [CI/CD](docs/CI_CD.md) - Automated build and release workflows
- 📖 [Quick Reference](docs/QUICK_REFERENCE.md) - Cheat sheet for common tasks
- 🚀 [Setup Guide](docs/SETUP.md) - Step-by-step setup instructions
- 💡 [Examples](docs/EXAMPLES.md) - Comprehensive usage examples
- 🏗️ [Project Structure](docs/PROJECT_STRUCTURE.md) - Repository organization
- 🤝 [Contributing](CONTRIBUTING.md) - Development and contribution guide
- 📋 [Changelog](CHANGELOG.md) - Version history

## Credits

Based on the publish-to-devto.ts script for Hugo blog automation.
