import * as core from '@actions/core';
import * as fs from 'fs';
import { buildArticle, parsePost } from './post';
import { fetchMyArticles, matchArticle, publishArticle, type Logger } from './devto';

const logger: Logger = {
  info: (msg) => core.info(msg),
  warning: (msg) => core.warning(msg),
};

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const filePath = core.getInput('file-path', { required: true });
    const baseUrl = core.getInput('base-url') || 'https://blog.walsen.website';
    const defaultLanguage = core.getInput('default-language') || 'en';
    const postsPath = core.getInput('posts-path') || 'posts';

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const { frontmatter, markdown } = parsePost(content);

    const { article, canonicalUrl, slug } = buildArticle(
      frontmatter,
      markdown,
      { filePath, baseUrl, defaultLanguage, postsPath },
      logger,
    );

    // Idempotency: look up an existing article and update it instead of
    // creating a duplicate. Forem has no DELETE for articles, so getting the
    // match right matters — canonical_url is the primary key, title the
    // (logged) fallback.
    core.info('🔎 Looking up existing articles on Dev.to…');
    const existing = await fetchMyArticles(apiKey, logger);
    const match = matchArticle(existing, canonicalUrl, article.title, logger);

    core.info(match ? '♻️  Updating existing Dev.to article…' : '📝 Publishing new article to Dev.to…');
    core.info(`   Title: ${article.title}`);
    core.info(`   Slug: ${slug}`);
    core.info(`   Status: ${article.published ? 'Published' : 'Draft'}`);
    core.info(`   Canonical: ${article.canonical_url}`);
    if (match) {
      core.info(`   Matched article ID: ${match.id}`);
    }

    const result = await publishArticle(apiKey, article, match?.id, logger);

    core.info(result.action === 'updated' ? '✅ Updated successfully!' : '✅ Published successfully!');
    core.info(`   URL: ${result.url}`);
    core.info(`   ID: ${result.id}`);
    core.info(`   Action: ${result.action}`);

    core.setOutput('article-url', result.url);
    core.setOutput('article-id', result.id);
    core.setOutput('action', result.action);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
