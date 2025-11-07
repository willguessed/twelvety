/**
 * Workspace Main Module
 * Orchestrates all workspace functionality
 */

import { FileManager } from './fileManager.js';
import { Editor } from './editor.js';
import { Preview } from './preview.js';
import { Validator } from './validator.js';
import { FrontmatterEditor } from './frontmatterEditor.js';

class Workspace {
    constructor() {
        this.fileManager = new FileManager();
        this.editor = null;
        this.preview = null;
        this.validator = new Validator();
        this.frontmatterEditor = null;
        this.currentTab = 'editor';
        this.hasUnsavedChanges = false;
        this.editorSyncEnabled = true;
        
        this.init();
    }

    async init() {
        // Wait for validator to load schema
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Initialize editor and preview
        const editorPanel = document.getElementById('editor-panel');
        const editorContainer = document.getElementById('editor-container');
        const previewContainer = document.querySelector('#preview-panel .preview-content');
        
        if (editorContainer) {
            this.editor = new Editor(editorContainer);
            this.editor.on((event, data) => this.handleEditorEvent(event, data));
        }
        
        if (previewContainer) {
            this.preview = new Preview(previewContainer);
        }

        // Initialize frontmatter editor
        if (editorPanel && this.validator.schema) {
            this.frontmatterEditor = new FrontmatterEditor(editorPanel, this.validator.schema);
            this.frontmatterEditor.on((event, data) => this.handleFrontmatterEvent(event, data));
        }

        // Set up event listeners
        this.setupEventListeners();
        
        // Listen to file manager events
        this.fileManager.on((event, data) => this.handleFileEvent(event, data));
        
        // Render initial state
        this.renderFileTree();
        this.updateUI();
    }

