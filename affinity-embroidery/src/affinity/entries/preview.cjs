'use strict';
// Affinity script entry: "preview". Bundled to dist/embroidery-preview.js by scripts/build.mjs.
const sdk = require('../sdk.cjs');
const { createAdapter } = require('../adapter.js');
function main() {
  try { createAdapter(sdk).preview(); }
  catch (e) { sdk.alertBox('Embroidery error: ' + (e && e.stack ? e.stack : e)); }
}
module.exports.main = main;
