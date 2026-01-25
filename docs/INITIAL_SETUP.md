# Initial Repository Setup

This guide is for maintainers setting up this action for the first time or forking it for their own use.

## Prerequisites

- Node.js 20 or higher
- npm or yarn
- Git

## Setup Steps

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/hugo-to-devto-action.git
cd hugo-to-devto-action
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- `@actions/core` - GitHub Actions toolkit
- `typescript` - TypeScript compiler
- `@vercel/ncc` - Bundler for GitHub Actions
- `@types/node` - TypeScript definitions

### 3. Build the Action

```bash
npm run build
```

This compiles `src/index.ts` and bundles it with dependencies into `dist/index.js`.

**Important**: The `dist/` directory must be committed to the repository!

### 4. Update Configuration

#### Update action.yml
Replace placeholder values:
```yaml
author: 'Your Name'  # Your name or organization
```

#### Update package.json
```json
{
  "author": "Your Name",
  "repository": {
    "type": "git",
    "url": "https://github.com/your-username/hugo-to-devto-action.git"
  }
}
```

#### Update README.md
Replace all instances of:
- `your-username` with your GitHub username
- `https://blog.walsen.website` with your default blog URL (or keep as is)

### 5. Set Up GitHub Repository

#### Enable GitHub Actions
1. Go to repository Settings → Actions → General
2. Ensure "Allow all actions and reusable workflows" is selected

#### Add Repository Secrets (for testing)
1. Go to Settings → Secrets and variables → Actions
2. Add `DEVTO_API_KEY` with your Dev.to API key

#### Enable GitHub Pages (optional)
If you want to host documentation:
1. Go to Settings → Pages
2. Source: Deploy from a branch
3. Branch: main, folder: /docs

### 6. Test the Action

#### Local Testing
```bash
# Set your Dev.to API key
export DEVTO_API_KEY="your-test-api-key"

# Test with the sample post
npx tsx scripts/publish-to-devto.ts test/sample-post.md
```

#### GitHub Actions Testing
1. Push your changes to GitHub
2. Go to Actions tab
3. Run "Test Action" workflow
4. Check the results

### 7. Create Initial Release

```bash
# Commit all changes
git add .
git commit -m "Initial setup"

# Create and push tag
git tag -a v1.0.0 -m "Initial release"
git push origin main --tags
```

The release workflow will automatically create a GitHub release.

### 8. Publish to GitHub Marketplace (Optional)

1. Go to your repository on GitHub
2. Click "Releases" → "Draft a new release"
3. Choose the v1.0.0 tag
4. Check "Publish this Action to the GitHub Marketplace"
5. Choose a category (e.g., "Publishing")
6. Add release notes
7. Click "Publish release"

## Customization

### Change Default Base URL

In `action.yml`:
```yaml
inputs:
  base-url:
    default: 'https://yourblog.com'  # Change this
```

In `src/index.ts`:
```typescript
const baseUrl = core.getInput('base-url') || 'https://yourblog.com';
```

### Add New Features

1. Edit `src/index.ts`
2. Add new inputs to `action.yml` if needed
3. Update documentation
4. Build: `npm run build`
5. Test locally and in GitHub Actions
6. Commit including `dist/`

### Modify Frontmatter Parsing

The frontmatter parser is in `src/index.ts`. To support additional fields:

```typescript
interface HugoFrontmatter {
  // Add new fields here
  newField?: string;
}

// Then use in article preparation
if (frontmatter.newField) {
  article.newField = frontmatter.newField;
}
```

## Maintenance

### Update Dependencies

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild
npm run build

# Test
npm test

# Commit
git add .
git commit -m "Update dependencies"
```

### Security Updates

GitHub will create Dependabot alerts for security issues. To fix:

```bash
# Update specific package
npm update package-name

# Or update all
npm audit fix

# Rebuild
npm run build
```

## Troubleshooting

### Build Fails

```bash
# Clean and reinstall
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### Action Not Working in GitHub

1. Check `dist/index.js` is committed
2. Verify `action.yml` syntax
3. Check workflow file syntax
4. Review action logs in GitHub

### TypeScript Errors

```bash
# Check TypeScript version
npx tsc --version

# Run type checking
npx tsc --noEmit
```

## File Checklist

Before first commit, ensure these files are ready:

- [ ] `action.yml` - Updated with your info
- [ ] `package.json` - Updated with your info
- [ ] `src/index.ts` - Reviewed and customized
- [ ] `dist/index.js` - Built and committed
- [ ] `README.md` - Updated with your username
- [ ] `LICENSE` - Appropriate license
- [ ] `.gitignore` - Excludes node_modules
- [ ] `test/sample-post.md` - Test file ready
- [ ] All documentation files reviewed

## Next Steps

1. ✅ Complete initial setup
2. ✅ Test locally
3. ✅ Test in GitHub Actions
4. ✅ Create first release
5. ✅ Update documentation
6. 📢 Announce your action!
7. 🎉 Start using it!

## Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Creating a JavaScript Action](https://docs.github.com/en/actions/creating-actions/creating-a-javascript-action)
- [Dev.to API Documentation](https://developers.forem.com/api)
- [Semantic Versioning](https://semver.org/)

## Support

If you run into issues during setup:
1. Check this guide thoroughly
2. Review [CONTRIBUTING.md](CONTRIBUTING.md)
3. Check [existing issues](https://github.com/your-username/hugo-to-devto-action/issues)
4. Open a new issue with details

Good luck with your action! 🚀
