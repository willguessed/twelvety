/**
 * Preview Module
 * Renders markdown to HTML using markdown-it (CDN)
 */

export class Preview {
    constructor(container) {
        this.container = container;
        this.md = null;
        this.init();
    }

    async init() {
        // Load markdown-it from CDN
        if (!window.markdownit) {
            await this.loadMarkdownIt();
        }
        
        this.md = window.markdownit({
            html: true,
            linkify: true,
            typographer: true,
            breaks: true
        });
    }

    async loadMarkdownIt() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/markdown-it@13/dist/markdown-it.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    render(markdown) {
        if (!this.md) {
            this.container.innerHTML = '<p class="text-muted">Loading preview...</p>';
            return;
        }

        try {
            // Extract frontmatter
            const { frontmatter, content } = this.parseFrontmatter(markdown);
            
            // Render markdown
            const html = this.md.render(content);
            
            // Display with frontmatter info
            let output = '';
            
            if (frontmatter) {
                output += '<div class="preview-frontmatter">';
                output += '<h4>Frontmatter</h4>';
                output += '<table class="frontmatter-table">';
                output += '<tbody>';
                
                Object.entries(frontmatter).forEach(([key, value]) => {
                    let displayValue = value;
                    if (Array.isArray(value)) {
                        displayValue = value.join(', ');
                    } else if (typeof value === 'object') {
                        displayValue = JSON.stringify(value);
                    }
                    output += `<tr><td class="fm-key">${key}</td><td class="fm-value">${displayValue}</td></tr>`;
                });
                
                output += '</tbody>';
                output += '</table>';
                output += '</div>';
            }
            
            output += '<div class="preview-body">' + html + '</div>';
            
            this.container.innerHTML = output;
        } catch (err) {
            this.container.innerHTML = `
                <div class="preview-error">
                    <h4>Preview Error</h4>
                    <p>${err.message}</p>
                </div>
            `;
        }
    }

    parseFrontmatter(markdown) {
        const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
        
        if (!match) {
            return { frontmatter: null, content: markdown };
        }

        try {
            // Simple YAML parser (just key: value pairs)
            const frontmatterText = match[1];
            const frontmatter = {};
            
            frontmatterText.split('\n').forEach(line => {
                const colonIndex = line.indexOf(':');
                if (colonIndex > 0) {
                    const key = line.substring(0, colonIndex).trim();
                    let value = line.substring(colonIndex + 1).trim();
                    
                    // Parse arrays
                    if (value.startsWith('[') && value.endsWith(']')) {
                        value = value.slice(1, -1).split(',').map(v => v.trim().replace(/['"]/g, ''));
                    }
                    // Remove quotes
                    else if ((value.startsWith('"') && value.endsWith('"')) || 
                             (value.startsWith("'") && value.endsWith("'"))) {
                        value = value.slice(1, -1);
                    }
                    
                    frontmatter[key] = value;
                }
            });
            
            return { frontmatter, content: match[2] };
        } catch (err) {
            console.error('Frontmatter parse error:', err);
            return { frontmatter: null, content: markdown };
        }
    }

    clear() {
        this.container.innerHTML = '<p class="text-muted">No preview available</p>';
    }
}
