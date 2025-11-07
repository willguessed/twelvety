/**
 * Frontmatter Editor Module
 * Visual form-based editor for markdown frontmatter
 */

export class FrontmatterEditor {
    constructor(container, schema) {
        this.container = container;
        this.schema = schema;
        this.frontmatter = {};
        this.listeners = new Set();
        this.collapsed = true;
        this.syncLock = false;
        this.lastModified = 'form';
        this.init();
    }

    init() {
        this.render();
        this.setupEventListeners();
    }

    render() {
        const editorHtml = `
            <div id="frontmatter-editor" class="frontmatter-editor ${this.collapsed ? 'collapsed' : ''}">
                <div class="fm-header">
                    <h3>Frontmatter</h3>
                    <button type="button" class="fm-toggle" aria-label="Toggle frontmatter editor">
                        <span class="icon">${this.collapsed ? '▶' : '▼'}</span>
                    </button>
                </div>
                <div class="fm-body" ${this.collapsed ? 'hidden' : ''}>
                    <form id="fm-form" class="fm-form">
                        ${this.renderFields()}
                    </form>
                </div>
            </div>
        `;

        // Insert before editor container
        const editorContainer = this.container.querySelector('#editor-container');
        if (editorContainer) {
            editorContainer.insertAdjacentHTML('beforebegin', editorHtml);
        }
    }

    renderFields() {
        return `
            ${this.renderLayoutField()}
            ${this.renderTitleField()}
            ${this.renderCategoryField()}
            ${this.renderDescriptionField()}
            ${this.renderTagsField()}
            ${this.renderAudienceField()}
            ${this.renderDateField('dateAdded', 'Date Added')}
            ${this.renderStatusField()}
            ${this.renderOptionalFields()}
        `;
    }

    renderLayoutField() {
        return `
            <div class="fm-field">
                <label for="fm-layout" class="fm-label required">Layout</label>
                <select id="fm-layout" class="fm-input" required>
                    <option value="content.njk">content.njk</option>
                    <option value="base.njk">base.njk</option>
                    <option value="section.njk">section.njk</option>
                    <option value="workspace.njk">workspace.njk</option>
                </select>
            </div>
        `;
    }

    renderTitleField() {
        return `
            <div class="fm-field">
                <label for="fm-title" class="fm-label required">Title</label>
                <input 
                    type="text" 
                    id="fm-title" 
                    class="fm-input" 
                    maxlength="200" 
                    required
                    placeholder="Page title"
                >
                <span class="fm-counter">0 / 200</span>
            </div>
        `;
    }

    renderCategoryField() {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="category">
                <label for="fm-category" class="fm-label required">Category</label>
                <select id="fm-category" class="fm-input" required>
                    <option value="">Select category...</option>
                    <option value="workspace">workspace</option>
                    <option value="docs">docs</option>
                    <option value="examples">examples</option>
                    <option value="api">api</option>
                    <option value="about">about</option>
                </select>
            </div>
        `;
    }

    renderDescriptionField() {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="description">
                <label for="fm-description" class="fm-label recommended">Description</label>
                <textarea 
                    id="fm-description" 
                    class="fm-input" 
                    rows="3" 
                    maxlength="160"
                    placeholder="Brief summary for SEO and preview (max 160 chars)"
                ></textarea>
                <span class="fm-counter">0 / 160</span>
            </div>
        `;
    }

    renderTagsField() {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="tags">
                <label for="fm-tags-input" class="fm-label">Tags</label>
                <div class="fm-tags-container">
                    <div class="fm-tags-list" id="fm-tags-list"></div>
                    <input 
                        type="text" 
                        id="fm-tags-input" 
                        class="fm-tags-input" 
                        placeholder="Add tag (lowercase, hyphenated)"
                    >
                </div>
                <span class="fm-help">Press Enter or comma to add. Max 10 tags.</span>
            </div>
        `;
    }

    renderAudienceField() {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="audience">
                <label class="fm-label">Audience</label>
                <div class="fm-checkbox-group">
                    <label class="fm-checkbox">
                        <input type="checkbox" name="audience" value="developers">
                        <span>Developers</span>
                    </label>
                    <label class="fm-checkbox">
                        <input type="checkbox" name="audience" value="designers">
                        <span>Designers</span>
                    </label>
                    <label class="fm-checkbox">
                        <input type="checkbox" name="audience" value="managers">
                        <span>Managers</span>
                    </label>
                    <label class="fm-checkbox">
                        <input type="checkbox" name="audience" value="students">
                        <span>Students</span>
                    </label>
                </div>
            </div>
        `;
    }

