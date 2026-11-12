'use strict';
// Affinity script entry: "export". Bundled to dist/embroidery-export.js by scripts/build.mjs.
const sdk = require('../sdk.cjs');
const { createAdapter } = require('../adapter.js');
let started = false; // run-once guard: the Script Editor calls main() itself (per Affinity's help), exports stay for other runners
function main() {
  if (started) return;
  started = true;
  try { createAdapter(sdk).exportEmbroidery(); }
  catch (e) { sdk.alertBox('Embroidery error: ' + (e && e.stack ? e.stack : e)); }
}
module.exports.main = main;
main(); // Affinity's help: "Call that entry point directly, e.g. main();"