    setupEventListeners() {
        // Upload button
        const uploadBtn = document.getElementById('upload-btn');
        const uploadModal = document.getElementById('upload-modal');
        const fileInput = document.getElementById('file-input');
        const browseBtn = document.getElementById('browse-files-btn');
        const uploadZone = document.getElementById('upload-zone');
        
        if (uploadBtn) {
            uploadBtn.addEventListener('click', () => {
                uploadModal.removeAttribute('hidden');
            });
        }

        if (browseBtn) {
            browseBtn.addEventListener('click', () => {
                fileInput.click();
            });
        }

        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                this.handleFileUpload(e.target.files);
                uploadModal.setAttribute('hidden', '');
            });
        }

        // Drag and drop
        if (uploadZone) {
            uploadZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                uploadZone.classList.add('drag-over');
            });

            uploadZone.addEventListener('dragleave', () => {
                uploadZone.classList.remove('drag-over');
            });

            uploadZone.addEventListener('drop', (e) => {
                e.preventDefault();
                uploadZone.classList.remove('drag-over');
                this.handleFileUpload(e.dataTransfer.files);
                uploadModal.setAttribute('hidden', '');
            });
        }

        // Modal close
        const modalClose = document.querySelector('.modal-close');
        if (modalClose) {
            modalClose.addEventListener('click', () => {
                uploadModal.setAttribute('hidden', '');
            });
        }

        // New file button
        const newFileBtn = document.getElementById('new-file-btn');
        if (newFileBtn) {
            newFileBtn.addEventListener('click', () => this.createNewFile());
        }

        // Delete file button
        const deleteFileBtn = document.getElementById('delete-file-btn');
        if (deleteFileBtn) {
            deleteFileBtn.addEventListener('click', () => this.deleteCurrentFile());
        }

        // Export button
        const exportBtn = document.getElementById('export-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportProject());
        }

        // Save button
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => this.saveCurrentFile());
        }

        // Tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Validate all button
        const validateAllBtn = document.getElementById('validate-all-btn');
        if (validateAllBtn) {
            validateAllBtn.addEventListener('click', () => this.validateAllFiles());
        }

        // Build button
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn) {
            buildBtn.addEventListener('click', () => this.triggerBuild());
        }

        // File tree clicks
        const fileTree = document.getElementById('file-tree');
        if (fileTree) {
            fileTree.addEventListener('click', (e) => {
                const item = e.target.closest('.file-tree-item');
                if (item && item.dataset.type === 'file') {
                    this.openFile(item.dataset.path);
                }
            });
        }

        // Filename click to rename
        const currentFileSpan = document.getElementById('current-file');
        if (currentFileSpan) {
            currentFileSpan.addEventListener('click', () => this.renameCurrentFile());
        }
    }

    handleFileUpload(files) {
        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const content = e.target.result;
                const path = file.name;
                this.fileManager.addFile(path, content);
            };
            reader.readAsText(file);
        });
    }

    createNewFile() {
        const filename = prompt('Enter filename (e.g., my-page.md):');
        if (!filename) return;

        const title = filename.replace('.md', '').replace(/-/g, ' ');
        const titleCase = title.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        
        const template = `---
layout: content.njk
title: ${titleCase}
category: docs
tags: []
audience: ["developers"]
dateAdded: ${new Date().toISOString().split('T')[0]}
status: published
---

# ${titleCase}

Start writing your content here...
`;

        this.fileManager.addFile(filename, template);
        this.openFile(filename);
    }

    deleteCurrentFile() {
        const currentFile = this.fileManager.getCurrentFile();
        if (!currentFile) return;

        if (confirm(`Delete "${currentFile.path}"? This cannot be undone.`)) {
            this.fileManager.deleteFile(currentFile.path);
            this.hasUnsavedChanges = false;
            this.editor.clear();
            this.updateUI();
        }
    }

    renameCurrentFile() {
        const currentFile = this.fileManager.getCurrentFile();
        if (!currentFile) return;

        const currentFileSpan = document.getElementById('current-file');
        const newName = prompt(`Rename file:\n\nCurrent: ${currentFile.path}`, currentFile.path);
        
        if (newName && newName !== currentFile.path) {
            this.fileManager.renameFile(currentFile.path, newName);
            this.fileManager.setCurrentFile(newName);
            this.updateUI();
        }
    }

    openFile(path) {
        const file = this.fileManager.getFile(path);
        if (!file) return;

        this.fileManager.setCurrentFile(path);
        this.editor.setFile(file);
        this.updatePreview(file.content);
        this.validateFile(file.content);
        
        // Populate frontmatter editor
        if (this.frontmatterEditor) {
            this.syncEditorToFrontmatter(file.content);
        }
        
        this.updateUI();
    }

    saveCurrentFile() {
        const currentFile = this.fileManager.getCurrentFile();
        if (!currentFile) return;

        const content = this.editor.getValue();
        this.fileManager.updateFile(currentFile.path, content);
        this.hasUnsavedChanges = false;
        this.updateUI();
    }

    handleEditorEvent(event, data) {
        if (event === 'change') {
            this.hasUnsavedChanges = true;
            this.updatePreview(data);
            this.validateFile(data);
            this.updateSaveButton();
            
            // Sync editor changes to frontmatter form (debounced)
            if (this.editorSyncEnabled && this.frontmatterEditor) {
                this.syncEditorToFrontmatter(data);
            }
        }
    }

    handleFrontmatterEvent(event, data) {
        if (event === 'change') {
            this.syncFrontmatterToEditor(data);
        }
    }

    syncFrontmatterToEditor(frontmatter) {
        if (!this.frontmatterEditor || !this.editor) return;
        
        // Temporarily disable editor sync to prevent loop
        this.editorSyncEnabled = false;
        
        const yaml = this.frontmatterEditor.generateYAML(frontmatter);
        const currentMarkdown = this.editor.getValue();
        const contentMatch = currentMarkdown.match(/^---\s*\n[\s\S]*?\n---\s*\n([\s\S]*)$/);
        const content = contentMatch ? contentMatch[1] : currentMarkdown;
        
        const newMarkdown = `---\n${yaml}\n---\n${content}`;
        this.editor.setValue(newMarkdown);
        
        this.hasUnsavedChanges = true;
        this.updateSaveButton();
        this.updatePreview(newMarkdown);
        this.validateFile(newMarkdown);
        
        // Re-enable editor sync after a delay
        setTimeout(() => {
            this.editorSyncEnabled = true;
        }, 500);
    }

    syncEditorToFrontmatter(markdown) {
        if (!this.frontmatterEditor) return;
        
        // Debounce to avoid excessive parsing
        clearTimeout(this.editorSyncTimeout);
        this.editorSyncTimeout = setTimeout(() => {
            try {
                const match = markdown.match(/^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/);
                if (match) {
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
                    
                    this.frontmatterEditor.setData(frontmatter);
                }
            } catch (err) {
                console.error('Failed to sync editor to frontmatter:', err);
            }
        }, 500);
    }

    handleFileEvent(event, data) {
        if (event === 'fileAdded' || event === 'fileDeleted' || event === 'filesCleared') {
            this.renderFileTree();
            this.updateUI();
        }
    }

    renderFileTree() {
        const fileTree = document.getElementById('file-tree');
        if (fileTree) {
            fileTree.innerHTML = this.fileManager.renderFileTree();
        }
    }

    updatePreview(markdown) {
        if (this.preview) {
            this.preview.render(markdown);
        }
    }

    async validateFile(markdown) {
        const result = await this.validator.validateMarkdown(markdown);
        this.displayValidationResults(result);
    }

    displayValidationResults(result) {
        const statusBadge = document.getElementById('validation-status');
        const validationResults = document.getElementById('validation-results');

        if (statusBadge) {
            if (result.valid) {
                statusBadge.textContent = '✓ Valid';
                statusBadge.className = 'status-badge valid';
            } else {
                statusBadge.textContent = '✗ Invalid';
                statusBadge.className = 'status-badge invalid';
            }
        }

        if (validationResults) {
            if (result.valid) {
                validationResults.innerHTML = '<p class="text-muted">✓ No validation errors</p>';
            } else {
                let html = '';
                result.errors.forEach(err => {
                    html += `
                        <div class="validation-error">
                            <strong>${err.path || 'Frontmatter'}</strong>: ${err.message}
                        </div>
                    `;
                });
                validationResults.innerHTML = html;
            }
        }
    }

    async validateAllFiles() {
        const files = this.fileManager.getFilesByExtension('.md');
        let allValid = true;
        let errorCount = 0;

        for (const file of files) {
            const result = await this.validator.validateMarkdown(file.content);
            if (!result.valid) {
                allValid = false;
                errorCount += result.errors.length;
            }
        }

        const validationResults = document.getElementById('validation-results');
        if (validationResults) {
            if (allValid) {
                validationResults.innerHTML = `<p class="text-muted">✓ All ${files.length} files are valid</p>`;
            } else {
                validationResults.innerHTML = `<p class="validation-error">✗ Found ${errorCount} errors in ${files.length} files</p>`;
            }
        }

        // Enable/disable build button
        const buildBtn = document.getElementById('build-btn');
        if (buildBtn) {
            buildBtn.disabled = !allValid || files.length === 0;
        }
    }

    switchTab(tab) {
        this.currentTab = tab;

        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tab);
        });

        // Update panels
        const editorPanel = document.getElementById('editor-panel');
        const previewPanel = document.getElementById('preview-panel');

        if (tab === 'editor') {
            editorPanel.classList.add('active');
            previewPanel.classList.remove('active');
        } else if (tab === 'preview') {
            editorPanel.classList.remove('active');
            previewPanel.classList.add('active');
        } else if (tab === 'split') {
            // TODO: Implement split view
            editorPanel.classList.add('active');
            previewPanel.classList.add('active');
        }
    }

    updateSaveButton() {
        const saveBtn = document.getElementById('save-btn');
        if (saveBtn) {
            saveBtn.disabled = !this.hasUnsavedChanges;
        }
    }

    updateUI() {
        const currentFile = this.fileManager.getCurrentFile();
        const currentFileName = document.getElementById('current-file');
        const saveBtn = document.getElementById('save-btn');
        const deleteFileBtn = document.getElementById('delete-file-btn');
        const exportBtn = document.getElementById('export-btn');
        const buildBtn = document.getElementById('build-btn');

        if (currentFileName) {
            currentFileName.textContent = currentFile ? currentFile.path : 'No file selected';
        }

        if (saveBtn) {
            saveBtn.disabled = !this.hasUnsavedChanges;
        }

        if (deleteFileBtn) {
            deleteFileBtn.disabled = !currentFile;
        }

        const hasFiles = this.fileManager.getAllFiles().length > 0;
        if (exportBtn) {
            exportBtn.disabled = !hasFiles;
        }
        if (buildBtn) {
            buildBtn.disabled = !hasFiles;
        }
    }

    exportProject() {
        const data = this.fileManager.exportProject();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'twelvety-project.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    async triggerBuild() {
        // TODO: Implement build API call
        console.log('Build triggered');
        
        const buildProgress = document.getElementById('build-progress');
        const downloadSection = document.getElementById('download-section');
        
        if (buildProgress) {
            buildProgress.removeAttribute('hidden');
        }

        // Simulate build progress
        setTimeout(() => {
            if (buildProgress) {
                buildProgress.setAttribute('hidden', '');
            }
            if (downloadSection) {
                downloadSection.removeAttribute('hidden');
            }
        }, 2000);
    }
}

// Initialize workspace when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new Workspace());
} else {
    new Workspace();
}
