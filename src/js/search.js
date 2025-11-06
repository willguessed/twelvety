// Search functionality using Lunr.js
(function() {
  let searchIndex;
  let searchData = [];
  const bodyEl = typeof document !== 'undefined' ? document.body : null;
  const rawPrefix = bodyEl?.dataset.sitePrefix || '';
  const searchIndexUrl = bodyEl?.dataset.searchIndex || '/search-index.json';
  const sitePrefix = rawPrefix.replace(/\/$/, '');
  
  // Initialize search when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSearch);
  } else {
    initSearch();
  }
  
  async function initSearch() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    // Load search index
    try {
      const response = await fetch(searchIndexUrl);
      searchData = await response.json();

      if (!Array.isArray(searchData)) {
        if (searchData && typeof searchData === 'object') {
          const potentialArray = Array.isArray(searchData.items) ? searchData.items : Object.values(searchData);
          searchData = Array.isArray(potentialArray) ? potentialArray : [];
        } else {
          searchData = [];
        }
      }

      // Build Lunr index
      searchIndex = lunr(function() {
        this.ref('url');
        this.field('title', { boost: 10 });
        this.field('content');
        this.field('tags', { boost: 5 });
        this.field('category', { boost: 3 });
        
        searchData.forEach(doc => {
          this.add(doc);
        });
      });
      
      console.log('Search index loaded:', searchData.length, 'documents');
    } catch (error) {
      console.error('Failed to load search index:', error);
    }
    
    // Set up event listeners
    searchInput.addEventListener('input', debounce(handleSearch, 300));
    searchInput.addEventListener('focus', handleFocus);
    
    // Close search results when clicking outside
    document.addEventListener('click', function(e) {
      if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.hidden = true;
      }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', handleKeyboard);
  }
  
  function handleSearch(e) {
    const query = e.target.value.trim();
    const searchResults = document.getElementById('search-results');
    
    if (!query || query.length < 2) {
      searchResults.hidden = true;
      return;
    }
    
    if (!searchIndex) {
      searchResults.innerHTML = '<div class="search-loading">Loading search index...</div>';
      searchResults.hidden = false;
      return;
    }
    
    try {
      // Perform search with wildcards for partial matching
      const results = searchIndex.search(query + '~1 ' + query + '*');
      
      if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found for "' + escapeHtml(query) + '"</div>';
        searchResults.hidden = false;
        return;
      }
      
      // Get full document data for results
      const resultDocs = results
        .slice(0, 10)
        .map(result => searchData.find(doc => doc.url === result.ref))
        .filter(Boolean);
      
      // Render results
      const sectionLabels = {
        legal: 'Legal & Policy Framework',
        knowledge: 'Knowledge Base',
        assessment: 'Assessment',
        interventions: 'Interventions',
        caseStudies: 'Case Studies',
        resources: 'Resources',
        feedback: 'Feedback',
        changelog: 'Change Log',
        help: 'Help & FAQs'
      };

      searchResults.innerHTML = resultDocs.map(doc => {
        const excerpt = getExcerpt(doc.content, query);
        const sectionLabel = sectionLabels[doc.section] || doc.section;
        let docUrl = doc.url || '#';
        if (!/^https?:\/\//i.test(docUrl)) {
          const normalizedPath = docUrl.startsWith('/') ? docUrl : `/${docUrl}`;
          docUrl = `${sitePrefix}${normalizedPath}`;
        }
        return `
          <a href="${docUrl}" class="search-result-item">
            <div class="search-result-title">${highlightText(doc.title, query)}</div>
            <div class="search-result-excerpt">${highlightText(excerpt, query)}</div>
            <div class="search-result-meta">
              <span class="search-result-section">${sectionLabel}</span>
              ${doc.category ? `<span class="search-result-category">${doc.category}</span>` : ''}
            </div>
          </a>
        `;
      }).join('');
      
      searchResults.hidden = false;
    } catch (error) {
      console.error('Search error:', error);
      searchResults.innerHTML = '<div class="search-no-results">Search error. Please try again.</div>';
      searchResults.hidden = false;
    }
  }
  
  function handleFocus(e) {
    if (e.target.value.trim().length >= 2) {
      handleSearch(e);
    }
  }
  
  function handleKeyboard(e) {
    const searchResults = document.getElementById('search-results');
    const items = searchResults.querySelectorAll('.search-result-item');
    
    if (e.key === 'Escape') {
      searchResults.hidden = true;
      e.target.blur();
    } else if (e.key === 'ArrowDown' && items.length > 0) {
      e.preventDefault();
      items[0].focus();
    }
  }
  
  function getExcerpt(content, query, maxLength = 150) {
    if (!content) return '';
    
    // Find the position of the query in the content
    const queryPos = content.toLowerCase().indexOf(query.toLowerCase());
    
    if (queryPos === -1) {
      // Query not found, return start of content
      return content.substring(0, maxLength) + (content.length > maxLength ? '...' : '');
    }
    
    // Calculate excerpt around the query
    const start = Math.max(0, queryPos - 50);
    const end = Math.min(content.length, queryPos + query.length + 100);
    
    let excerpt = content.substring(start, end);
    
    if (start > 0) excerpt = '...' + excerpt;
    if (end < content.length) excerpt = excerpt + '...';
    
    return excerpt;
  }
  
  function highlightText(text, query) {
    if (!text || !query) return text;
    
    const regex = new RegExp('(' + escapeRegex(query) + ')', 'gi');
    return text.replace(regex, '<mark class="search-highlight">$1</mark>');
  }
  
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  
  function escapeRegex(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func.apply(this, args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
})();
