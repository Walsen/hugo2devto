# Testing Guide

This guide explains how to test the action during development.

## Overview

You can test the action at different stages:
1. **Feature branch** - Test before merging
2. **Pull request** - Test during review
3. **Main branch** - Test after merge
4. **Local** - Test on your machine

## Testing from Feature Branches

### How It Works

When you push to a feature branch:
1. CI automatically builds the action
2. Creates `dist/` (not committed)
3. GitHub Actions can use the branch directly
4. You can test immediately

### Example

```bash
# 1. Create and push feature branch
git checkout -b feature/add-tags
vim src/index.ts
git commit -am "feat: add tags support"
git push origin feature/add-tags

# 2. CI builds automatically ✓

# 3. Test in another repository
```

**Test workflow in Walsen/weblog:**
```yaml
name: Test Feature Branch

on:
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Test feature branch
        uses: Walsen/hugo-to-devto-action@feature/add-tags
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: 'content/en/posts/test-post.md'
          base-url: 'https://blog.walsen.website'
```

### Benefits

✅ **Test before merging**
- Catch issues early
- Verify functionality
- Get feedback

✅ **No manual build**
- CI handles it
- Always up to date
- No dist/ commits

✅ **Quick iteration**
- Push changes
- CI builds
- Test immediately

## Testing Workflow

### Step-by-Step

**1. Create Feature Branch**
```bash
git checkout -b feature/my-feature
```

**2. Make Changes**
```bash
vim src/index.ts
git commit -am "feat: add feature"
```

**3. Push to GitHub**
```bash
git push origin feature/my-feature
```

**4. Wait for CI**
- Go to Actions tab
- Wait for build to complete (usually < 1 minute)
- Check for green checkmark ✓

**5. Test the Feature**

**Option A: Test in another repository**
```yaml
uses: Walsen/hugo-to-devto-action@feature/my-feature
```

**Option B: Download artifact**
- Go to Actions tab
- Click on workflow run
- Download artifact
- Test locally

**6. Iterate if Needed**
```bash
# Make more changes
vim src/index.ts
git commit -am "fix: address feedback"
git push

# CI rebuilds automatically
# Test again
```

## Testing Scenarios

### Scenario 1: New Feature

```bash
# Feature: Add support for array tags
git checkout -b feature/array-tags

# Implement
vim src/index.ts
# Add array tags parsing

# Commit and push
git commit -am "feat: add array tags support"
git push origin feature/array-tags

# Test with post that has array tags
# Create test post:
cat > test-array-tags.md << 'EOF'
---
title: "Test Array Tags"
tags: ["javascript", "webdev", "tutorial"]
draft: true
---
Test content
EOF

# Test in workflow
uses: Walsen/hugo-to-devto-action@feature/array-tags
with:
  file-path: 'test-array-tags.md'
```

### Scenario 2: Bug Fix

```bash
# Bug: Empty canonical URLs not handled
git checkout -b fix/empty-canonical

# Fix
vim src/index.ts
# Add empty string check

# Commit and push
git commit -am "fix: handle empty canonical URLs"
git push origin fix/empty-canonical

# Test with post that has empty canonicalURL
# Create test post:
cat > test-empty-canonical.md << 'EOF'
---
title: "Test Empty Canonical"
canonicalURL: ""
draft: true
---
Test content
EOF

# Test in workflow
uses: Walsen/hugo-to-devto-action@fix/empty-canonical
with:
  file-path: 'test-empty-canonical.md'
```

### Scenario 3: Refactoring

```bash
# Refactor: Improve parser
git checkout -b refactor/parser

# Refactor
vim src/index.ts
# Improve code structure

# Commit and push
git commit -am "refactor: improve frontmatter parser"
git push origin refactor/parser

# Test with existing posts
# Should work exactly the same
uses: Walsen/hugo-to-devto-action@refactor/parser
```

## Local Testing

### With Standalone Script

```bash
# Build locally
npm run build

# Set API key
export DEVTO_API_KEY="your-test-key"

# Test with script
npx tsx scripts/publish-to-devto.ts test/hugo-format-post.md

# Check Dev.to for draft post
```

### With Local Action

```bash
# Build
npm run build

# Create test workflow in this repo
cat > .github/workflows/test-local.yml << 'EOF'
name: Test Local

on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: ./
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: 'test/hugo-format-post.md'
EOF

# Run via GitHub Actions
gh workflow run test-local.yml
```

## Test Posts

### Create Test Posts

