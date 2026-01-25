# Getting Started with Publish to Dev.to Action

Welcome! This guide will help you publish your first blog post to Dev.to using this GitHub Action in just a few minutes.

## What You'll Need

- ✅ A GitHub repository with markdown blog posts
- ✅ A Dev.to account
- ✅ 5 minutes of your time

## Step 1: Get Your Dev.to API Key (2 minutes)

1. Log in to [Dev.to](https://dev.to)
2. Click your profile picture → **Settings**
3. Navigate to **Extensions** (or go directly to https://dev.to/settings/extensions)
4. Scroll to "DEV Community API Keys"
5. Click **Generate API Key**
6. Give it a name like "GitHub Actions Publisher"
7. **Copy the key** (you won't see it again!)

## Step 2: Add API Key to GitHub (1 minute)

1. Go to your GitHub repository
2. Click **Settings** (repository settings, not your profile)
3. In the left sidebar: **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Name: `DEVTO_API_KEY`
6. Value: Paste your API key from Step 1
7. Click **Add secret**

## Step 3: Create Your First Workflow (2 minutes)

Create a new file in your repository: `.github/workflows/publish-to-devto.yml`

```yaml
name: Publish to Dev.to

on:
  workflow_dispatch:
    inputs:
      file-path:
        description: 'Path to your markdown file'
        required: true
        default: 'posts/my-first-post.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        id: publish
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ github.event.inputs.file-path }}
          base-url: 'https://yourblog.com'
      
      - name: Show result
        run: |
          echo "✅ Published!"
          echo "URL: ${{ steps.publish.outputs.article-url }}"
```

**Important**: Replace `your-username` with the actual GitHub username/org where this action is published, and update `base-url` with your blog's URL.

## Step 4: Prepare Your Markdown File

Make sure your markdown file has proper frontmatter. Here's a template:

```markdown
---
title: My First Dev.to Post via GitHub Actions
description: Learn how I automated my Dev.to publishing workflow
draft: true
tags: github-actions, automation, devto, tutorial
---

# Hello Dev.to!

This is my first post published automatically via GitHub Actions.

## Why This is Awesome

- ✅ Automated publishing
- ✅ Version controlled content
- ✅ Consistent formatting

## Next Steps

I'll be publishing more content soon!
```

**Pro tip**: Set `draft: true` for your first test!

## Step 5: Publish Your First Post! (30 seconds)

1. Go to your repository on GitHub
2. Click the **Actions** tab
3. Select **Publish to Dev.to** from the left sidebar
4. Click **Run workflow** (button on the right)
5. Enter your markdown file path (e.g., `posts/my-first-post.md`)
6. Click **Run workflow**
7. Wait a few seconds and watch the magic happen! ✨

## Step 6: Check Your Post

1. Once the workflow completes (green checkmark), click on it
2. Expand the "Show result" step
3. Copy the article URL
4. Visit the URL to see your post on Dev.to!

## What's Next?

### Make It Public
Once you're happy with your draft:
1. Change `draft: false` in your frontmatter
2. Commit and push
3. Run the workflow again

### Automate Publishing
Want to publish automatically when you push? Update your workflow:

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'posts/**/*.md'
```

Now every time you push a markdown file, it publishes automatically!

### Explore More Features

- **Series**: Group related posts
  ```yaml
  series: My Tutorial Series
  ```

- **Cover Images**: Add eye-catching covers
  ```yaml
  eyecatch: https://example.com/image.jpg
  ```

- **Canonical URLs**: Maintain SEO
  ```yaml
  canonicalURL: https://yourblog.com/posts/my-post/
  ```

## Troubleshooting

### "File not found"
- Check the file path is correct
- Make sure it's relative to your repository root
- Example: `posts/my-post.md` not `/posts/my-post.md`

### "Invalid frontmatter"
- Ensure frontmatter is enclosed in `---`
- Check for YAML syntax errors
- Make sure there's a blank line after the closing `---`

### "API error"
- Verify your API key is correct in GitHub Secrets
- Check you haven't exceeded Dev.to rate limits
- Ensure your API key has the right permissions

### Still stuck?
- Check the [Setup Guide](SETUP.md) for detailed troubleshooting
- Review [Examples](EXAMPLES.md) for more patterns
- Open an [issue](https://github.com/your-username/hugo-to-devto-action/issues) for help

## Tips for Success

1. **Start with drafts**: Always test with `draft: true` first
2. **Use good descriptions**: They improve discoverability
3. **Choose tags wisely**: Use relevant tags (max 4)
4. **Add canonical URLs**: Maintain SEO if cross-posting
5. **Test locally first**: Use the standalone script to test

## Learn More

- 📖 [Full Documentation](../README.md)
- 💡 [Usage Examples](EXAMPLES.md)
- 📋 [Quick Reference](QUICK_REFERENCE.md)
- 🤝 [Contributing](../CONTRIBUTING.md)

## Congratulations! 🎉

You've successfully set up automated Dev.to publishing! Now you can focus on writing great content while the action handles the publishing.

Happy blogging! ✍️
