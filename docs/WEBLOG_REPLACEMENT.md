# Replacing Walsen/weblog Workflow

## Summary

This document explains how to replace the current script-based workflow in `Walsen/weblog` with this GitHub Action.

## Current Setup (Walsen/weblog)

**Repository:** https://github.com/Walsen/weblog  
**Workflow:** `.github/workflows/publish-devto.yml`  
**Script:** `scripts/publish-to-devto.ts`

### How It Works Now

1. **Trigger:** Push to main or manual dispatch
2. **Setup:** Installs Node.js and tsx
3. **Detection:** Finds changed markdown files
4. **Publishing:** Loops through files and runs script

### Current Workflow

```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Install dependencies
  run: npm install -g tsx

- name: Publish changed posts
  env:
    DEVTO_API_KEY: ${{ secrets.DEVTO_API_KEY }}
  run: |
    for file in ${{ steps.changed-files.outputs.files }}; do
      npx tsx scripts/publish-to-devto.ts "$file"
    done
```

## New Setup (GitHub Action)

**Repository:** https://github.com/Walsen/hugo-to-devto-action  
**Action:** `Walsen/hugo-to-devto-action@v1`  
**No script needed!**

### How It Will Work

1. **Trigger:** Same (push to main or manual dispatch)
2. **Setup:** None required!
3. **Detection:** Same (finds changed markdown files)
4. **Publishing:** Matrix strategy for parallel execution

### New Workflow

```yaml
- name: Publish to Dev.to
  uses: Walsen/hugo-to-devto-action@v1
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: ${{ matrix.file }}
    base-url: 'https://blog.walsen.website'
```

## Comparison

| Aspect | Current (Script) | New (Action) |
|--------|------------------|--------------|
| **Setup** | Node.js + tsx | None |
| **Dependencies** | npm install | None |
| **Execution** | Sequential loop | Parallel matrix |
| **Syntax** | Bash script | Declarative YAML |
| **Maintenance** | Script in repo | Centralized action |
| **Error handling** | Manual | Built-in |
| **Debugging** | Complex | Simple |
| **Speed** | Slow (sequential) | Fast (parallel) |

## Migration Steps

### 1. Prepare the Action

In this repository (`hugo-to-devto-action`):

```bash
# Build the action
npm install
npm run build

# Commit dist/
git add dist/
git commit -m "Build action for v1.0.0"
git push origin main

# Create release
git tag -a v1.0.0 -m "Initial release"
git push origin v1.0.0
git tag -a v1 -m "Version 1"
git push origin v1 --force
```

### 2. Update Walsen/weblog

In your `Walsen/weblog` repository:

```bash
# Backup current workflow
cp .github/workflows/publish-devto.yml .github/workflows/publish-devto.yml.backup

# Update workflow file with new content (see MIGRATION_GUIDE.md)
# Edit .github/workflows/publish-devto.yml

# Commit and push
git add .github/workflows/publish-devto.yml
git commit -m "Migrate to hugo-to-devto-action GitHub Action"
git push origin main
```

### 3. Test the Migration

```bash
# Test 1: Manual trigger
# Go to Actions → Publish to dev.to → Run workflow
# Enter: content/en/posts/test-post.md

# Test 2: Automatic trigger
# Edit a post, commit, and push
# Verify workflow runs automatically

# Test 3: Multiple files
# Edit multiple posts, commit, and push
# Verify matrix strategy works
```

## Complete New Workflow

Save this as `.github/workflows/publish-devto.yml` in `Walsen/weblog`:

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
          CHANGED_FILES=$(git diff --name-only HEAD^ HEAD | grep -E 'content/en/posts/.*\.md$' || echo "")
          
          if [ -z "$CHANGED_FILES" ]; then
            echo "has-changes=false" >> $GITHUB_OUTPUT
            echo "files=[]" >> $GITHUB_OUTPUT
          else
            echo "has-changes=true" >> $GITHUB_OUTPUT
            FILES_JSON=$(echo "$CHANGED_FILES" | jq -R -s -c 'split("\n") | map(select(length > 0))')
            echo "files=$FILES_JSON" >> $GITHUB_OUTPUT
          fi

  publish-changed:
    needs: detect-changes
    if: github.event_name == 'push' && needs.detect-changes.outputs.has-changes == 'true'
    runs-on: ubuntu-latest
    strategy:
      matrix:
        file: ${{ fromJson(needs.detect-changes.outputs.files) }}
      fail-fast: false
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Publish ${{ matrix.file }} to Dev.to
        uses: Walsen/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: ${{ matrix.file }}
          base-url: 'https://blog.walsen.website'

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

## Benefits of Migration

### 1. No Setup Required

**Before:**
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'

- name: Install dependencies
  run: npm install -g tsx
```

**After:**
```yaml
# Nothing! Just use the action
```

**Benefit:** Faster workflow execution, no dependency management

### 2. Parallel Execution

**Before:** Sequential (one at a time)
```
Post 1 → Post 2 → Post 3 (slow)
```

**After:** Parallel (all at once)
```
Post 1 ↘
Post 2 → All publish simultaneously (fast)
Post 3 ↗
```

**Benefit:** 3x faster when publishing multiple posts

### 3. Better Error Handling

**Before:**
```bash
npx tsx scripts/publish-to-devto.ts "$file" || echo "Failed to publish $file"
```
- Errors are just logged
- Workflow continues even on failure
- Hard to debug

**After:**
```yaml
fail-fast: false
```
- Each file gets its own job
- Clear success/failure status
- Easy to see which file failed
- Can retry individual files

### 4. Cleaner Syntax

**Before:** 15+ lines of bash script

**After:** 5 lines of YAML

**Benefit:** Easier to read, maintain, and understand

### 5. Centralized Maintenance

**Before:**
- Script lives in weblog repo
- Updates require changing weblog
- Hard to share improvements

**After:**
- Action lives in separate repo
- Updates are automatic (use `@v1`)
- Easy to share with community

## Rollback Plan

If something goes wrong:

```bash
# In Walsen/weblog
cp .github/workflows/publish-devto.yml.backup .github/workflows/publish-devto.yml
git add .github/workflows/publish-devto.yml
git commit -m "Rollback to script-based workflow"
git push origin main
```

## Timeline

1. **Day 1:** Build and release action (this repo)
2. **Day 2:** Test action with draft posts
3. **Day 3:** Update weblog workflow
4. **Day 4:** Monitor first automatic runs
5. **Day 5:** Remove backup if all works well

## Checklist

### In hugo-to-devto-action repo:
- [ ] Code is complete
- [ ] Tests pass
- [ ] Documentation is ready
- [ ] Action is built (`npm run build`)
- [ ] dist/ is committed
- [ ] Tag v1.0.0 is created
- [ ] Tag v1 is created
- [ ] Action is public

### In Walsen/weblog repo:
- [ ] Backup current workflow
- [ ] Update workflow file
- [ ] Test manual trigger
- [ ] Test automatic trigger
- [ ] Test multiple files
- [ ] Monitor for issues
- [ ] Remove backup

## Support

- **Migration Guide:** [MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)
- **Hugo Compatibility:** [HUGO_COMPATIBILITY.md](HUGO_COMPATIBILITY.md)
- **Examples:** [EXAMPLES.md](EXAMPLES.md)
- **Issues:** https://github.com/Walsen/hugo-to-devto-action/issues

---

**Ready to migrate?** The action is fully compatible with your Hugo blog and will make your workflow cleaner and faster! 🚀
