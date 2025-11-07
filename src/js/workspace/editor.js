/**
 * Editor Module
 * Simple textarea-based editor (CodeMirror can be added later)
 */

export class Editor {
    constructor(container) {
        this.container = container;
        this.textarea = null;
        this.currentFile = null;
        this.listeners = new Set();
        this.init();
    }

    init() {
        this.container.innerHTML = `
            <textarea 
                id="markdown-editor" 
                class="markdown-textarea"
                placeholder="Start writing markdown..."
                spellcheck="false"
            ></textarea>
        `;
        
        this.textarea = this.container.querySelector('#markdown-editor');
        
        // Listen for changes
        this.textarea.addEventListener('input', () => {
            this.notify('change', this.getValue());
        });
        
        // Auto-resize
        this.textarea.style.cssText = `
            width: 100%;
            height: 100%;
            padding: 1rem;
            border: none;
            font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
            font-size: 14px;
            line-height: 1.6;
            resize: none;
            outline: none;
            background: #fff;
            color: #333;
        `;
    }

    setValue(content) {
        if (this.textarea) {
            this.textarea.value = content || '';
        }
    }

    getValue() {
        return this.textarea ? this.textarea.value : '';
    }

    setFile(file) {
        this.currentFile = file;
        this.setValue(file ? file.content : '');
    }

    clear() {
        this.setValue('');
        this.currentFile = null;
    }

    focus() {
        if (this.textarea) {
            this.textarea.focus();
        }
    }

    on(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    notify(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }
}
