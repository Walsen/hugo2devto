# Workflow Summary

## Overview

The repository uses a **feature branch workflow** with automatic builds on merge to main.

## Quick Reference

### Development Workflow

```bash
# 1. Create feature branch
git checkout -b feature/my-feature

# 2. Edit source (NO dist/)
vim src/index.ts

# 3. Commit source only
git add src/
git commit -m "feat: add feature"

# 4. Push and create PR
git push origin feature/my-feature
gh pr create

# 5. Merge to main
# CI automatically builds dist/
```

### Key Principles

1. **Feature branches** - All development in branches
2. **No dist/ in PRs** - Only commit source files
3. **CI builds on merge** - Automatic dist/ generation
4. **Clean history** - No dist/ conflicts

## Workflows

### Build and Validate (`build.yml`)

**Runs on:**
- Every push to main
- Every pull request

**Purpose:**
- Validates TypeScript
- Tests build
- Uploads artifacts

**Does NOT:**
- Commit dist/
- Require dist/ in PRs

### Build on Merge (`auto-build.yml`)

**Runs on:**
- Push to main (after merge)
- Only when source files change

**Purpose:**
- Builds dist/
- Commits to main
- Keeps action updated

**Result:**
- Main always has built dist/
- Action is always ready

## Benefits

### For Developers

✅ **Simple workflow**
- Edit source
- Commit
- Push
- Done!

✅ **No manual builds**
- CI handles it
- Always correct

✅ **No conflicts**
- No dist/ in branches
- Clean merges

### For Reviewers

✅ **Clean PRs**
- Only source changes
- Easy to review
- No generated code

✅ **Validated code**
- CI checks compilation
- Build artifacts available

### For Users

✅ **Always up to date**
- Main has latest build
- Action works immediately

✅ **Reliable**
- Automated builds
- Consistent process

## Comparison

### Before (Manual)

```bash
# Developer workflow
vim src/index.ts
npm run build          # Manual
git add src/ dist/     # Both
git commit
git push

# Problems:
# - Can forget to build
# - dist/ conflicts
# - Messy PRs
```

### After (Automatic)

```bash
# Developer workflow
vim src/index.ts
git add src/           # Source only
git commit
git push

# CI handles:
# - Building
# - Committing dist/
# - Pushing

# Benefits:
# - Can't forget
# - No conflicts
# - Clean PRs
```

## File Structure

```
Repository
├── main branch
│   ├── src/          ← Source code
│   └── dist/         ← Built by CI
│
└── feature branches
    └── src/          ← Source only (no dist/)
```

## CI Flow

```
Feature Branch (PR)
    │
    ├─ Edit src/
    ├─ Commit (no dist/)
    ├─ Push
    │
    ▼
CI Validates
    │
    ├─ Type check ✓
    ├─ Build test ✓
    ├─ Upload artifact
    │
    ▼
Code Review
    │
    ▼
Merge to Main
    │
    ▼
CI Builds
    │
    ├─ npm run build
    ├─ git add dist/
    ├─ git commit
    ├─ git push
    │
    ▼
Main Updated
    │
    └─ dist/ ready!
```

## Common Scenarios

### Scenario 1: New Feature

```bash
# Create branch
git checkout -b feature/add-tags

# Develop
vim src/index.ts
git commit -am "feat: add tags support"

# Push
git push origin feature/add-tags

# Create PR
gh pr create

# Merge
gh pr merge --squash

# CI builds dist/ automatically ✓
```

### Scenario 2: Bug Fix

```bash
# Create branch
git checkout -b fix/empty-urls

# Fix
vim src/index.ts
git commit -am "fix: handle empty URLs"

# Push and merge
git push origin fix/empty-urls
gh pr create
gh pr merge --squash

# CI builds dist/ automatically ✓
```

### Scenario 3: Multiple Features

**Developer A:**
```bash
git checkout -b feature/series
# Edit src/
git push
# Create PR
```

**Developer B:**
```bash
git checkout -b feature/images
# Edit src/
git push
# Create PR
```

**Merge:**
1. Feature A merges → CI builds
2. Feature B rebases → No conflicts!
3. Feature B merges → CI builds

**No dist/ conflicts!**

## Testing

### Test in Feature Branch

```bash
# Build locally (don't commit)
npm run build

# Test
export DEVTO_API_KEY="key"
npx tsx scripts/publish-to-devto.ts test/post.md

# Discard dist/
git restore dist/
```

### Test After Merge

```bash
# Wait for CI to build
# Then test with action
uses: Walsen/hugo-to-devto-action@main
```

## Release Process

```bash
# 1. Ensure main is updated
git checkout main
git pull

# 2. Verify dist/ exists
ls dist/index.js

# 3. Create release
npm version patch
git push
git push --tags

# 4. CI creates GitHub release
```

## Troubleshooting

### dist/ Not Built

**Check:**
- Actions tab for workflow run
- Source files changed?
- Workflow enabled?

**Fix:**
```bash
git commit --allow-empty -m "chore: trigger build"
git push
```

### PR Failing

**Check:**
- TypeScript errors
- Build errors
- Workflow logs

**Fix:**
```bash
npx tsc --noEmit
npm run build
# Fix errors
git commit -am "fix: errors"
git push
```

## Documentation

- **[FEATURE_BRANCH_WORKFLOW.md](FEATURE_BRANCH_WORKFLOW.md)** - Complete guide
- **[CI_CD.md](CI_CD.md)** - CI/CD details
- **[CONTRIBUTING.md](../CONTRIBUTING.md)** - Contribution guide

## Summary

**Workflow:**
1. ✅ Feature branches for development
2. ✅ Commit source only (no dist/)
3. ✅ CI validates on PR
4. ✅ CI builds dist/ on merge
5. ✅ Main always ready

**Benefits:**
- Simple for developers
- Clean PRs
- No conflicts
- Automatic builds
- Always up to date

---

**Follow this workflow for efficient, conflict-free development!** 🚀
