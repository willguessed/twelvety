#!/usr/bin/env node

/**
 * Search Index Generator
 * 
 * Generates a Lunr.js search index from all markdown content files.
 * Run after Eleventy build to create searchable index.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');
const lunr = require('lunr');
const matter = require('gray-matter');

const SITE_OUTPUT = '_site';
const SEARCH_INDEX_FILE = path.join(SITE_OUTPUT, 'search-index.json');

function deriveSectionFromPath(filePath) {
  if (!filePath) return 'general';
  const relative = filePath.replace(/^content[\\/]/, '');
  const parts = relative.split(/[\\/]/);
  return parts.length > 0 && parts[0] ? parts[0] : 'general';
}

function generateSearchIndex() {
  console.log('📚 Generating search index...\n');

  if (!fs.existsSync(SITE_OUTPUT)) {
    console.error(`❌ Error: Output directory '${SITE_OUTPUT}' does not exist.`);
    console.error('   Run "npm run build" first to generate the site.\n');
    process.exit(1);
  }

  const documents = [];
  const markdownFiles = glob.sync('content/**/*.md', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/_site/**']
  });

  const sectionPages = glob.sync('content/**/index.njk', {
    cwd: process.cwd(),
    ignore: ['**/node_modules/**', '**/_site/**', 'content/search-index.njk']
  });

  const contentFiles = Array.from(new Set([...markdownFiles, ...sectionPages]));

  console.log(`   Found ${contentFiles.length} content files\n`);

  if (contentFiles.length === 0) {
    console.warn('⚠️  Warning: No content files found. Search index will be empty.\n');
  }

  contentFiles.forEach((file, index) => {
    try {
      const fileContents = fs.readFileSync(file, 'utf-8');
      const { data: frontmatter, content: body } = matter(fileContents);

      // Generate URL from file path
      let url = file
        .replace(/^content[\\/]/, '/')
        .replace(/\.md$/, '/')
        .replace(/index\.njk$/, '/')
        .replace(/\\/g, '/'); // Windows path fix

      if (url.endsWith('//')) {
        url = url.replace(/\/\//g, '/');
      }
      if (url !== '/' && url.endsWith('/index/')) {
        url = url.replace(/\/index\//, '/');
      }

      const fallbackText = [
        frontmatter.description,
        frontmatter.summary,
        Array.isArray(frontmatter.tags) ? frontmatter.tags.join(' ') : ''
      ].filter(Boolean).join(' ');

      const sourceText = body && body.trim().length > 0 ? body : fallbackText;

      // Extract text content (remove markdown syntax for better search)
      const plainText = (sourceText || '')
        .toString()
        .replace(/```[\s\S]*?```/g, '') // Remove code blocks
        .replace(/`[^`]+`/g, '') // Remove inline code
        .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Keep link text only
        .replace(/#+ /g, '') // Remove heading markers
        .replace(/[*_~]/g, ''); // Remove emphasis markers

      const doc = {
        id: file,
        title: frontmatter.title || (frontmatter.sectionId ? frontmatter.sectionId.replace(/-/g, ' ') : 'Untitled'),
        url,
        content: plainText.slice(0, 1000), // First 1000 chars for preview
        category: frontmatter.category || frontmatter.sectionId || deriveSectionFromPath(file),
        tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
        audience: Array.isArray(frontmatter.audience) ? frontmatter.audience : [],
        dateAdded: frontmatter.dateAdded || new Date().toISOString().split('T')[0]
      };

      documents.push(doc);
      
      if ((index + 1) % 10 === 0) {
        process.stdout.write(`   Processed ${index + 1}/${contentFiles.length} files...\r`);
      }
    } catch (err) {
      console.error(`\n⚠️  Error processing ${file}:`, err.message);
    }
  });

  if (contentFiles.length > 0) {
    console.log(`   Processed ${contentFiles.length}/${contentFiles.length} files... Done!\n`);
  }

  // Build Lunr search index
  console.log('🔍 Building search index...');
  
  const idx = lunr(function() {
    this.ref('id');
    
    // Configure fields with boost values
    this.field('title', { boost: 10 });
    this.field('content', { boost: 5 });
    this.field('tags', { boost: 8 });
    this.field('category', { boost: 3 });

    // Add documents to index
    documents.forEach(doc => {
      this.add({
        id: doc.id,
        title: doc.title,
        content: doc.content,
        tags: doc.tags.join(' '),
        category: doc.category
      });
    });
  });

  // Prepare output data
  const indexData = {
    version: '1.0.0',
    generatedAt: new Date().toISOString(),
    documentCount: documents.length,
    documents: documents.map(doc => ({
      id: doc.id,
      title: doc.title,
      url: doc.url,
      category: doc.category,
      tags: doc.tags,
      audience: doc.audience,
      dateAdded: doc.dateAdded,
      preview: doc.content.slice(0, 200) // Short preview
    })),
    index: idx.toJSON()
  };

  // Write to file
  fs.writeFileSync(
    SEARCH_INDEX_FILE, 
    JSON.stringify(indexData, null, 2),
    'utf-8'
  );

  const fileSizeKb = (fs.statSync(SEARCH_INDEX_FILE).size / 1024).toFixed(2);
  
  console.log(`\n✅ Search index generated successfully!`);
  console.log(`   File: ${SEARCH_INDEX_FILE}`);
  console.log(`   Documents: ${documents.length}`);
  console.log(`   Size: ${fileSizeKb} KB\n`);
}

// Run if called directly
if (require.main === module) {
  try {
    generateSearchIndex();
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message);
    if (process.env.DEBUG) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

module.exports = { generateSearchIndex };
