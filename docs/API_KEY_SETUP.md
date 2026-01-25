# API Key Setup Guide

## Overview

The Dev.to API key is required **by users** of the action, not in this repository (unless you want to test).

## Who Needs the API Key?

### ❌ This Repository (hugo-to-devto-action)

**You DON'T need `DEVTO_API_KEY` here for:**
- Building the action
- CI/CD workflows (build, validate, release)
- Development
- Pull requests
- Merging to main

**You ONLY need it here for (optional):**
- Testing the action manually via test workflow
- Local testing with the standalone script

### ✅ User Repositories (e.g., Walsen/weblog)

**Users MUST set `DEVTO_API_KEY` in their repos to:**
- Use the action to publish posts
- Run their publishing workflows

## Setup for This Repository (Optional)

If you want to test the action in this repository:

### 1. Get Your Dev.to API Key

1. Go to https://dev.to/settings/extensions
2. Generate API Key
3. Copy the key

### 2. Add to GitHub Secrets

1. Go to repository Settings
2. Secrets and variables → Actions
3. New repository secret
4. Name: `DEVTO_API_KEY`
5. Value: Your API key
6. Add secret

### 3. Run Test Workflow

```bash
# Via GitHub UI
# Go to Actions → Test Action → Run workflow

# Via GitHub CLI
gh workflow run test.yml
```

**Note:** The test workflow will skip if `DEVTO_API_KEY` is not set.

## Setup for User Repositories (Required)

Users who want to use this action must set up the API key in their own repositories.

### Example: Walsen/weblog

**In the Walsen/weblog repository:**

1. **Get Dev.to API Key**
   - Go to https://dev.to/settings/extensions
   - Generate API Key
   - Copy the key

2. **Add to Repository Secrets**
   - Go to https://github.com/Walsen/weblog/settings/secrets/actions
   - New repository secret
   - Name: `DEVTO_API_KEY`
   - Value: API key
   - Add secret

3. **Use in Workflow**
   ```yaml
   # .github/workflows/publish-devto.yml
   - uses: Walsen/hugo-to-devto-action@v1
     with:
       api-key: ${{ secrets.DEVTO_API_KEY }}
       file-path: 'content/en/posts/my-post.md'
   ```

## Security Best Practices

### ✅ Do

1. **Use GitHub Secrets**
   ```yaml
   api-key: ${{ secrets.DEVTO_API_KEY }}
   ```

2. **Never commit API keys**
   ```bash
   # ❌ Wrong
   api-key: "abc123..."
   ```

3. **Use different keys for testing**
   - Production key in main repo
   - Test key for testing (if needed)

4. **Rotate keys periodically**
   - Generate new key
   - Update secret
   - Delete old key

### ❌ Don't

1. **Don't hardcode API keys**
   ```yaml
   # ❌ Never do this
   api-key: "my-secret-key"
   ```

2. **Don't commit .env files**
   ```bash
   # ❌ Don't commit
   DEVTO_API_KEY=abc123
   ```

3. **Don't share API keys**
   - Each user should have their own
   - Don't share in issues/PRs

4. **Don't use production keys for testing**
   - Use separate test account
   - Or mark posts as drafts

## Local Testing

### For Action Developers (This Repo)

```bash
# Set API key in environment
export DEVTO_API_KEY="your-test-key"

# Test with standalone script
npx tsx scripts/publish-to-devto.ts test/hugo-format-post.md

# Or create .env file (gitignored)
echo "DEVTO_API_KEY=your-test-key" > .env
source .env
npx tsx scripts/publish-to-devto.ts test/hugo-format-post.md
```

### For Action Users (Their Repos)

```bash
# In their repository (e.g., Walsen/weblog)
export DEVTO_API_KEY="their-api-key"
npx tsx scripts/publish-to-devto.ts content/en/posts/my-post.md
```

## API Key Permissions

The Dev.to API key needs these permissions:
- ✅ Create articles
- ✅ Update articles (if updating existing)
- ✅ Read articles (to check status)

**Note:** Dev.to API keys have full access by default.

## Multiple Environments

### Development vs Production

**Option 1: Same Key**
- Use `draft: true` for testing
- Use `draft: false` for production

**Option 2: Different Keys**
- Test key for development
- Production key for main branch

```yaml
# Use different secrets
- uses: Walsen/hugo-to-devto-action@v1
  with:
    api-key: ${{ github.ref == 'refs/heads/main' && secrets.DEVTO_API_KEY_PROD || secrets.DEVTO_API_KEY_TEST }}
    file-path: ${{ matrix.file }}
```

## Troubleshooting

### "API key not set" Error

**In this repo:**
- Optional - only needed for testing
- Set `DEVTO_API_KEY` secret if you want to test

**In user repos:**
- Required - needed to publish
- User must set `DEVTO_API_KEY` secret

### "Invalid API key" Error

**Check:**
1. API key is correct
2. API key is active (not revoked)
3. Secret name is exactly `DEVTO_API_KEY`
4. Secret is in the correct repository

**Solution:**
1. Go to https://dev.to/settings/extensions
2. Generate new API key
3. Update GitHub secret

### "Permission denied" Error

**Check:**
1. API key has correct permissions
2. Using correct Dev.to account

**Solution:**
- Regenerate API key
- Ensure using correct account

## FAQ

### Q: Do I need to set DEVTO_API_KEY in this repo?

**A:** No, unless you want to test the action manually. The action itself doesn't need it - users provide it when they use the action.

### Q: Where do users set their API key?

**A:** In their own repository secrets (e.g., Walsen/weblog → Settings → Secrets → DEVTO_API_KEY).

### Q: Can multiple users share one API key?

**A:** Not recommended. Each user/repository should have its own API key for security and tracking.

### Q: What if I don't have a Dev.to account?

**A:** You can still develop the action. Testing requires an account, but development doesn't.

### Q: How do I test without publishing to Dev.to?

**A:** Use `draft: true` in your test posts. They'll be created as drafts and won't be publicly visible.

## Summary

### This Repository (hugo-to-devto-action)

```
API Key Setup: Optional (for testing only)
Required for: Manual testing
Not required for: Building, CI/CD, development
```

### User Repositories (e.g., Walsen/weblog)

```
API Key Setup: Required
Required for: Publishing posts
Set in: Repository secrets
Used in: Workflow files
```

## Documentation

- **[GETTING_STARTED.md](GETTING_STARTED.md)** - User setup guide
- **[SETUP.md](SETUP.md)** - Detailed setup instructions
- **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Migration from script

---

**Remember:** Users set the API key in their repos, not here! 🔑
