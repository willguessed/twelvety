const Ajv = require('ajv');
const addFormats = require('ajv-formats');

if (typeof globalThis !== 'undefined') {
  globalThis.Ajv = Ajv;
  globalThis.ajvAddFormats = addFormats;
}

module.exports = Ajv;
module.exports.addFormats = addFormats;
