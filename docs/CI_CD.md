# CI/CD Workflows

This document describes the automated workflows for building, testing, and releasing the action.

## Workflows Overview

### 1. Build and Validate (`build.yml`)

**Triggers:**
- Push to `main` or `master` branch
- Pull requests to `main` or `master` branch

**Purpose:**
- Validates TypeScript code
- Builds the action
- Checks if `dist/` is up to date (PRs only)
- Uploads build artifacts

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. Run TypeScript type check
5. Build action (`npm run build`)
6. Verify `dist/index.js` exists
7. Check for uncommitted changes (PRs only)
8. Upload build artifact

**Why it's important:**
- Ensures code compiles without errors
- Catches missing `dist/` commits in PRs
- Provides build artifacts for debugging

### 2. Auto Build and Commit (`auto-build.yml`)

**Triggers:**
- Push to `main` branch
- Only when source files change:
  - `src/**`
  - `package.json`
  - `package-lock.json`
  - `tsconfig.json`

**Purpose:**
- Automatically builds the action when source changes
- Commits `dist/` if it changed
- Keeps `dist/` always up to date

**Steps:**
1. Checkout code
2. Setup Node.js 20
3. Install dependencies
4. Build action
5. Check if `dist/` changed
6. Commit and push changes (if any)

**Why it's useful:**
- Developers don't need to manually build
- `dist/` is always in sync with source
- Reduces "forgot to build" errors

**Note:** Uses `[skip ci]` in commit message to avoid infinite loops.

### 3. Test Action (`test.yml`)

**Triggers:**
- Manual trigger (`workflow_dispatch`)

**Purpose:**
- Tests the action with a sample post
- Verifies it can publish to Dev.to

**Steps:**
1. Checkout code
2. Create test markdown file
3. Run the action
4. Verify it publishes successfully

**Usage:**
```bash
# Go to Actions tab
# Select "Test Action"
# Click "Run workflow"
# Requires DEVTO_API_KEY secret
```

### 4. Release (`release.yml`)

**Triggers:**
- Push of version tags (`v*`)

**Purpose:**
- Creates GitHub releases automatically
- Generates release notes
- Tags major version (e.g., `v1`)

**Steps:**
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Build action
5. Create GitHub release
6. Update major version tag

**Usage:**
```bash
# Create and push tag
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0

# Workflow runs automatically
# Creates release and updates v1 tag
```

## Workflow Comparison

| Workflow | Trigger | Auto-commit | Artifact | Release |
|----------|---------|-------------|----------|---------|
| Build and Validate | Push/PR | No | Yes | No |
| Auto Build | Push (src changes) | Yes | No | No |
| Test | Manual | No | No | No |
| Release | Tag push | No | No | Yes |

## Development Workflow

### Feature Branch Development (Recommended)

**The recommended workflow for all development:**

1. **Create feature branch:**
   ```bash
   git checkout -b feature/my-feature
   ```

2. **Edit source files:**
   ```bash
   vim src/index.ts
   ```

3. **Commit source only (NO dist/):**
   ```bash
   git add src/
   git commit -m "feat: add feature"
   git push origin feature/my-feature
   ```

4. **Create PR:**
   - CI validates code
   - CI builds (test only, doesn't commit)
   - Code review

5. **Merge to main:**
   - CI automatically builds dist/
   - CI commits dist/ to main
   - Action is ready!

**Benefits:**
- ✅ Clean feature branches (no dist/)
- ✅ No merge conflicts on dist/
- ✅ Automatic builds on merge
- ✅ Always up to date

See [FEATURE_BRANCH_WORKFLOW.md](FEATURE_BRANCH_WORKFLOW.md) for complete guide.

## CI/CD Best Practices

### 1. Always Build Before Committing

Even with auto-build, it's best to build locally:
```bash
npm run build
git add dist/
```

**Why:**
- Catch build errors early
- See what changed in `dist/`
- Faster feedback loop

### 2. Use Semantic Commit Messages

```bash
git commit -m "feat: add new feature"    # New feature
git commit -m "fix: fix bug"             # Bug fix
git commit -m "docs: update readme"      # Documentation
git commit -m "chore: update deps"       # Maintenance
```

**Why:**
- Clear changelog
- Easy to track changes
- Better release notes

### 3. Test Before Releasing

```bash
# Test locally
export DEVTO_API_KEY="your-key"
npx tsx scripts/publish-to-devto.ts test/hugo-format-post.md

# Or use CI test workflow
# Go to Actions → Test Action → Run workflow
```

### 4. Version Properly

Follow [Semantic Versioning](https://semver.org/):
- `v1.0.0` → `v1.0.1` - Patch (bug fixes)
- `v1.0.0` → `v1.1.0` - Minor (new features)
- `v1.0.0` → `v2.0.0` - Major (breaking changes)

## Troubleshooting

### Build Fails in CI

**Error:** `TypeScript compilation failed`

**Solution:**
```bash
# Check locally
npx tsc --noEmit

# Fix errors
vim src/index.ts

# Rebuild
npm run build
```

### Uncommitted Changes Error (PR)

**Error:** `Uncommitted changes in dist/ directory`

**Solution:**
```bash
# Build locally
npm run build

# Commit dist/
git add dist/
git commit -m "chore: rebuild dist/"
git push
```

### Auto-build Not Working

**Issue:** Changes pushed but `dist/` not updated

**Check:**
1. Did you change files in `src/`?
2. Check workflow run in Actions tab
3. Look for errors in auto-build workflow

**Solution:**
```bash
# Manual build and push
npm run build
git add dist/
git commit -m "chore: rebuild dist/"
git push
```

### Release Workflow Not Triggering

**Issue:** Pushed tag but no release created

**Check:**
1. Tag format: Must be `v*` (e.g., `v1.0.0`)
2. Check Actions tab for errors
3. Verify permissions

**Solution:**
```bash
# Delete and recreate tag
git tag -d v1.0.0
git push origin :refs/tags/v1.0.0

# Create again
git tag -a v1.0.0 -m "Release v1.0.0"
git push origin v1.0.0
```

## Workflow Files

```
.github/workflows/
├── build.yml          # Build and validate
├── auto-build.yml     # Auto build and commit
├── test.yml           # Test action
└── release.yml        # Create releases
```

## Permissions

Workflows require these permissions:

### Build and Validate
- `contents: read` (default)

### Auto Build
- `contents: write` (to commit)

### Release
- `contents: write` (to create release)

## Secrets Required

### For Testing
- `DEVTO_API_KEY` - Dev.to API key for testing

### For Release
- `GITHUB_TOKEN` - Automatically provided by GitHub

## Monitoring

### Check Workflow Status

```bash
# Via GitHub CLI
gh run list --workflow=build.yml

# Via web
# Go to Actions tab
```

### View Workflow Logs

```bash
# Via GitHub CLI
gh run view <run-id> --log

# Via web
# Actions tab → Select workflow → View logs
```

## Disabling Auto-build

If you prefer manual builds only:

1. Delete or disable `auto-build.yml`
2. Keep `build.yml` for validation
3. Always build locally before pushing

## Future Enhancements

Potential improvements:
- [ ] Add linting (ESLint)
- [ ] Add unit tests
- [ ] Add integration tests
- [ ] Add code coverage
- [ ] Add security scanning
- [ ] Add dependency updates (Dependabot)

## Questions?

- Check [CONTRIBUTING.md](../CONTRIBUTING.md) for development guide
- See [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md) for release process
- Open an [issue](https://github.com/Walsen/hugo-to-devto-action/issues) for help

---

**CI/CD is set up and ready!** The action will be automatically built and validated on every push. 🚀
