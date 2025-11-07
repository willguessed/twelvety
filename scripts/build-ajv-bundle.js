#!/usr/bin/env node

/**
 * Build script to create a browser-compatible AJV bundle using browserify
 * Outputs to src/js/vendor/ajv-bundle.js
 */

const browserify = require('browserify');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '../src/js/vendor');
const outputFile = path.join(outputDir, 'ajv-bundle.js');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('Building AJV browser bundle...');

// Create browserify bundle
const b = browserify({
  entries: [path.join(__dirname, 'ajv-browser-entry.js')],
  standalone: 'Ajv',
  builtins: false,
  commondir: false
});

// Write bundle to file
b.bundle()
  .on('error', (err) => {
    console.error('Browserify error:', err);
    process.exit(1);
  })
  .pipe(fs.createWriteStream(outputFile))
  .on('finish', () => {
    console.log(`✓ AJV bundle created at ${outputFile}`);
    console.log(`  Bundle size: ${(fs.statSync(outputFile).size / 1024).toFixed(2)} KB`);
  })
  .on('error', (err) => {
    console.error('Write stream error:', err);
    process.exit(1);
  });
