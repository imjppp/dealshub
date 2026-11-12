'use strict';
// Affinity script entry: "menu". Bundled to dist/embroidery-menu.js by scripts/build.mjs.
const sdk = require('../sdk.cjs');
const { createAdapter } = require('../adapter.js');
function main() {
  try { createAdapter(sdk).menu(); }
  catch (e) { sdk.alertBox('Embroidery error: ' + (e && e.stack ? e.stack : e)); }
}
module.exports.main = main;
