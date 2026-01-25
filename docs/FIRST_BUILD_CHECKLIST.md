# First Build Checklist

Use this checklist to ensure everything is set up correctly before your first release.

## ✅ Pre-Build Checklist

### 1. Configuration Files

- [ ] **action.yml**
  - [ ] Updated `author` field
  - [ ] Verified inputs and outputs
  - [ ] Checked default values

- [ ] **package.json**
  - [ ] Updated `author` field
  - [ ] Updated `repository` URL
  - [ ] Verified version is `1.0.0`

- [ ] **README.md**
  - [ ] Replaced all `your-username` with actual username
  - [ ] Updated default `base-url` if needed
  - [ ] Verified all links work
  - [ ] Added your information

### 2. Source Code

- [ ] **src/index.ts**
  - [ ] Reviewed the code
  - [ ] Customized default base URL if needed
  - [ ] No syntax errors

- [ ] **tsconfig.json**
  - [ ] Configuration is correct
  - [ ] No modifications needed (usually)

### 3. Documentation

- [ ] **All .md files**
  - [ ] Replaced `your-username` with actual username
  - [ ] Updated URLs and links
  - [ ] Reviewed for accuracy
  - [ ] Fixed any typos

- [ ] **docs/ folder**
  - [ ] All documentation files reviewed
  - [ ] Examples are correct
  - [ ] Links work

### 4. GitHub Configuration

- [ ] **.github/workflows/**
  - [ ] All workflow files are present
  - [ ] No syntax errors in YAML
  - [ ] Paths are correct

- [ ] **Issue/PR Templates**
  - [ ] Templates are customized
  - [ ] Links point to your repository

### 5. Testing Files

- [ ] **test/sample-post.md**
  - [ ] Sample post is ready
  - [ ] Frontmatter is valid
  - [ ] Content is appropriate

## 🔨 Build Process

### Step 1: Install Dependencies

```bash
npm install
```

**Verify:**
- [ ] No errors during installation
- [ ] `node_modules/` directory created
- [ ] `package-lock.json` created

### Step 2: Build the Action

```bash
npm run build
```

**Verify:**
- [ ] Build completes successfully
- [ ] `dist/` directory created
- [ ] `dist/index.js` exists
- [ ] `dist/licenses.txt` exists
- [ ] No TypeScript errors

### Step 3: Test Locally (Optional but Recommended)

```bash
# Set your test API key
export DEVTO_API_KEY="your-test-key"

# Test with sample post
npx tsx scripts/publish-to-devto.ts test/sample-post.md
```

**Verify:**
- [ ] Script runs without errors
- [ ] Post is created on Dev.to (as draft)
- [ ] Output shows article URL and ID

## 📝 Pre-Commit Checklist

### Files to Commit

- [ ] **Source files**
  - [ ] `src/index.ts`
  - [ ] `action.yml`
  - [ ] `package.json`
  - [ ] `tsconfig.json`

- [ ] **Build output** (CRITICAL!)
  - [ ] `dist/index.js`
  - [ ] `dist/licenses.txt`
  - [ ] `dist/` directory is NOT in .gitignore

- [ ] **Documentation**
  - [ ] All `.md` files
  - [ ] `docs/` directory
  - [ ] Updated `CHANGELOG.md`

- [ ] **Configuration**
  - [ ] `.github/` directory
  - [ ] `.gitignore`
  - [ ] `LICENSE`

### Files to NOT Commit

- [ ] `node_modules/` (should be in .gitignore)
- [ ] `.env` files (should be in .gitignore)
- [ ] Personal test files
- [ ] `.DS_Store` (should be in .gitignore)

## 🚀 First Commit

```bash
# Check what will be committed
git status

# Add all files
git add .

# Verify dist/ is included
git status | grep dist/

# Commit
git commit -m "Initial setup of Publish to Dev.to Action"

# Push to GitHub
git push origin main
```

**Verify:**
- [ ] All files pushed successfully
- [ ] `dist/` directory is in the repository
- [ ] GitHub shows all files

## 🏷️ First Release

### Step 1: Verify Everything Works

- [ ] GitHub Actions workflows are enabled
- [ ] Build workflow runs successfully
- [ ] No errors in Actions tab

### Step 2: Create Release Tag

```bash
# Create annotated tag
git tag -a v1.0.0 -m "Initial release v1.0.0"

# Push tag
git push origin v1.0.0

# Also create v1 tag for major version
git tag -a v1 -m "Version 1"
git push origin v1
```

**Verify:**
- [ ] Tags appear in GitHub
- [ ] Release workflow runs
- [ ] Release is created automatically

### Step 3: Test the Action

Create a test repository and workflow:

```yaml
name: Test Action
on: workflow_dispatch

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-username/hugo-to-devto-action@v1
        with:
          api-key: ${{ secrets.DEVTO_API_KEY }}
          file-path: 'test.md'
```

**Verify:**
- [ ] Action runs successfully
- [ ] Post is published to Dev.to
- [ ] Outputs are set correctly

## 🎉 Post-Release Checklist

### GitHub Repository

- [ ] **Settings**
  - [ ] Description is set
  - [ ] Website URL is set (if applicable)
  - [ ] Topics/tags are added
  - [ ] License is visible

- [ ] **Actions**
  - [ ] All workflows are green
  - [ ] No failed runs

- [ ] **Releases**
  - [ ] v1.0.0 release exists
  - [ ] Release notes are complete
  - [ ] Assets are attached (if any)

### GitHub Marketplace (Optional)

- [ ] Action is published to Marketplace
- [ ] Category is set correctly
- [ ] Icon and color are displayed
- [ ] Description is compelling
- [ ] Tags are relevant

### Documentation

- [ ] README is clear and complete
- [ ] All links work
- [ ] Examples are tested
- [ ] Screenshots added (if applicable)

### Community

- [ ] CONTRIBUTING.md is clear
- [ ] Issue templates work
- [ ] PR template works
- [ ] Code of conduct (if applicable)

## 🐛 Troubleshooting

### Build Fails

```bash
# Clean and rebuild
rm -rf node_modules dist package-lock.json
npm install
npm run build
```

### dist/ Not Committed

```bash
# Check .gitignore
cat .gitignore | grep dist

# If dist/ is ignored, remove it from .gitignore
# Then commit
git add dist/
git commit -m "Add dist/ directory"
```

### Action Not Found

- Verify repository is public (or you have access)
- Check tag exists: `git tag -l`
- Verify action.yml is in repository root
- Check workflow syntax

### TypeScript Errors

```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npx tsc --noEmit

# Fix errors in src/index.ts
```

## ✨ Success Criteria

You're ready to release when:

- [x] All files are committed including `dist/`
- [x] Build completes without errors
- [x] Local testing works
- [x] Documentation is complete
- [x] All links work
- [x] GitHub Actions workflows pass
- [x] Test workflow using the action succeeds

## 📚 Next Steps

After successful first release:

1. **Announce** - Share your action with the community
2. **Monitor** - Watch for issues and feedback
3. **Iterate** - Improve based on user feedback
4. **Document** - Keep documentation up to date
5. **Maintain** - Regular updates and security patches

## 🆘 Need Help?

- Review [INITIAL_SETUP.md](INITIAL_SETUP.md)
- Check [docs/PROJECT_STRUCTURE.md](docs/PROJECT_STRUCTURE.md)
- Read [CONTRIBUTING.md](CONTRIBUTING.md)
- Open an issue on GitHub

---

**Ready to build?** Follow this checklist step by step and you'll have a working GitHub Action in no time! 🚀
