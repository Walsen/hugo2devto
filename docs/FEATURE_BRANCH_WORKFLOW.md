# Feature Branch Workflow

This document describes the recommended workflow for developing features using feature branches.

## Overview

**Development Model:**
- ✅ Work in feature branches
- ✅ No `dist/` commits in feature branches
- ✅ CI validates code on PRs
- ✅ `dist/` built automatically on merge to main

## Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Feature Development                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Create feature   │
                    │     branch       │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Edit src/*.ts   │
                    │  (no dist/)      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  git commit      │
                    │  git push        │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Create PR      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  CI validates    │
                    │  - Type check    │
                    │  - Build test    │
                    │  - No dist/      │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Code review    │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Merge to main  │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  CI builds dist/ │
                    │  and commits     │
                    └──────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  dist/ ready!    │
                    │  Action updated  │
                    └──────────────────┘
```

## Step-by-Step Guide

### 1. Create Feature Branch

```bash
# Update main
git checkout main
git pull origin main

# Create feature branch
git checkout -b feature/my-awesome-feature
```

**Branch naming conventions:**
- `feature/` - New features
- `fix/` - Bug fixes
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Test additions/updates

### 2. Develop Your Feature

```bash
# Edit source files
vim src/index.ts

# Commit changes (NO dist/)
git add src/
git commit -m "feat: add awesome feature"

# Push to remote
git push origin feature/my-awesome-feature
```

**Important:** 
- ❌ Don't run `npm run build`
- ❌ Don't commit `dist/`
- ✅ Only commit source files

### 3. Create Pull Request

```bash
# Via GitHub CLI
gh pr create --title "Add awesome feature" --body "Description of feature"

# Or via GitHub web UI
# Go to repository → Pull requests → New pull request
```

**PR Template:**
```markdown
## Description
Brief description of the feature

## Changes
- Change 1
- Change 2

## Testing
How to test this feature

## Checklist
- [ ] Code follows style guidelines
- [ ] Tests added/updated
- [ ] Documentation updated
- [ ] No dist/ committed
```

### 4. CI Validation

When you push to a feature branch, CI automatically:

1. **Type checks** your code
2. **Builds** the action (creates dist/)
3. **Validates** no errors
4. **Uploads** build artifact
5. **Comments on PR** with build info and testing instructions

**What CI does:**
- ✅ Builds dist/ (but doesn't commit it)
- ✅ Makes artifact available for testing
- ✅ Validates code compiles
- ✅ Shows dist/ size and changes

**You can test the feature branch directly:**
```yaml
# Test your feature branch before merging
uses: Walsen/hugo-to-devto-action@feature/my-feature
```

### 5. Code Review

Reviewers check:
- ✅ Code quality
- ✅ Tests
- ✅ Documentation
- ✅ No `dist/` committed

### 6. Merge to Main

```bash
# Via GitHub UI
# Click "Merge pull request"
# Choose "Squash and merge" or "Create merge commit"

# Via GitHub CLI
gh pr merge --squash
```

### 7. Automatic Build

After merge, CI automatically:

1. **Detects** source changes
2. **Builds** `dist/`
3. **Commits** `dist/` to main
4. **Pushes** the commit

**Result:** Main branch has both source and built `dist/`

## Example Workflow

### Complete Example

```bash
# 1. Create feature branch
git checkout main
git pull
git checkout -b feature/add-tags-support

# 2. Make changes
vim src/index.ts
# Add tags support code

# 3. Commit (no dist/)
git add src/index.ts
git commit -m "feat: add support for array tags format"

# 4. Push
git push origin feature/add-tags-support

# 5. Create PR
gh pr create \
  --title "Add support for array tags format" \
  --body "Adds support for tags in array format: [\"tag1\", \"tag2\"]"

# 6. Wait for CI ✅
# CI validates and builds (but doesn't commit)

# 7. Get review and merge
gh pr merge --squash

# 8. CI automatically builds dist/ on main ✅
# Done! Feature is live
```

## CI Workflows

### On Feature Branch (PR)

**Workflow:** `build.yml`

```yaml
on:
  pull_request:
    branches: [main]
```

**Actions:**
- ✅ Type check
- ✅ Build (test only)
- ✅ Upload artifact
- ❌ No commit

**Purpose:** Validate code compiles

### On Main (After Merge)

**Workflow:** `auto-build.yml`

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'src/**'
```

**Actions:**
- ✅ Build dist/
- ✅ Commit dist/
- ✅ Push to main

**Purpose:** Keep dist/ updated

## Best Practices

### ✅ Do

1. **Work in feature branches**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Commit only source files**
   ```bash
   git add src/
   git commit -m "feat: add feature"
   ```

3. **Write good commit messages**
   ```bash
   git commit -m "feat: add array tags support"
   git commit -m "fix: handle empty canonical URLs"
   git commit -m "docs: update Hugo compatibility guide"
   ```

4. **Keep PRs focused**
   - One feature per PR
   - Small, reviewable changes
   - Clear description

5. **Test locally before pushing**
   ```bash
   npm run build  # Just to verify it compiles
   # Don't commit dist/
   ```

### ❌ Don't

1. **Don't commit dist/ in feature branches**
   ```bash
   # ❌ Wrong
   git add dist/
   git commit -m "feat: add feature"
   ```

2. **Don't push directly to main**
   ```bash
   # ❌ Wrong
   git checkout main
   git commit -m "quick fix"
   git push
   ```

3. **Don't merge without CI passing**
   - Wait for green checkmark
   - Fix any errors

4. **Don't skip code review**
   - Even small changes need review
   - Use draft PRs for WIP

## Testing Your Changes

### Option 1: Test from Feature Branch (Recommended)

After pushing to your feature branch, CI builds the action. You can test it directly:

```yaml
# In a test repository or workflow
- uses: Walsen/hugo-to-devto-action@feature/my-feature
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: 'test/post.md'
```

**Benefits:**
- ✅ Test before merging
- ✅ No manual build needed
- ✅ CI builds automatically
- ✅ Can iterate quickly

**How it works:**
1. Push to feature branch
2. CI builds dist/
3. GitHub Actions can use the branch directly
4. Test with real posts

### Option 2: Download Build Artifact

```bash
# 1. Push to feature branch
# 2. Wait for CI to build
# 3. Go to Actions tab
# 4. Download artifact: dist-feature-my-feature-<sha>
# 5. Extract and test locally
```

### Option 3: Build Locally

```bash
# In feature branch
npm run build

# Test with local script
export DEVTO_API_KEY="your-key"
npx tsx scripts/publish-to-devto.ts test/hugo-format-post.md

# Don't commit dist/
git restore dist/
```

## Handling Conflicts

### If dist/ Conflicts

```bash
# In feature branch
git checkout main
git pull

# Rebase feature branch
git checkout feature/my-feature
git rebase main

# If dist/ conflicts, just use main's version
git checkout --theirs dist/
git rebase --continue

# Or ignore dist/ entirely
git rm -r dist/
git rebase --continue
```

**Better:** Don't commit `dist/` in feature branches!

## Multiple Developers

### Scenario: Two features in parallel

**Developer A:**
```bash
git checkout -b feature/add-series
# Edit src/
git commit -m "feat: add series support"
git push
# Create PR
```

**Developer B:**
```bash
git checkout -b feature/add-images
# Edit src/
git commit -m "feat: add image support"
git push
# Create PR
```

**Merge order:**
1. Feature A merges → CI builds dist/
2. Feature B rebases on main → Gets new dist/
3. Feature B merges → CI builds dist/ again

**No conflicts!** Because neither committed `dist/`

## Hotfixes

For urgent fixes:

```bash
# Create hotfix branch
git checkout -b hotfix/critical-bug

# Fix the bug
vim src/index.ts
git commit -m "fix: critical bug"

# Push and create PR
git push origin hotfix/critical-bug
gh pr create --title "Fix critical bug"

# Fast-track review and merge
gh pr merge --squash

# CI builds dist/ automatically
```

## Release Process

```bash
# 1. Ensure main is up to date
git checkout main
git pull

# 2. Verify dist/ is built
ls -la dist/index.js

# 3. Update version
npm version patch  # or minor, major

# 4. Update CHANGELOG.md
vim CHANGELOG.md

# 5. Commit version bump
git add package.json CHANGELOG.md
git commit -m "chore: bump version to 1.0.1"
git push

# 6. Create and push tag
git tag -a v1.0.1 -m "Release v1.0.1"
git push origin v1.0.1

# 7. CI creates release automatically
```

## Troubleshooting

### CI Not Building dist/

**Issue:** Merged to main but dist/ not updated

**Check:**
1. Did you change files in `src/`?
2. Check Actions tab for workflow run
3. Look for errors in auto-build workflow

**Solution:**
```bash
# Trigger manually
git commit --allow-empty -m "chore: trigger build"
git push
```

### PR Failing CI

**Issue:** CI fails on PR

**Check:**
1. TypeScript errors: `npx tsc --noEmit`
2. Build errors: `npm run build`
3. Check workflow logs

**Solution:**
```bash
# Fix errors locally
vim src/index.ts
npx tsc --noEmit  # Verify
git commit -am "fix: resolve CI errors"
git push
```

### Merge Conflicts

**Issue:** Can't merge due to conflicts

**Solution:**
```bash
# Update feature branch
git checkout feature/my-feature
git fetch origin
git rebase origin/main

# Resolve conflicts (ignore dist/)
# Continue rebase
git rebase --continue

# Force push
git push --force-with-lease
```

## Summary

**Feature Branch Workflow:**
1. ✅ Create feature branch
2. ✅ Edit source files only
3. ✅ Commit without dist/
4. ✅ Create PR
5. ✅ CI validates
6. ✅ Code review
7. ✅ Merge to main
8. ✅ CI builds dist/ automatically

**Benefits:**
- Clean feature branches
- No dist/ conflicts
- Automatic builds
- Always up to date
- Easy code review

---

**Follow this workflow for clean, maintainable development!** 🚀