    renderDateField(id, label) {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="${id}">
                <label for="fm-${id}" class="fm-label">${label}</label>
                <input 
                    type="text" 
                    id="fm-${id}" 
                    class="fm-input fm-date" 
                    pattern="\\d{4}-\\d{2}-\\d{2}" 
                    placeholder="YYYY-MM-DD"
                >
                <span class="fm-help">Format: YYYY-MM-DD</span>
            </div>
        `;
    }

    renderStatusField() {
        return `
            <div class="fm-field" data-layout="content.njk" data-field="status">
                <label for="fm-status" class="fm-label">Status</label>
                <div class="fm-status-wrapper">
                    <select id="fm-status" class="fm-input">
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>
                    <span class="status-badge" id="fm-status-badge">published</span>
                </div>
            </div>
        `;
    }

    renderOptionalFields() {
        return `
            <div class="fm-section" data-layout="content.njk">
                <button type="button" class="fm-section-toggle" id="fm-optional-toggle">
                    <span class="icon">▶</span>
                    <span>Optional Fields</span>
                </button>
                <div class="fm-section-body" id="fm-optional-body" hidden>
                    ${this.renderDateField('lastReviewed', 'Last Reviewed')}
                    ${this.renderDateField('reviewDue', 'Review Due')}
                    <div class="fm-field" data-field="order">
                        <label for="fm-order" class="fm-label">Order</label>
                        <input type="number" id="fm-order" class="fm-input" min="0" placeholder="Display order">
                    </div>
                    <div class="fm-field" data-field="parent">
                        <label for="fm-parent" class="fm-label">Parent</label>
                        <input type="text" id="fm-parent" class="fm-input" placeholder="Parent page slug">
                    </div>
                    <div class="fm-field" data-field="source">
                        <label for="fm-source" class="fm-label">Source</label>
                        <input type="text" id="fm-source" class="fm-input" placeholder="Attribution or source">
                    </div>
                    <div class="fm-field" data-field="sourceUrl">
                        <label for="fm-sourceUrl" class="fm-label">Source URL</label>
                        <input type="url" id="fm-sourceUrl" class="fm-input" placeholder="https://example.com">
                    </div>
                </div>
            </div>
        `;
    }

    setupEventListeners() {
        // Toggle collapse
        const toggle = document.querySelector('.fm-toggle');
        if (toggle) {
            toggle.addEventListener('click', () => this.toggleCollapse());
        }

        // Optional fields toggle
        const optionalToggle = document.getElementById('fm-optional-toggle');
        if (optionalToggle) {
            optionalToggle.setAttribute('aria-expanded', 'false');
            optionalToggle.addEventListener('click', () => this.toggleOptionalFields());
        }

        // Layout change
        const layoutSelect = document.getElementById('fm-layout');
        if (layoutSelect) {
            layoutSelect.addEventListener('change', (e) => {
                this.updateFieldVisibility(e.target.value);
                this.handleFormChange();
            });
        }

        // Form field changes
        const form = document.getElementById('fm-form');
        if (form) {
            form.addEventListener('input', () => this.handleFormChange());
            form.addEventListener('change', () => this.handleFormChange());
        }

        // Character counters
        this.setupCharacterCounters();

        // Tags input
        this.setupTagsInput();

        // Status badge preview
        this.setupStatusBadge();
    }

    setupCharacterCounters() {
        const fields = [
            { id: 'fm-title', max: 200 },
            { id: 'fm-description', max: 160 }
        ];

        fields.forEach(({ id, max }) => {
            const input = document.getElementById(id);
            const counter = input?.nextElementSibling;
            if (input && counter && counter.classList.contains('fm-counter')) {
                input.addEventListener('input', () => {
                    const current = input.value.length;
                    counter.textContent = `${current} / ${max}`;
                    counter.classList.toggle('warning', current > max * 0.9);
                });
            }
        });
    }

    setupTagsInput() {
        const input = document.getElementById('fm-tags-input');
        if (!input) return;

        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                this.addTag(input.value.trim());
                input.value = '';
            }
        });

        input.addEventListener('blur', () => {
            if (input.value.trim()) {
                this.addTag(input.value.trim());
                input.value = '';
            }
        });
    }

    addTag(tag) {
        if (!tag) return;

        // Normalize: lowercase and hyphenate
        tag = tag.toLowerCase().replace(/\s+/g, '-');

        const tagsList = document.getElementById('fm-tags-list');
        const existingTags = Array.from(tagsList.querySelectorAll('.fm-tag')).map(el => el.dataset.tag);

        // Check max tags and uniqueness
        if (existingTags.length >= 10) {
            alert('Maximum 10 tags allowed');
            return;
        }

        if (existingTags.includes(tag)) {
            return; // Already exists
        }

        // Create tag chip
        const chip = document.createElement('span');
        chip.className = 'fm-tag';
        chip.dataset.tag = tag;
        chip.innerHTML = `
            ${tag}
            <button type="button" class="fm-tag-remove" aria-label="Remove tag">&times;</button>
        `;

        chip.querySelector('.fm-tag-remove').addEventListener('click', () => {
            chip.remove();
            this.handleFormChange();
        });

        tagsList.appendChild(chip);
        this.handleFormChange();
    }

    setupStatusBadge() {
        const statusSelect = document.getElementById('fm-status');
        const statusBadge = document.getElementById('fm-status-badge');

        if (statusSelect && statusBadge) {
            statusSelect.addEventListener('change', () => {
                statusBadge.textContent = statusSelect.value;
                statusBadge.className = `status-badge ${statusSelect.value}`;
            });
        }
    }

    toggleCollapse() {
        this.collapsed = !this.collapsed;
        const editor = document.getElementById('frontmatter-editor');
        const body = editor.querySelector('.fm-body');
        const icon = editor.querySelector('.fm-toggle .icon');

        editor.classList.toggle('collapsed', this.collapsed);
        body.hidden = this.collapsed;
        icon.textContent = this.collapsed ? '▶' : '▼';
    }

    toggleOptionalFields() {
        const body = document.getElementById('fm-optional-body');
        const toggle = document.getElementById('fm-optional-toggle');
        const icon = toggle ? toggle.querySelector('.icon') : null;

        if (body && icon) {
            const isOpen = !body.classList.contains('is-open');
            body.hidden = !isOpen;
            body.classList.toggle('is-open', isOpen);
            icon.textContent = isOpen ? '▼' : '▶';
            toggle.setAttribute('aria-expanded', String(isOpen));
        }
    }

    updateFieldVisibility(layout) {
        const visibility = {
            'content.njk': ['category', 'description', 'tags', 'audience', 'dateAdded', 'status'],
            'base.njk': ['description', 'tags'],
            'section.njk': ['description'],
            'workspace.njk': ['description']
        };

        const visibleFields = visibility[layout] || [];

        document.querySelectorAll('.fm-field[data-layout]').forEach(field => {
            const fieldName = field.dataset.field;
            const layoutReq = field.dataset.layout;

            if (layoutReq && layoutReq !== layout) {
                field.hidden = true;
            } else if (visibleFields.includes(fieldName)) {
                field.hidden = false;
            } else {
                field.hidden = true;
            }
        });

        // Hide optional section for non-content layouts
        const optionalSection = document.querySelector('.fm-section[data-layout]');
        if (optionalSection) {
            optionalSection.hidden = layout !== 'content.njk';
        }
    }

    handleFormChange() {
        if (this.syncLock) return;

        this.lastModified = 'form';
        const data = this.getData();
        this.notify('change', data);
    }

    getData() {
        const data = {};

        // Layout
        const layout = document.getElementById('fm-layout')?.value;
        if (layout) data.layout = layout;

        // Title
        const title = document.getElementById('fm-title')?.value;
        if (title) data.title = title;

        // Category
        const category = document.getElementById('fm-category')?.value;
        if (category) data.category = category;

        // Description
        const description = document.getElementById('fm-description')?.value;
        if (description) data.description = description;

        // Tags
        const tags = Array.from(document.querySelectorAll('.fm-tag')).map(el => el.dataset.tag);
        if (tags.length > 0) data.tags = tags;

        // Audience
        const audience = Array.from(document.querySelectorAll('input[name="audience"]:checked')).map(el => el.value);
        if (audience.length > 0) data.audience = audience;

        // Dates
        ['dateAdded', 'lastReviewed', 'reviewDue'].forEach(field => {
            const value = document.getElementById(`fm-${field}`)?.value;
            if (value) data[field] = value;
        });

        // Status
        const status = document.getElementById('fm-status')?.value;
        if (status) data.status = status;

        // Optional fields
        ['order', 'parent', 'source', 'sourceUrl'].forEach(field => {
            const value = document.getElementById(`fm-${field}`)?.value;
            if (value) {
                data[field] = field === 'order' ? parseInt(value, 10) : value;
            }
        });

        return data;
    }

    setData(frontmatter) {
        this.syncLock = true;
        this.frontmatter = frontmatter || {};

        // Layout
        const layout = document.getElementById('fm-layout');
        if (layout && frontmatter.layout) {
            layout.value = frontmatter.layout;
            this.updateFieldVisibility(frontmatter.layout);
        }

        // Title
        const title = document.getElementById('fm-title');
        if (title) title.value = frontmatter.title || '';

        // Category
        const category = document.getElementById('fm-category');
        if (category) category.value = frontmatter.category || '';

        // Description
        const description = document.getElementById('fm-description');
        if (description) description.value = frontmatter.description || '';

        // Tags
        const tagsList = document.getElementById('fm-tags-list');
        if (tagsList) {
            tagsList.innerHTML = '';
            if (Array.isArray(frontmatter.tags)) {
                frontmatter.tags.forEach(tag => this.addTag(tag));
            }
        }

        // Audience
        document.querySelectorAll('input[name="audience"]').forEach(checkbox => {
            checkbox.checked = Array.isArray(frontmatter.audience) && 
                               frontmatter.audience.includes(checkbox.value);
        });

        // Dates
        ['dateAdded', 'lastReviewed', 'reviewDue'].forEach(field => {
            const input = document.getElementById(`fm-${field}`);
            if (input) input.value = frontmatter[field] || '';
        });

        // Status
        const status = document.getElementById('fm-status');
        const statusBadge = document.getElementById('fm-status-badge');
        if (status) {
            status.value = frontmatter.status || 'published';
            if (statusBadge) {
                statusBadge.textContent = status.value;
                statusBadge.className = `status-badge ${status.value}`;
            }
        }

        // Optional fields
        ['order', 'parent', 'source', 'sourceUrl'].forEach(field => {
            const input = document.getElementById(`fm-${field}`);
            if (input) input.value = frontmatter[field] || '';
        });

        const optionalBody = document.getElementById('fm-optional-body');
        const optionalToggle = document.getElementById('fm-optional-toggle');
        const optionalIcon = optionalToggle ? optionalToggle.querySelector('.icon') : null;

        if (optionalBody && optionalToggle && optionalIcon) {
            const hasOptionalValues = ['lastReviewed', 'reviewDue', 'order', 'parent', 'source', 'sourceUrl']
                .some(field => Boolean(frontmatter[field]));

            optionalBody.hidden = !hasOptionalValues;
            optionalBody.classList.toggle('is-open', hasOptionalValues);
            optionalIcon.textContent = hasOptionalValues ? '▼' : '▶';
            optionalToggle.setAttribute('aria-expanded', String(hasOptionalValues));
        }

        // Update character counters
        ['fm-title', 'fm-description'].forEach(id => {
            const input = document.getElementById(id);
            if (input) input.dispatchEvent(new Event('input'));
        });

        setTimeout(() => this.syncLock = false, 100);
    }

    generateYAML(frontmatter) {
        const lines = [];

        // Order matters for readability
        const order = ['layout', 'title', 'category', 'description', 'tags', 'audience', 
                      'dateAdded', 'lastReviewed', 'reviewDue', 'status', 'order', 
                      'parent', 'source', 'sourceUrl'];

        order.forEach(key => {
            if (frontmatter[key] !== undefined && frontmatter[key] !== '') {
                const value = frontmatter[key];

                if (Array.isArray(value)) {
                    lines.push(`${key}: [${value.map(v => `"${v}"`).join(', ')}]`);
                } else if (typeof value === 'string') {
                    lines.push(`${key}: ${value}`);
                } else {
                    lines.push(`${key}: ${value}`);
                }
            }
        });

        return lines.join('\n');
    }

    on(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }
}