**Basic Test Post:**
```markdown
---
title: "Test Post - Basic"
description: "Testing basic functionality"
draft: true
tags: test, github-actions
---

# Test Content

This is a test post.
```

**Hugo Format Test Post:**
```markdown
---
title: "Test Post - Hugo Format"
description: "Testing Hugo frontmatter"
publishdate: 2025-01-25T18:00:00-04:00
draft: true
eyecatch: "https://via.placeholder.com/1000x420"
toc: true
math: false
canonicalURL: ""
tags: test, hugo, github-actions
---

# Test Content

Testing Hugo-specific features.
```

**Complex Test Post:**
```markdown
---
title: "Test Post - Complex"
description: "Testing all features"
draft: true
tags: ["javascript", "webdev", "tutorial", "beginners"]
series: "Test Series"
eyecatch: "https://via.placeholder.com/1000x420"
canonicalURL: "https://example.com/test-post/"
---

# Test Content

Testing:
- Array tags
- Series
- Custom canonical URL
- Cover image
```

## CI Build Artifacts

### Download and Test

**1. Find Artifact**
- Go to Actions tab
- Click on workflow run
- Scroll to "Artifacts"
- Download `dist-<branch>-<sha>`

**2. Extract**
```bash
unzip dist-feature-my-feature-abc123.zip -d dist-test/
```

**3. Inspect**
```bash
# Check size
ls -lh dist-test/index.js

# Check content (first few lines)
head -20 dist-test/index.js
```

**4. Test Locally**
```bash
# Copy to dist/
cp dist-test/index.js dist/

# Test with script
npx tsx scripts/publish-to-devto.ts test/post.md
```

## Testing Checklist

### Before Creating PR

- [ ] Code compiles: `npx tsc --noEmit`
- [ ] Action builds: `npm run build`
- [ ] Tested locally with script
- [ ] Tested with sample posts
- [ ] All test scenarios pass

### During PR Review

- [ ] CI builds successfully
- [ ] Tested from feature branch
- [ ] Tested with real Hugo posts
- [ ] Reviewed by maintainer
- [ ] All feedback addressed

### Before Merging

- [ ] Final test from feature branch
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Ready for production

## Automated Testing

### Unit Tests (Future)

```bash
# Run tests
npm test

# Run with coverage
npm run test:coverage
```

### Integration Tests (Future)

```bash
# Test with real API (draft posts)
npm run test:integration
```

## Troubleshooting

### CI Build Fails

**Check:**
1. TypeScript errors: `npx tsc --noEmit`
2. Build errors: `npm run build`
3. Workflow logs in Actions tab

**Fix:**
```bash
# Fix locally
vim src/index.ts
npx tsc --noEmit
npm run build

# Commit and push
git commit -am "fix: build errors"
git push
```

### Feature Branch Not Working

**Check:**
1. CI completed successfully?
2. Using correct branch name?
3. Syntax correct in workflow?

**Example:**
```yaml
# ✅ Correct
uses: Walsen/hugo-to-devto-action@feature/my-feature

# ❌ Wrong
uses: Walsen/hugo-to-devto-action@v1  # Still using v1
```

### Test Post Not Publishing

**Check:**
1. API key set correctly?
2. Post has required fields (title)?
3. Frontmatter format valid?

**Debug:**
```bash
# Test locally first
export DEVTO_API_KEY="your-key"
npx tsx scripts/publish-to-devto.ts test/post.md

# Check output for errors
```

## Best Practices

### ✅ Do

1. **Test from feature branches**
   - Quick feedback
   - Catch issues early
   - Iterate faster

2. **Use draft posts**
   ```yaml
   draft: true
   ```
   - Won't publish publicly
   - Safe for testing

3. **Test with real Hugo posts**
   - Use actual blog posts
   - Verify compatibility
   - Catch edge cases

4. **Clean up test posts**
   - Delete test drafts from Dev.to
   - Keep Dev.to account clean

### ❌ Don't

1. **Don't test with production posts**
   - Use drafts instead
   - Avoid accidental publishing

2. **Don't skip testing**
   - Always test before merging
   - Catch bugs early

3. **Don't commit dist/ in feature branches**
   - Let CI build it
   - Avoid conflicts

## Summary

**Testing Workflow:**
1. ✅ Push to feature branch
2. ✅ CI builds automatically
3. ✅ Test from branch directly
4. ✅ Iterate as needed
5. ✅ Merge when ready

**Benefits:**
- Fast feedback
- No manual builds
- Test before merge
- Catch issues early

---

**Test early, test often!** 🧪
