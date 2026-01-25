# Release Checklist

This checklist helps maintainers prepare and publish new releases.

## Pre-Release

### 1. Code Preparation
- [ ] All PRs for this release are merged
- [ ] All tests pass locally and in CI
- [ ] Code is reviewed and approved
- [ ] No known critical bugs

### 2. Version Update
- [ ] Update version in `package.json`
- [ ] Update version references in documentation
- [ ] Update `CHANGELOG.md` with new version and changes
- [ ] Review and update `README.md` if needed

### 3. Build and Test
```bash
# Install dependencies
npm ci

# Build the action
npm run build

# Verify dist/ is updated
git status

# Test locally
export DEVTO_API_KEY="test-key"
npx tsx scripts/publish-to-devto.ts test/sample-post.md
```

### 4. Documentation Review
- [ ] README.md is up to date
- [ ] SETUP.md reflects any new features
- [ ] EXAMPLES.md includes new usage patterns
- [ ] CHANGELOG.md is complete
- [ ] All links work correctly

## Release Process

### 1. Commit Changes
```bash
# Stage all changes including dist/
git add .

# Commit with version number
git commit -m "Release v1.x.x"

# Push to main
git push origin main
```

### 2. Create Git Tag
```bash
# Create annotated tag
git tag -a v1.x.x -m "Release v1.x.x"

# Push tag
git push origin v1.x.x

# Also update major version tag (e.g., v1)
git tag -fa v1 -m "Update v1 to v1.x.x"
git push origin v1 --force
```

### 3. Verify Release
- [ ] GitHub Actions release workflow runs successfully
- [ ] Release is created on GitHub
- [ ] Release notes are correct
- [ ] Assets are attached (if any)

### 4. Test Release
```yaml
# Test in a workflow
- uses: your-username/hugo-to-devto-action@v1.x.x
  with:
    api-key: ${{ secrets.DEVTO_API_KEY }}
    file-path: 'test.md'
```

## Post-Release

### 1. Announcements
- [ ] Update GitHub release notes if needed
- [ ] Post announcement in Discussions (if enabled)
- [ ] Tweet about the release (optional)
- [ ] Update any external documentation

### 2. Marketplace
- [ ] Verify action appears in GitHub Marketplace
- [ ] Check that description and tags are correct
- [ ] Ensure branding (icon/color) displays properly

### 3. Monitor
- [ ] Watch for issues related to the new release
- [ ] Monitor GitHub Actions usage
- [ ] Check for any error reports
- [ ] Respond to user feedback

## Version Numbering

Follow [Semantic Versioning](https://semver.org/):

- **MAJOR** (v2.0.0): Breaking changes
  - Changes to input/output names
  - Removal of features
  - Behavior changes that break existing workflows

- **MINOR** (v1.1.0): New features (backward compatible)
  - New inputs or outputs
  - New functionality
  - Enhancements

- **PATCH** (v1.0.1): Bug fixes (backward compatible)
  - Bug fixes
  - Documentation updates
  - Performance improvements

## Rollback Procedure

If a release has critical issues:

### 1. Immediate Action
```bash
# Revert the major version tag to previous release
git tag -fa v1 -m "Rollback to v1.x.x"
git push origin v1 --force
```

### 2. Fix and Re-release
- [ ] Identify and fix the issue
- [ ] Create a new patch release
- [ ] Follow normal release process
- [ ] Document the issue in CHANGELOG.md

### 3. Communication
- [ ] Update GitHub release notes with warning
- [ ] Post in Discussions about the issue
- [ ] Notify affected users if possible

## Release Notes Template

```markdown
## What's Changed

### Features
- Feature 1 description
- Feature 2 description

### Bug Fixes
- Fix 1 description
- Fix 2 description

### Documentation
- Doc update 1
- Doc update 2

### Internal
- Internal change 1
- Internal change 2

## Breaking Changes
(if any)

## Upgrade Notes
(if needed)

**Full Changelog**: https://github.com/your-username/hugo-to-devto-action/compare/v1.0.0...v1.1.0
```

## Hotfix Process

For critical bugs requiring immediate release:

1. Create hotfix branch from main
2. Fix the issue
3. Update CHANGELOG.md
4. Bump patch version
5. Build and test
6. Merge to main
7. Tag and release immediately
8. Monitor closely

## Questions?

Contact the maintainers or open a discussion on GitHub.
