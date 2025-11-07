/**
 * Validator Module
 * Validates markdown frontmatter against JSON schema using AJV
 */

export class Validator {
    constructor() {
        this.schema = null;
        this.ajv = null;
        this.validate = null;
        this.init();
    }

    async init() {
        // Load schema from site.json
        try {
            const response = await fetch('/site.json');
            const siteData = await response.json();
            this.schema = siteData.frontmatterSchema;
        } catch (err) {
            console.error('Failed to load schema:', err);
        }

        // Load AJV from browserified bundle
        if (!window.Ajv) {
            await this.loadAjv();
        }

        if (this.schema && window.Ajv) {
            this.ajv = new window.Ajv({ allErrors: true });

            const addFormats = (window.Ajv && typeof window.Ajv.addFormats === 'function')
                ? window.Ajv.addFormats
                : window.ajvAddFormats;

            if (typeof addFormats === 'function') {
                addFormats(this.ajv);
            }

            this.validate = this.ajv.compile(this.schema);
        }
    }

    async loadAjv() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            const sitePrefix = (document.body && document.body.dataset && document.body.dataset.sitePrefix) || '/';
            const normalizedPrefix = sitePrefix.endsWith('/') ? sitePrefix : `${sitePrefix}/`;
            script.src = `${normalizedPrefix}js/vendor/ajv-bundle.js`;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load AJV bundle'));
            script.async = true;
            document.head.appendChild(script);
        });
    }

    validateMarkdown(markdown) {
        if (!this.validate) {
            return {
                valid: false,
                errors: [{ message: 'Validator not initialized' }]
            };
        }

        try {
            const { frontmatter } = this.parseFrontmatter(markdown);
            
            if (!frontmatter) {
                return {
                    valid: false,
                    errors: [{ message: 'No frontmatter found' }]
                };
            }

            const valid = this.validate(frontmatter);
            
            if (valid) {
                return { valid: true, errors: [] };
            }

            return {
                valid: false,
                errors: this.validate.errors.map(err => ({
                    path: err.instancePath,
                    message: err.message,
                    keyword: err.keyword,
                    params: err.params
                }))
            };
        } catch (err) {
            return {
                valid: false,
                errors: [{ message: err.message }]
            };
        }
    }

    parseFrontmatter(markdown) {
        const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
        
        if (!match) {
            return { frontmatter: null, content: markdown };
        }

        try {
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
                    // Parse integers
                    else if (/^\d+$/.test(value)) {
                        value = parseInt(value, 10);
                    }
                    // Parse booleans
                    else if (value === 'true') {
                        value = true;
                    } else if (value === 'false') {
                        value = false;
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
}
