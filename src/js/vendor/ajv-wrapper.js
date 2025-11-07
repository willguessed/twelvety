/**
 * AJV Browser Wrapper
 * Dynamically imports AJV and exposes it globally for the workspace validator
 */

(async function() {
  try {
    // Try dynamic import first (ESM)
    const ajvModule = await import('/node_modules/ajv/dist/ajv.js');
    window.Ajv = ajvModule.default;
  } catch (err) {
    console.warn('Dynamic import failed, falling back to eval wrapper:', err);
    
    // Fallback: fetch and eval the CommonJS module in a wrapper
    try {
      const response = await fetch('/node_modules/ajv/dist/ajv.js');
      const commonjsCode = await response.text();
      
      // Create a wrapper that provides exports object
      const wrapperCode = `
        (function() {
          var module = { exports: {} };
          var exports = module.exports;
          ${commonjsCode}
          window.Ajv = module.exports.default || module.exports.Ajv;
        })();
      `;
      
      eval(wrapperCode);
    } catch (fallbackErr) {
      console.error('Failed to load AJV:', fallbackErr);
      throw fallbackErr;
    }
  }
})();
