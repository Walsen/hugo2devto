#!/usr/bin/env node
/**
 * Publish Hugo blog posts to dev.to (manual helper).
 *
 * Shares the same conversion + idempotency logic as the GitHub Action
 * (`src/*`), so behaviour matches exactly.
 *
 * Usage:
 *   export DEVTO_API_KEY="your-api-key"
 *   npx tsx scripts/publish-to-devto.ts content/en/posts/my-post.md
 *
 * Optional env overrides:
 *   BASE_URL          (default https://blog.walsen.website)
 *   DEFAULT_LANGUAGE  (default en)
 *   POSTS_PATH        (default posts)
 */

import * as fs from 'fs';
import { buildArticle, parsePost } from '../src/post';
import { fetchMyArticles, matchArticle, publishArticle, type Logger } from '../src/devto';

const logger: Logger = {
  info: (msg) => console.log(msg),
  warning: (msg) => console.warn(`⚠️  ${msg}`),
};

async function publishToDevTo(filePath: string) {
  const apiKey = process.env.DEVTO_API_KEY;

  if (!apiKey) {
    console.error('❌ DEVTO_API_KEY environment variable not set');
    console.log('Get your API key from: https://dev.to/settings/extensions');
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  const baseUrl = process.env.BASE_URL || 'https://blog.walsen.website';
  const defaultLanguage = process.env.DEFAULT_LANGUAGE || 'en';
  const postsPath = process.env.POSTS_PATH || 'posts';

  const content = fs.readFileSync(filePath, 'utf-8');

  let parsed;
  try {
    parsed = parsePost(content);
  } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exit(1);
  }

  let built;
  try {
    built = buildArticle(
      parsed.frontmatter,
      parsed.markdown,
      { filePath, baseUrl, defaultLanguage, postsPath },
      logger,
    );
  } catch (error) {
    console.error(`❌ ${(error as Error).message}`);
    process.exit(1);
  }

  const { article, canonicalUrl, slug } = built;

  try {
    console.log('🔎 Looking up existing articles on Dev.to…');
    const existing = await fetchMyArticles(apiKey, logger);
    const match = matchArticle(existing, canonicalUrl, article.title, logger);

    console.log(match ? '♻️  Updating existing Dev.to article…' : '📝 Publishing new article to Dev.to…');
    console.log(`   Title: ${article.title}`);
    console.log(`   Slug: ${slug}`);
    console.log(`   Status: ${article.published ? 'Published' : 'Draft'}`);
    console.log(`   Canonical: ${article.canonical_url}`);
    if (match) {
      console.log(`   Matched article ID: ${match.id}`);
    }

    const result = await publishArticle(apiKey, article, match?.id, logger);
    console.log(result.action === 'updated' ? '✅ Updated successfully!' : '✅ Published successfully!');
    console.log(`   URL: ${result.url}`);
    console.log(`   ID: ${result.id}`);
    console.log(`   Action: ${result.action}`);
  } catch (error) {
    console.error('❌ Error:', (error as Error).message);
    process.exit(1);
  }
}

// Main
const filePath = process.argv[2];

if (!filePath) {
  console.error('Usage: npx tsx scripts/publish-to-devto.ts <path-to-markdown-file>');
  process.exit(1);
}

publishToDevTo(filePath);
