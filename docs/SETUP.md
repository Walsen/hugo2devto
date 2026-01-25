# Setup Guide

This guide will help you set up and publish your first post using this GitHub Action.

## Prerequisites

- A GitHub repository with markdown blog posts
- A Dev.to account
- Basic knowledge of GitHub Actions

## Step-by-Step Setup

### 1. Install the Action

You don't need to install anything! GitHub Actions are used directly from the marketplace or by referencing the repository.

### 2. Get Your Dev.to API Key

1. Log in to [Dev.to](https://dev.to)
2. Go to [Settings → Extensions](https://dev.to/settings/extensions)
3. Scroll to "DEV Community API Keys"
4. Click "Generate API Key"
5. Give it a description (e.g., "GitHub Actions Publisher")
6. Copy the generated key (you won't be able to see it again!)

### 3. Add API Key to GitHub

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `DEVTO_API_KEY`
5. Value: Paste your API key from step 2
6. Click **Add secret**

### 4. Create a Workflow File

Create a new file in your repository: `.github/workflows/publish-to-devto.yml`

```yaml
name: Publish to Dev.to

on:
  workflow_dispatch:
    inputs:
      file-path:
        description: 'Path to markdown file'
        required: true
        default: 'content/posts/my-post.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ github.event.inputs.file-path }}
          base-url: 'https://yourblog.com'
```

### 5. Prepare Your Markdown File

Make sure your markdown file has proper frontmatter:

```markdown
---
title: My Awesome Blog Post
description: Learn how to do something amazing
draft: false
tags: javascript, tutorial, webdev
---

Your content here...
```

### 6. Run the Action

1. Go to your repository on GitHub
2. Click **Actions** tab
3. Select **Publish to Dev.to** workflow
4. Click **Run workflow**
5. Enter the path to your markdown file
6. Click **Run workflow**

### 7. Check the Results

1. Wait for the workflow to complete (usually takes a few seconds)
2. Check the workflow logs for the published article URL
3. Visit Dev.to to see your published post!

## Automatic Publishing on Push

To automatically publish when you push changes:

```yaml
name: Auto Publish to Dev.to

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
        with:
          fetch-depth: 2
      
      - name: Get changed files
        id: changed
        run: |
          echo "files=$(git diff --name-only HEAD^ HEAD | grep '\.md$' | tr '\n' ' ')" >> $GITHUB_OUTPUT
      
      - name: Publish each changed file
        if: steps.changed.outputs.files != ''
        run: |
          for file in ${{ steps.changed.outputs.files }}; do
            echo "Would publish: $file"
            # Add action call here for each file
          done
```

## Troubleshooting

### "File not found" Error

- Check that the file path is correct and relative to the repository root
- Ensure the file exists in your repository

### "Invalid frontmatter format" Error

- Verify your frontmatter is enclosed in `---` markers
- Check for YAML syntax errors
- Ensure there's a blank line after the closing `---`

### "Failed to publish" Error

- Verify your API key is correct
- Check that your API key has the necessary permissions
- Ensure you're not exceeding Dev.to rate limits

### Action Not Running

- Check that your workflow file is in `.github/workflows/`
- Verify the YAML syntax is correct
- Ensure the workflow trigger conditions are met

## Next Steps

- Customize the workflow to match your repository structure
- Add automatic publishing on push or pull request
- Set up notifications for successful publications
- Explore advanced features like series and canonical URLs

## Need Help?

- Check the [README](README.md) for more examples
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development setup
- Open an issue on GitHub for bugs or feature requests
