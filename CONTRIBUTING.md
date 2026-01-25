# Contributing to Publish to Dev.to Action

Thank you for your interest in contributing! This document provides guidelines for contributing to this project.

## Development Setup

1. Fork and clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Make your changes in the `src/` directory

4. Build the action:
   ```bash
   npm run build
   ```

5. Test your changes locally using the original script:
   ```bash
   export DEVTO_API_KEY="your-test-api-key"
   npx tsx scripts/publish-to-devto.ts test/sample-post.md
   ```

## Building and Packaging

This action uses [@vercel/ncc](https://github.com/vercel/ncc) to compile the TypeScript code and bundle all dependencies into a single file.

**Important**: Always commit the compiled `dist/` directory along with your changes. This is required for GitHub Actions to work.

```bash
npm run build
git add dist/
git commit -m "Build action"
```

## Pull Request Process

1. Update the README.md with details of changes if applicable
2. Build the action and commit the `dist/` directory
3. Update the version number following [Semantic Versioning](https://semver.org/)
4. Create a pull request with a clear description of the changes

## Code Style

- Use TypeScript for all source code
- Follow existing code formatting
- Add comments for complex logic
- Use meaningful variable and function names

## Testing

Before submitting a PR:

1. Ensure the action builds without errors: `npm run build`
2. Test with a sample markdown file
3. Verify the action works in a test workflow

## Reporting Issues

When reporting issues, please include:

- A clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Sample markdown file (if applicable)
- Error messages or logs

## Feature Requests

Feature requests are welcome! Please:

- Check if the feature already exists or is planned
- Clearly describe the use case
- Explain how it would benefit users

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
