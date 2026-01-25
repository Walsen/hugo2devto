#!/usr/bin/env node
/**
 * Publish Hugo blog posts to dev.to
 * 
 * Usage:
 *   npm install --save-dev @types/node gray-matter
 *   export DEVTO_API_KEY="your-api-key"
 *   npx tsx scripts/publish-to-devto.ts content/en/posts/my-post.md
 */

import * as fs from 'fs';
import * as path from 'path';

interface DevToArticle {
  title: string;
  published: boolean;
  body_markdown: string;
  tags?: string[];
  series?: string;
  canonical_url?: string;
  description?: string;
  main_image?: string;
}

interface HugoFrontmatter {
  title: string;
  description?: string;
  publishdate?: string;
  draft?: boolean;
  tags?: string[];
  series?: string;
  canonicalURL?: string;
  eyecatch?: string;
}

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

  const content = fs.readFileSync(filePath, 'utf-8');
  
  // Parse frontmatter manually (simple YAML parser)
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  
  if (!frontmatterMatch) {
    console.error('❌ Invalid frontmatter format');
    process.exit(1);
  }

  const frontmatterText = frontmatterMatch[1];
  const markdown = frontmatterMatch[2].trim();

  // Parse YAML frontmatter
  const frontmatter: HugoFrontmatter = {};
  frontmatterText.split('\n').forEach(line => {
    const match = line.match(/^(\w+):\s*(.*)$/);
    if (match) {
      const [, key, value] = match;
      
      // Handle different value types
      let cleanValue = value.trim();
      
      // Remove quotes if present
      if ((cleanValue.startsWith('"') && cleanValue.endsWith('"')) ||
          (cleanValue.startsWith("'") && cleanValue.endsWith("'"))) {
        cleanValue = cleanValue.slice(1, -1);
      }
      
      // Skip empty values
      if (cleanValue === '') {
        return;
      }
      
      // Parse specific fields
      if (key === 'draft') {
        frontmatter[key] = cleanValue === 'true';
      } else if (key === 'tags') {
        // Handle both array format and comma-separated
        if (cleanValue.startsWith('[')) {
          // Array format: ["tag1", "tag2"]
          frontmatter[key] = cleanValue
            .replace(/[\[\]]/g, '')
            .split(',')
            .map(t => t.trim().replace(/^["']|["']$/g, ''));
        } else {
          // Comma-separated: tag1, tag2
          frontmatter[key] = cleanValue.split(',').map(t => t.trim());
        }
      } else if (['title', 'description', 'series', 'canonicalURL', 'eyecatch', 'publishdate'].includes(key)) {
        (frontmatter as any)[key] = cleanValue;
      }
      // Ignore other fields like toc, math, etc.
    }
  });

  // Build canonical URL if not set or empty
  const baseUrl = 'https://blog.walsen.website';
  const slug = path.basename(filePath, '.md').toLowerCase().replace(/\s+/g, '-');
  const lang = filePath.includes('/en/') ? 'en' : 'es';
  const canonicalUrl = (frontmatter.canonicalURL && frontmatter.canonicalURL.trim() !== '') 
    ? frontmatter.canonicalURL 
    : `${baseUrl}/${lang}/posts/${slug}/`;

  // Prepare dev.to article
  const article: DevToArticle = {
    title: frontmatter.title,
    published: !frontmatter.draft,
    body_markdown: markdown,
    canonical_url: canonicalUrl,
  };

  if (frontmatter.description) {
    article.description = frontmatter.description;
  }

  if (frontmatter.tags && frontmatter.tags.length > 0) {
    article.tags = frontmatter.tags.slice(0, 4); // dev.to allows max 4 tags
  }

  if (frontmatter.series) {
    article.series = frontmatter.series;
  }

  if (frontmatter.eyecatch) {
    article.main_image = frontmatter.eyecatch.startsWith('http') 
      ? frontmatter.eyecatch 
      : `${baseUrl}${frontmatter.eyecatch}`;
  }

  console.log('📝 Publishing to dev.to...');
  console.log(`   Title: ${article.title}`);
  console.log(`   Status: ${article.published ? 'Published' : 'Draft'}`);
  console.log(`   Canonical: ${article.canonical_url}`);

  try {
    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({ article }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Failed to publish:', error);
      process.exit(1);
    }

    const result = await response.json();
    console.log('✅ Published successfully!');
    console.log(`   URL: ${result.url}`);
    console.log(`   ID: ${result.id}`);
  } catch (error) {
    console.error('❌ Error:', error);
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
