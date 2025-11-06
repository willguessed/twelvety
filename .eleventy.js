const syntaxHighlight = require("@11ty/eleventy-plugin-syntaxhighlight");

module.exports = function(eleventyConfig) {
  // GitHub Pages configuration
  let pathPrefix = process.env.ELEVENTY_PATH_PREFIX;

  if (!pathPrefix) {
    const repository = process.env.GITHUB_REPOSITORY || "";
    const repoName = repository.split("/")[1] || "";
    const isProjectPage = repoName && !repoName.endsWith(".github.io");

    pathPrefix = isProjectPage ? `/${repoName}` : "";
  }
  
  // Plugins
  eleventyConfig.addPlugin(syntaxHighlight);

  // Pass-through file copy
  eleventyConfig.addPassthroughCopy({ "src/css": "css" });
  eleventyConfig.addPassthroughCopy({ "src/js": "js" });
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy({ "node_modules/lunr/lunr.js": "js/vendor/lunr.js" });

  // ============================================
  // COLLECTIONS - Auto-generated from site.json sections
  // ============================================
  
  // Load site data to auto-create collections
  const siteData = require('./src/_data/site.json');
  
  siteData.sections.forEach(section => {
    const collectionKey = section.id.replace(/-/g, ''); // Remove hyphens for collection key
    eleventyConfig.addCollection(collectionKey, function(collectionApi) {
      return collectionApi.getFilteredByGlob(`content/${section.id}/**/*.md`);
    });
  });

  // ============================================
  // COMPUTED DATA - Auto-generate URLs from sectionId
  // ============================================
  
  eleventyConfig.addGlobalData('eleventyComputed', {
    permalink: data => {
      // If sectionId exists and no explicit permalink, auto-generate
      if (data.sectionId && !data.permalink) {
        return `/${data.sectionId}/`;
      }
      return data.permalink;
    }
  });

  // ============================================
  // FILTERS - Utility functions for templates
  // ============================================
  
  // Format dates in readable format
  eleventyConfig.addFilter("readableDate", dateObj => {
    return new Date(dateObj).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });

  // Map section IDs to collection keys (removes hyphens)
  eleventyConfig.addFilter("sectionCollectionKey", function(sectionId) {
    if (!sectionId) return '';
    // Collection keys have hyphens removed (e.g., "api-reference" → "apireference")
    return sectionId.replace(/-/g, '');
  });

  // Find a section by ID
  eleventyConfig.addFilter("findSection", function(sections, id) {
    if (!Array.isArray(sections) || !id) return null;
    return sections.find(section => section.id === id) || null;
  });

  // Filter items by category
  eleventyConfig.addFilter("filterByCategory", function(items, category) {
    if (!Array.isArray(items) || !category) return [];
    return items.filter(item => {
      const cat = item.data && item.data.category;
      if (Array.isArray(cat)) {
        return cat.includes(category);
      }
      return cat === category;
    });
  });

  // Display tags as HTML
  eleventyConfig.addFilter("tagList", tags => {
    if (!Array.isArray(tags)) return '';
    return tags.map(tag => `<span class="tag">${tag}</span>`).join(' ');
  });

  // ============================================
  // SEARCH INDEX - Auto-generates search data
  // ============================================
  
  eleventyConfig.addCollection("searchIndex", function(collectionApi) {
    const allContent = [];
    const seenUrls = new Set();

    function addItemToIndex(item, sectionId = '') {
      if (!item || !item.url || seenUrls.has(item.url)) {
        return;
      }

      const data = item.data || {};
      const bodyContent = item.template && item.template.frontMatter
        ? item.template.frontMatter.content
        : '';
      const fallbackText = data.description || data.summary || '';

      allContent.push({
        title: data.title || (sectionId ? sectionId.replace(/-/g, ' ') : 'Untitled'),
        content: bodyContent && bodyContent.trim().length > 0 ? bodyContent : fallbackText,
        url: item.url,
        tags: Array.isArray(data.tags) ? data.tags : [],
        category: data.category || sectionId || '',
        audience: Array.isArray(data.audience) ? data.audience : [],
        section: sectionId
      });

      seenUrls.add(item.url);
    }

    // Automatically include all sections from site.json in search
    // Only index markdown files; landing pages handled by search-index script
    siteData.sections.forEach(section => {
      const markdownItems = collectionApi.getFilteredByGlob(`content/${section.id}/**/*.md`);
      markdownItems.forEach(item => addItemToIndex(item, section.id));
    });

    return allContent;
  });

  // ============================================
  // CONFIGURATION
  // ============================================
  
  return {
    dir: {
      input: "content",
      includes: "../src/_includes",
      layouts: "../src/_layouts",
      data: "../src/_data",
      output: "_site"
    },
    templateFormats: ["md", "njk", "html"],
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    pathPrefix: pathPrefix
  };
};
