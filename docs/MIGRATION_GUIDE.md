# Migration Guide: From Script to GitHub Action

This guide helps you migrate from using the standalone `publish-to-devto.ts` script to the GitHub Action.

## Overview

**Before (Script-based):**
- Requires Node.js and tsx installation in workflow
- Runs script directly with `npx tsx`
- Manual loop handling for multiple files

**After (GitHub Action):**
- No dependencies to install
- Cleaner workflow syntax
- Built-in error handling
- Matrix strategy for multiple files

## Migration Steps

### Step 1: Review Current Workflow

Your current workflow in `Walsen/weblog` looks like this:

```yaml
name: Publish to dev.to

on:
  workflow_dispatch:
    inputs:
      post_path:
        description: 'Path to the post (e.g., content/en/posts/my-post.md)'
        required: true
        type: string
  push:
    branches:
      - main
    paths:
      - 'content/*/posts/*.md'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install -g tsx
      
      - name: Get changed files
        id: changed-files
        if: github.event_name == 'push'
        run: |
          CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep -E 'content/en/posts/.*\.md$' || echo "")
          echo "files=$CHANGED_FILES" >> $GITHUB_OUTPUT
      
      - name: Publish changed posts
        if: github.event_name == 'push' && steps.changed-files.outputs.files != ''
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
        run: |
          for file in ${{ steps.changed-files.outputs.files }}; do
            if [ -f "$file" ]; then
              echo "Publishing $file..."
              npx tsx scripts/publish-to-devto.ts "$file" || echo "Failed to publish $file"
            fi
          done
      
      - name: Publish specific post
        if: github.event_name == 'workflow_dispatch'
        env:
          DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
        run: |
          npx tsx scripts/publish-to-devto.ts "${{ github.event.inputs.post_path }}"
```

### Step 2: New Workflow with GitHub Action

Replace with this improved workflow:

```yaml
name: Publish to dev.to

on:
  workflow_dispatch:
    inputs:
      post_path:
        description: 'Path to the post (e.g., content/en/posts/my-post.md)'
        required: true
        type: string
  push:
    branches:
      - main
    paths:
      - 'content/*/posts/*.md'

jobs:
  # Job 1: Detect which files changed
  detect-changes:
    if: github.event_name == 'push'
    runs-on: ubuntu-latest
    outputs:
      files: ${{ steps.changed-files.outputs.files }}
      has-changes: ${{ steps.changed-files.outputs.has-changes }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 2
      
      - name: Get changed files
        id: changed-files
        run: |
          # Only publish English posts automatically
          CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep -E 'content/en/posts/.*\.md$' || echo "")
          
          if [ -z "$CHANGED_FILES" ]; then
            echo "has-changes=false" >> $GITHUB_OUTPUT
            echo "files=[]" >> $GITHUB_OUTPUT
          else
            echo "has-changes=true" >> $GITHUB_OUTPUT
            # Convert to JSON array for matrix
            FILES_JSON=$(echo "$CHANGED_FILES" | jq -R -s -c 'split("\n") | map(select(length > 0))')
            echo "files=$FILES_JSON" >> $GITHUB_OUTPUT
          fi

  # Job 2: Publish changed posts (automatic on push)
  publish-changed:
    needs: detect-changes
    if: github.event_name == 'push' && needs.detect-changes.outputs.has-changes == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        file: ${{ fromJson(needs.detect-changes.outputs.files) }}
      fail-fast: false  # Continue even if one file fails
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Publish ${{ matrix.file }} to Dev.to
        uses: Walsen/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ matrix.file }}
          base-url: 'https://blog.walsen.website'

  # Job 3: Publish specific post (manual trigger)
  publish-manual:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Publish specific post to Dev.to
        uses: Walsen/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ github.event.inputs.post_path }}
          base-url: 'https://blog.walsen.website'
```

### Step 3: Update Repository

1. **Copy the new workflow:**
   ```bash
   # In your weblog repository
   cp .github/workflows/publish-devto.yml .github/workflows/publish-devto.yml.backup
   # Copy the new workflow content to .github/workflows/publish-devto.yml
   ```

2. **Commit and push:**
   ```bash
   git add .github/workflows/publish-devto.yml
   git commit -m "Migrate to hugo-to-devto-action GitHub Action"
   git push origin main
   ```

3. **Test the workflow:**
   - Go to Actions tab
   - Select "Publish to dev.to"
   - Click "Run workflow"
   - Enter a test post path
   - Verify it publishes correctly

## Key Differences

### Before (Script)

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Install dependencies
  run: npm install -g tsx

- name: Publish
  env:
    DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
  run: |
    for file in ${{ steps.changed-files.outputs.files }}; do
      npx tsx scripts/publish-to-devto.ts "$file"
    done
