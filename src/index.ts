import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Convert Hugo mermaid shortcodes to mermaid.ink image URLs
 * Hugo format: {{< mermaid >}} ... {{< /mermaid >}}
 * Dev.to format: ![Mermaid Diagram](https://mermaid.ink/img/base64encodedcontent)
 */
function convertMermaidToImages(markdown: string): string {
  // Match Hugo mermaid shortcodes: {{< mermaid >}} ... {{< /mermaid >}}
  // Also handles optional HTML wrapper like <div style="...">
  const mermaidRegex = /(?:<div[^>]*>\s*)?{{\s*<\s*mermaid\s*>\s*}}([\s\S]*?){{\s*<\s*\/mermaid\s*>\s*}}(?:\s*<\/div>)?/gi;
  
  let diagramCount = 0;
  
  return markdown.replace(mermaidRegex, (match, mermaidCode) => {
    diagramCount++;
    const trimmedCode = mermaidCode.trim();
    
    // Encode the mermaid code to base64 for mermaid.ink
    const base64Code = Buffer.from(trimmedCode).toString('base64');
    
    // Use mermaid.ink service to render the diagram as an image
    const imageUrl = `https://mermaid.ink/img/${base64Code}`;
    
    core.info(`   🎨 Converting mermaid diagram #${diagramCount} to image`);
    
    // Return markdown image syntax
    return `![Mermaid Diagram](${imageUrl})`;
  });
}

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
  title?: string;
  description?: string;
  publishdate?: string;
  draft?: boolean;
  tags?: string[];
  series?: string;
  canonicalURL?: string;
  eyecatch?: string;
}

async function run(): Promise<void> {
  try {
    const apiKey = core.getInput('api-key', { required: true });
    const filePath = core.getInput('file-path', { required: true });
    const baseUrl = core.getInput('base-url') || 'https://blog.walsen.website';

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Parse frontmatter manually (simple YAML parser)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    
    if (!frontmatterMatch) {
      throw new Error('Invalid frontmatter format');
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
    const slug = path.basename(filePath, '.md').toLowerCase().replace(/\s+/g, '-');
    const lang = filePath.includes('/en/') ? 'en' : 'es';
    const canonicalUrl = (frontmatter.canonicalURL && frontmatter.canonicalURL.trim() !== '') 
      ? frontmatter.canonicalURL 
      : `${baseUrl}/${lang}/posts/${slug}/`;

    // Validate required fields
    if (!frontmatter.title) {
      throw new Error('Title is required in frontmatter');
    }

    // Convert Hugo mermaid shortcodes to images for Dev.to
    const processedMarkdown = convertMermaidToImages(markdown);

    // Prepare dev.to article
    const article: DevToArticle = {
      title: frontmatter.title,
      published: !frontmatter.draft,
      body_markdown: processedMarkdown,
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

    core.info('📝 Publishing to dev.to...');
    core.info(`   Title: ${article.title}`);
    core.info(`   Status: ${article.published ? 'Published' : 'Draft'}`);
    core.info(`   Canonical: ${article.canonical_url}`);

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
      throw new Error(`Failed to publish: ${error}`);
    }

    const result = await response.json() as { url: string; id: number };
    core.info('✅ Published successfully!');
    core.info(`   URL: ${result.url}`);
    core.info(`   ID: ${result.id}`);

    core.setOutput('article-url', result.url);
    core.setOutput('article-id', result.id);
  } catch (error) {
    if (error instanceof Error) {
      core.setFailed(error.message);
    } else {
      core.setFailed('An unknown error occurred');
    }
  }
}

run();
