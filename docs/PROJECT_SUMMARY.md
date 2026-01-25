# Project Summary

## Overview

This repository contains a GitHub Action that automates publishing markdown blog posts to Dev.to. It's based on the original `publish-to-devto.ts` script and packaged as a reusable GitHub Action.

## What's Included

### Core Action Files
- `action.yml` - Action definition and interface
- `src/index.ts` - Main TypeScript source code
- `dist/index.js` - Compiled and bundled action (must be committed)
- `package.json` - Dependencies and build scripts
- `tsconfig.json` - TypeScript configuration

### Documentation
- `README.md` - Main documentation
- `GETTING_STARTED.md` - Quick 5-minute setup guide
- `SETUP.md` - Comprehensive setup instructions
- `INITIAL_SETUP.md` - Repository initialization guide
- `CONTRIBUTING.md` - Contribution guidelines
- `CHANGELOG.md` - Version history

### Extended Documentation (docs/)
- `QUICK_REFERENCE.md` - Cheat sheet
- `EXAMPLES.md` - Usage examples
- `ARCHITECTURE.md` - Technical architecture
- `PROJECT_STRUCTURE.md` - Repository organization
- `RELEASE_CHECKLIST.md` - Release process
- `README.md` - Documentation index

### Testing
- `test/sample-post.md` - Sample markdown file
- `.github/workflows/test.yml` - Test workflow
- `.github/workflows/build.yml` - Build validation

### CI/CD
- `.github/workflows/build.yml` - Build and validate
- `.github/workflows/test.yml` - Integration testing
- `.github/workflows/release.yml` - Release automation
- `.github/workflows/example-usage.yml` - Usage example

### Templates
- `.github/ISSUE_TEMPLATE/bug_report.md` - Bug report template
- `.github/ISSUE_TEMPLATE/feature_request.md` - Feature request template
- `.github/PULL_REQUEST_TEMPLATE.md` - PR template

### Scripts
- `scripts/setup.sh` - Development setup script
- `scripts/publish-to-devto.ts` - Original standalone script (for local testing)

## Key Features

✅ Publishes markdown files with YAML frontmatter to Dev.to  
✅ Supports draft and published status  
✅ Automatic canonical URL generation  
✅ Tag support (up to 4 tags)  
✅ Series support  
✅ Cover image support  
✅ Configurable base URL  
✅ Returns article URL and ID as outputs  
✅ Comprehensive error handling  
✅ Full TypeScript implementation  

## Quick Start for Users

1. Get Dev.to API key from https://dev.to/settings/extensions
2. Add `DEVTO_API_KEY` to GitHub Secrets
3. Create workflow file:
   ```yaml
   - uses: your-username/hugo-to-devto-action@v1
     with:
       api-key: ${{ secrets.DEVTO_API_KEY }}
       file-path: 'posts/my-post.md'
   ```
4. Run workflow and publish!

See [GETTING_STARTED.md](GETTING_STARTED.md) for detailed instructions.

## Quick Start for Developers

1. Clone repository
2. Run `npm install`
3. Make changes in `src/index.ts`
4. Run `npm run build`
5. Test locally with `scripts/publish-to-devto.ts`
6. Commit including `dist/`

See [INITIAL_SETUP.md](INITIAL_SETUP.md) for detailed instructions.

## Repository Structure

```
hugo-to-devto-action/
├── .github/              # GitHub-specific files
│   ├── workflows/        # CI/CD workflows
│   ├── ISSUE_TEMPLATE/   # Issue templates
│   └── PULL_REQUEST_TEMPLATE.md
├── docs/                 # Extended documentation
├── scripts/              # Helper scripts
├── src/                  # TypeScript source
├── test/                 # Test files
├── dist/                 # Compiled action (committed)
└── [documentation files]
```

## Technology Stack

- **Language**: TypeScript
- **Runtime**: Node.js 20
- **Build Tool**: @vercel/ncc
- **GitHub Actions**: @actions/core
- **API**: Dev.to REST API

## Documentation Map

### For End Users
1. Start: [GETTING_STARTED.md](GETTING_STARTED.md)
2. Reference: [QUICK_REFERENCE.md](QUICK_REFERENCE.md)
3. Examples: [EXAMPLES.md](EXAMPLES.md)
4. Troubleshooting: [SETUP.md](SETUP.md)

### For Contributors
1. Start: [INITIAL_SETUP.md](INITIAL_SETUP.md)
2. Guidelines: [CONTRIBUTING.md](../CONTRIBUTING.md)
3. Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
4. Structure: [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)

### For Maintainers
1. Release: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)
2. Changelog: [CHANGELOG.md](../CHANGELOG.md)

## Next Steps

### To Use This Action
1. Read [GETTING_STARTED.md](GETTING_STARTED.md)
2. Set up your Dev.to API key
3. Create a workflow
4. Publish your first post!

### To Customize This Action
1. Read [INITIAL_SETUP.md](INITIAL_SETUP.md)
2. Update configuration files
3. Build and test
4. Create your first release

### To Contribute
1. Read [CONTRIBUTING.md](CONTRIBUTING.md)
2. Fork the repository
3. Make your changes
4. Submit a pull request

## Support

- 📖 [Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/your-username/hugo-to-devto-action/issues)
- 💬 [Discussions](https://github.com/your-username/hugo-to-devto-action/discussions)

## License

MIT License - see [LICENSE](../LICENSE) file for details.

## Credits

Based on the `publish-to-devto.ts` script from the [Walsen/weblog](https://github.com/Walsen/weblog) repository.

---

**Ready to get started?** Choose your path:
- 👤 User: [GETTING_STARTED.md](GETTING_STARTED.md)
- 👨‍💻 Developer: [INITIAL_SETUP.md](INITIAL_SETUP.md)
- 🤝 Contributor: [CONTRIBUTING.md](../CONTRIBUTING.md)