```

**Issues:**
- Requires Node.js setup
- Requires tsx installation
- Manual loop handling
- No parallel execution
- Harder to debug

### After (GitHub Action)

```yaml
- name: Publish to Dev.to
  uses: Walsen/hugo-to-devto-action@v1
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: ${{ matrix.file }}
    base-url: 'https://blog.walsen.website'
```

**Benefits:**
- ✅ No setup required
- ✅ No dependencies to install
- ✅ Matrix strategy for parallel execution
- ✅ Better error handling
- ✅ Cleaner syntax
- ✅ Easier to maintain

## Matrix Strategy Benefits

The new workflow uses GitHub Actions matrix strategy:

```yaml
strategy:
  matrix:
    file: ${{ fromJson(needs.detect-changes.outputs.files) }}
  fail-fast: false
```

**Benefits:**
1. **Parallel Execution** - Multiple posts publish simultaneously
2. **Independent Failures** - One failure doesn't stop others
3. **Better Visibility** - Each file gets its own job in the UI
4. **Easier Debugging** - Clear logs per file

**Example:**
If you push 3 posts at once:
- Old way: Sequential (post1 → post2 → post3)
- New way: Parallel (post1, post2, post3 all at once)

## Workflow Triggers

Both workflows support the same triggers:

### 1. Automatic (Push to main)

```yaml
on:
  push:
    branches:
      - main
    paths:
      - 'content/*/posts/*.md'
```

**Behavior:**
- Triggers when markdown files in `content/*/posts/` change
- Only publishes English posts (`content/en/posts/*.md`)
- Publishes all changed files

### 2. Manual (Workflow Dispatch)

```yaml
on:
  workflow_dispatch:
    inputs:
      post_path:
        description: 'Path to the post'
        required: true
```

**Usage:**
1. Go to Actions tab
2. Select "Publish to dev.to"
3. Click "Run workflow"
4. Enter post path: `content/en/posts/my-post.md`
5. Click "Run workflow"

## Testing the Migration

### Test 1: Manual Trigger

```bash
# 1. Go to GitHub Actions tab
# 2. Select "Publish to dev.to"
# 3. Click "Run workflow"
# 4. Enter: content/en/posts/test-post.md
# 5. Verify it publishes to Dev.to
```

### Test 2: Automatic Trigger

```bash
# 1. Edit a post in content/en/posts/
# 2. Commit and push to main
# 3. Check Actions tab
# 4. Verify workflow runs automatically
# 5. Check Dev.to for published post
```

### Test 3: Multiple Files

```bash
# 1. Edit multiple posts
# 2. Commit and push
# 3. Check Actions tab
# 4. Verify matrix strategy creates separate jobs
# 5. Check all posts published to Dev.to
```

## Rollback Plan

If you need to rollback:

```bash
# Restore backup
cp .github/workflows/publish-devto.yml.backup .github/workflows/publish-devto.yml
git add .github/workflows/publish-devto.yml
git commit -m "Rollback to script-based workflow"
git push origin main
```

## Troubleshooting

### Action Not Found

**Error:** `Unable to resolve action Walsen/hugo-to-devto-action@v1`

**Solution:**
1. Ensure the action is published to GitHub
2. Check the repository name is correct
3. Verify the tag `v1` exists
4. Try using `@main` instead of `@v1` during testing

### Matrix Strategy Not Working

**Error:** `Invalid value for matrix`

**Solution:**
1. Ensure `jq` is available (it is by default on ubuntu-latest)
2. Check the JSON array format is correct
3. Verify the `detect-changes` job outputs are set correctly

### No Files Detected

**Issue:** Workflow runs but no files are published

**Solution:**
1. Check the file path pattern: `content/en/posts/*.md`
2. Verify files actually changed in the commit
3. Check the grep pattern matches your file structure
4. Look at the `detect-changes` job output

## Benefits Summary

| Feature | Script | GitHub Action |
|---------|--------|---------------|
| Setup required | Node.js + tsx | None |
| Syntax | Bash loops | Declarative YAML |
| Parallel execution | No | Yes (matrix) |
| Error handling | Manual | Built-in |
| Debugging | Complex | Simple |
| Maintenance | High | Low |
| Reusability | Low | High |

## Next Steps

1. ✅ Review the new workflow
2. ✅ Test with a draft post
3. ✅ Deploy to production
4. ✅ Monitor first few runs
5. ✅ Remove old script dependencies (optional)

## Questions?

- Check [HUGO_COMPATIBILITY.md](HUGO_COMPATIBILITY.md) for Hugo-specific features
- See [EXAMPLES.md](EXAMPLES.md) for more workflow patterns
- Open an [issue](https://github.com/Walsen/hugo-to-devto-action/issues) for help

---

**Ready to migrate?** Follow the steps above and enjoy a cleaner, more maintainable workflow! 🚀
