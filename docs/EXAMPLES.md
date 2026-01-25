# Usage Examples

This document provides various examples of how to use the Publish to Dev.to GitHub Action in different scenarios.

## Example 1: Manual Trigger (Workflow Dispatch)

Perfect for testing or publishing specific posts on demand.

```yaml
name: Manual Publish to Dev.to

on:
  workflow_dispatch:
    inputs:
      file-path:
        description: 'Path to the markdown file'
        required: true
        type: string
      base-url:
        description: 'Your blog base URL'
        required: false
        default: 'https://yourblog.com'
        type: string

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        id: publish
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ inputs.file-path }}
          base-url: ${{ inputs.base-url }}
      
      - name: Show results
        run: |
          echo "Published to: ${{ steps.publish.outputs.article-url }}"
          echo "Article ID: ${{ steps.publish.outputs.article-id }}"
```

## Example 2: Publish on Push to Main

Automatically publish when markdown files are pushed to the main branch.

```yaml
name: Auto Publish on Push

on:
  push:
    branches: [main]
    paths:
      - 'content/**/*.md'
      - 'posts/**/*.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Get changed markdown files
        id: changed-files
        run: |
          CHANGED=$(git diff --name-only HEAD^ HEAD | grep -E '\.(md|markdown)$' || echo "")
          echo "files<<EOF" >> $GITHUB_OUTPUT
          echo "$CHANGED" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT
      
      - name: Publish changed files
        if: steps.changed-files.outputs.files != ''
        run: |
          echo "${{ steps.changed-files.outputs.files }}" | while read file; do
            if [ -n "$file" ]; then
              echo "Publishing: $file"
              # Call action for each file
            fi
          done
```

## Example 3: Publish on Pull Request Merge

Publish posts only when PRs are merged to main.

```yaml
name: Publish on PR Merge

on:
  pull_request:
    types: [closed]
    branches: [main]

jobs:
  publish:
    if: github.event.pull_request.merged == true
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Get PR changed files
        id: pr-files
        uses: actions/github-script@v7
        with:
          script: |
            const files = await github.rest.pulls.listFiles({
              owner: context.repo.owner,
              repo: context.repo.repo,
              pull_number: context.payload.pull_request.number
            });
            const mdFiles = files.data
              .filter(f => f.filename.endsWith('.md'))
              .map(f => f.filename);
            return mdFiles.join('\n');
      
      - name: Publish files
        run: |
          echo "${{ steps.pr-files.outputs.result }}" | while read file; do
            if [ -n "$file" ]; then
              echo "Would publish: $file"
            fi
          done
```

## Example 4: Scheduled Publishing

Publish posts on a schedule (e.g., every day at 9 AM UTC).

```yaml
name: Scheduled Publishing

on:
  schedule:
    - cron: '0 9 * * *'  # Every day at 9 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Find posts to publish
        id: find-posts
        run: |
          # Find posts with today's date in frontmatter
          TODAY=$(date +%Y-%m-%d)
          POSTS=$(grep -l "publishdate: $TODAY" content/**/*.md || echo "")
          echo "posts=$POSTS" >> $GITHUB_OUTPUT
      
      - name: Publish scheduled posts
        if: steps.find-posts.outputs.posts != ''
        run: |
          for post in ${{ steps.find-posts.outputs.posts }}; do
            echo "Publishing scheduled post: $post"
            # Call action for each post
          done
```

## Example 5: Multi-Language Support

Publish posts in different languages with appropriate base URLs.

```yaml
name: Multi-Language Publishing

on:
  workflow_dispatch:
    inputs:
      file-path:
        required: true
        type: string

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Detect language
        id: detect-lang
        run: |
          if [[ "${{ inputs.file-path }}" == *"/en/"* ]]; then
            echo "lang=en" >> $GITHUB_OUTPUT
            echo "base-url=https://yourblog.com/en" >> $GITHUB_OUTPUT
          elif [[ "${{ inputs.file-path }}" == *"/es/"* ]]; then
            echo "lang=es" >> $GITHUB_OUTPUT
            echo "base-url=https://yourblog.com/es" >> $GITHUB_OUTPUT
          else
            echo "lang=en" >> $GITHUB_OUTPUT
            echo "base-url=https://yourblog.com" >> $GITHUB_OUTPUT
          fi
      
      - name: Publish to Dev.to
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ inputs.file-path }}
          base-url: ${{ steps.detect-lang.outputs.base-url }}
```

## Example 6: Publish with Notifications

Send notifications after successful publishing.

```yaml
name: Publish with Notifications

on:
  workflow_dispatch:
    inputs:
      file-path:
        required: true

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Publish to Dev.to
        id: publish
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ inputs.file-path }}
      
      - name: Send Slack notification
        if: success()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Published to Dev.to: ${{ steps.publish.outputs.article-url }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
      
      - name: Create issue on failure
        if: failure()
        uses: actions/github-script@v7
        with:
          script: |
            github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: 'Failed to publish to Dev.to',
              body: 'Publishing failed for: ${{ inputs.file-path }}'
            })
```

## Example 7: Dry Run / Preview Mode

Test the action without actually publishing.

```yaml
name: Preview Publishing

on:
  pull_request:
    paths:
      - '**/*.md'

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Get changed files
        id: files
        run: |
          FILES=$(git diff --name-only origin/main...HEAD | grep '\.md$' || echo "")
          echo "files=$FILES" >> $GITHUB_OUTPUT
      
      - name: Preview what would be published
        run: |
          echo "## Posts that would be published" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          for file in ${{ steps.files.outputs.files }}; do
            if [ -f "$file" ]; then
              TITLE=$(grep -m 1 "^title:" "$file" | cut -d':' -f2- | xargs)
              echo "- **$TITLE** ($file)" >> $GITHUB_STEP_SUMMARY
            fi
          done
```

## Example 8: Batch Publishing

Publish multiple posts at once with a matrix strategy.

```yaml
name: Batch Publish

on:
  workflow_dispatch:
    inputs:
      posts:
        description: 'JSON array of post paths'
        required: true
        default: '["post1.md", "post2.md"]'

jobs:
  publish:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        post: ${{ fromJson(github.event.inputs.posts) }}
      fail-fast: false
    steps:
      - name: Checkout
        uses: actions/checkout@v4
      
      - name: Publish ${{ matrix.post }}
        uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ matrix.post }}
```

## Tips and Best Practices

1. **Use Draft Mode First**: Set `draft: true` in frontmatter when testing
2. **Validate Frontmatter**: Ensure your YAML frontmatter is valid before publishing
3. **Test Locally**: Use the original script to test before using the action
4. **Monitor Rate Limits**: Dev.to has API rate limits, avoid publishing too many posts at once
5. **Use Canonical URLs**: Always set canonical URLs to maintain SEO
6. **Tag Wisely**: Use relevant tags (max 4) to reach the right audience
7. **Add Descriptions**: Good descriptions improve discoverability
8. **Version Pin**: Pin to a specific version (e.g., `@v1.0.0`) for stability

## Troubleshooting

See [SETUP.md](SETUP.md) for common issues and solutions.
