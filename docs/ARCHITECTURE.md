# Architecture

This document explains how the Publish to Dev.to Action works internally.

## High-Level Flow

```
┌─────────────────┐
│  GitHub Event   │
│  (push, manual) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  GitHub Actions │
│     Runner      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Action Starts  │
│  (dist/index.js)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read Inputs    │
│  - api-key      │
│  - file-path    │
│  - base-url     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Read Markdown  │
│      File       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Parse Frontmatter│
│   (YAML parser) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Build Article   │
│    Object       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Call Dev.to    │
│      API        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Set Outputs    │
│  - article-url  │
│  - article-id   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Action Complete│
└─────────────────┘
```

## Components

### 1. Action Definition (action.yml)

Defines the action's interface:
- **Inputs**: What the action receives
- **Outputs**: What the action returns
- **Runtime**: Node.js 20
- **Entry Point**: dist/index.js

### 2. Source Code (src/index.ts)

Main logic written in TypeScript:

```typescript
// 1. Get inputs from GitHub Actions
const apiKey = core.getInput('api-key');
const filePath = core.getInput('file-path');
const baseUrl = core.getInput('base-url');

// 2. Read and parse markdown file
const content = fs.readFileSync(filePath, 'utf-8');
const { frontmatter, markdown } = parseFrontmatter(content);

// 3. Build article object
const article = buildArticle(frontmatter, markdown, baseUrl);

// 4. Publish to Dev.to
const response = await publishToDevTo(article, apiKey);

// 5. Set outputs
core.setOutput('article-url', response.url);
core.setOutput('article-id', response.id);
```

### 3. Build Process

```
src/index.ts
     │
     ▼
TypeScript Compiler
     │
     ▼
JavaScript (CommonJS)
     │
     ▼
@vercel/ncc Bundler
     │
     ▼
dist/index.js (single file with all dependencies)
```

## Data Flow

### Input Processing

```
GitHub Workflow
     │
     ├─ api-key ────────┐
     ├─ file-path ──────┤
     └─ base-url ───────┤
                        │
                        ▼
                  Action Runtime
```

### Frontmatter Parsing

```
Markdown File
---
title: My Post
tags: tag1, tag2
draft: false
---
Content here...

     │
     ▼
Regex Match
     │
     ├─ Frontmatter Text ──┐
     └─ Markdown Content ──┤
                           │
                           ▼
                    YAML Parser
                           │
                           ▼
                    JavaScript Object
```

### Article Building

```
Frontmatter Object
     │
     ├─ title ──────────────┐
     ├─ description ────────┤
     ├─ tags ───────────────┤
     ├─ draft ──────────────┤
     ├─ series ─────────────┤
     ├─ canonicalURL ───────┤
     └─ eyecatch ───────────┤
                            │
Markdown Content ───────────┤
                            │
Base URL ───────────────────┤
                            │
                            ▼
                    Dev.to Article Object
                            │
                            ▼
                    {
                      title: "...",
                      published: true/false,
                      body_markdown: "...",
                      tags: [...],
                      canonical_url: "...",
                      ...
                    }
```

### API Communication

```
Article Object
     │
     ▼
JSON.stringify
     │
     ▼
HTTP POST Request
     │
     ├─ URL: https://dev.to/api/articles
     ├─ Headers:
     │    ├─ Content-Type: application/json
     │    └─ api-key: <user-key>
     └─ Body: { article: {...} }
     │
     ▼
Dev.to API
     │
     ▼
Response
     │
     ├─ url: "https://dev.to/..."
     ├─ id: 123456
     └─ ...
     │
     ▼
Action Outputs
```

## Error Handling

```
Try Block
     │
     ├─ File not found ────────┐
     ├─ Invalid frontmatter ───┤
     ├─ API error ─────────────┤
     └─ Network error ─────────┤
                               │
                               ▼
                        Catch Block
                               │
                               ▼
                        core.setFailed()
                               │
                               ▼
                        Action Fails
                               │
                               ▼
                        Workflow Stops
```

## Security Considerations

### 1. API Key Handling
- Never logged or exposed
- Passed via GitHub Secrets
- Used only in API request headers

### 2. Input Validation
- File path validated before reading
- Frontmatter format validated
- API responses validated

### 3. Network Security
- HTTPS only for API calls
- No sensitive data in logs
- Error messages sanitized

## Performance

### Execution Time
- Typical: 2-5 seconds
- Breakdown:
  - Action startup: ~1s
  - File reading: <100ms
  - Parsing: <100ms
  - API call: 1-3s
  - Output setting: <100ms

### Resource Usage
- Memory: ~50MB
- CPU: Minimal
- Network: Single API call (~10KB)

## Scalability

### Limitations
- Dev.to API rate limits apply
- One article per action invocation
- Sequential processing only

### Workarounds
- Use matrix strategy for multiple posts
- Add delays between requests
- Batch processing with loops

## Dependencies

### Runtime Dependencies
- `@actions/core` - GitHub Actions toolkit
  - Input/output handling
  - Logging
  - Error handling

### Build Dependencies
- `typescript` - Type checking and compilation
- `@vercel/ncc` - Bundling
- `@types/node` - TypeScript definitions

### No External Runtime Dependencies
All dependencies are bundled into `dist/index.js`, so the action has no external dependencies at runtime.

## Extension Points

### Adding New Frontmatter Fields

1. Update `HugoFrontmatter` interface
2. Update parser logic
3. Update `DevToArticle` interface if needed
4. Update article building logic

### Adding New Inputs

1. Add to `action.yml`
2. Read with `core.getInput()` in `src/index.ts`
3. Use in logic
4. Update documentation

### Adding New Outputs

1. Add to `action.yml`
2. Set with `core.setOutput()` in `src/index.ts`
3. Update documentation

## Testing Strategy

### Local Testing
- Use original `scripts/publish-to-devto.ts` script
- Test with sample markdown files
- Verify API responses

### CI Testing
- Build validation
- Syntax checking
- Integration tests with test posts

### Manual Testing
- workflow_dispatch trigger
- Test with real Dev.to account
- Verify published articles

## Monitoring

### Action Logs
- Input values (sanitized)
- Processing steps
- API responses (sanitized)
- Output values

### GitHub Actions Insights
- Execution time
- Success/failure rate
- Usage statistics

## Future Enhancements

Potential improvements:
- Support for updating existing articles
- Batch processing multiple files
- Image upload support
- Markdown transformation options
- Custom API endpoint support
- Dry-run mode
- Validation-only mode

## References

- [GitHub Actions Toolkit](https://github.com/actions/toolkit)
- [Dev.to API Documentation](https://developers.forem.com/api)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vercel ncc](https://github.com/vercel/ncc)
