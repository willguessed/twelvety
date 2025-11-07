/**
 * File Manager
 * Handles file storage, CRUD operations, and file tree rendering
 */

export class FileManager {
    constructor() {
        this.files = new Map();
        this.currentFile = null;
        this.listeners = new Set();
        this.loadFromStorage();
    }

    /**
     * Add or update a file
     */
    addFile(path, content, metadata = {}) {
        const file = {
            path,
            content,
            metadata: {
                created: metadata.created || new Date().toISOString(),
                modified: new Date().toISOString(),
                ...metadata
            }
        };
        
        this.files.set(path, file);
        this.saveToStorage();
        this.notify('fileAdded', file);
        return file;
    }

    /**
     * Get a file by path
     */
    getFile(path) {
        return this.files.get(path);
    }

    /**
     * Update file content
     */
    updateFile(path, content) {
        const file = this.files.get(path);
        if (!file) return null;
        
        file.content = content;
        file.metadata.modified = new Date().toISOString();
        this.files.set(path, file);
        this.saveToStorage();
        this.notify('fileUpdated', file);
        return file;
    }

    /**
     * Delete a file
     */
    deleteFile(path) {
        const file = this.files.get(path);
        if (!file) return false;
        
        this.files.delete(path);
        this.saveToStorage();
        this.notify('fileDeleted', { path });
        return true;
    }

    /**
     * Rename a file
     */
    renameFile(oldPath, newPath) {
        const file = this.files.get(oldPath);
        if (!file) return false;
        
        file.path = newPath;
        file.metadata.modified = new Date().toISOString();
        this.files.delete(oldPath);
        this.files.set(newPath, file);
        this.saveToStorage();
        this.notify('fileRenamed', { oldPath, newPath, file });
        return true;
    }

    /**
     * Get all files
     */
    getAllFiles() {
        return Array.from(this.files.values());
    }

    /**
     * Get files by extension
     */
    getFilesByExtension(ext) {
        return this.getAllFiles().filter(f => f.path.endsWith(ext));
    }

    /**
     * Set current file
     */
    setCurrentFile(path) {
        this.currentFile = path;
        this.notify('currentFileChanged', { path });
    }

    /**
     * Get current file
     */
    getCurrentFile() {
        return this.currentFile ? this.getFile(this.currentFile) : null;
    }

    /**
     * Clear all files
     */
    clear() {
        this.files.clear();
        this.currentFile = null;
        this.saveToStorage();
        this.notify('filesCleared');
    }

    /**
     * Export project as JSON
     */
    exportProject() {
        const files = {};
        this.files.forEach((file, path) => {
            files[path] = {
                content: file.content,
                metadata: file.metadata
            };
        });
        
        return {
            version: '1.0.0',
            exported: new Date().toISOString(),
            files
        };
    }

    /**
     * Import project from JSON
     */
    importProject(data) {
        this.clear();
        
        Object.entries(data.files || {}).forEach(([path, fileData]) => {
            this.addFile(path, fileData.content, fileData.metadata);
        });
        
        this.notify('projectImported');
    }

    /**
     * Save to localStorage
     */
    saveToStorage() {
        try {
            const data = this.exportProject();
            localStorage.setItem('twelvety-workspace', JSON.stringify(data));
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
        }
    }

    /**
     * Load from localStorage
     */
    loadFromStorage() {
        try {
            const data = localStorage.getItem('twelvety-workspace');
            if (data) {
                this.importProject(JSON.parse(data));
            }
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
        }
    }

    /**
     * Subscribe to file events
     */
    on(callback) {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify listeners
     */
    notify(event, data) {
        this.listeners.forEach(callback => callback(event, data));
    }

    /**
     * Render file tree HTML
     */
    renderFileTree() {
        const files = this.getAllFiles();
        
        if (files.length === 0) {
            return `
                <div class="empty-state">
                    <p>No files loaded</p>
                    <p class="text-muted">Upload markdown files to get started</p>
                </div>
            `;
        }

        // Group files by directory
        const tree = {};
        files.forEach(file => {
            const parts = file.path.split('/');
            let current = tree;
            
            parts.forEach((part, i) => {
                if (i === parts.length - 1) {
                    // File
                    if (!current._files) current._files = [];
                    current._files.push(file);
                } else {
                    // Directory
                    if (!current[part]) current[part] = {};
                    current = current[part];
                }
            });
        });

        const renderNode = (node, path = '') => {
            let html = '';
            
            // Render directories
            Object.keys(node).forEach(key => {
                if (key === '_files') return;
                
                const dirPath = path ? `${path}/${key}` : key;
                html += `
                    <div class="file-tree-folder">
                        <div class="file-tree-item" data-type="folder" data-path="${dirPath}">
                            <span class="icon">📁</span>
                            <span>${key}</span>
                        </div>
                        <div class="file-tree-children">
                            ${renderNode(node[key], dirPath)}
                        </div>
                    </div>
                `;
            });
            
            // Render files
            if (node._files) {
                node._files.forEach(file => {
                    const icon = file.path.endsWith('.md') ? '📄' : '📋';
                    const active = file.path === this.currentFile ? 'active' : '';
                    html += `
                        <div class="file-tree-item ${active}" data-type="file" data-path="${file.path}">
                            <span class="icon">${icon}</span>
                            <span>${file.path.split('/').pop()}</span>
                        </div>
                    `;
                });
            }
            
            return html;
        };

        return renderNode(tree);
    }
}
