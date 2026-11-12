'use strict';
// Affinity script entry: "params". Bundled to dist/embroidery-params.js by scripts/build.mjs.
const sdk = require('../sdk.cjs');
const { createAdapter } = require('../adapter.js');
function main() {
  try { createAdapter(sdk).editParams(); }
  catch (e) { sdk.alertBox('Embroidery error: ' + (e && e.stack ? e.stack : e)); }
}
module.exports.main = main;
