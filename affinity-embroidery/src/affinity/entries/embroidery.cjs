'use strict';
// THE Affinity script. Bundled to dist/embroidery.js by scripts/build.mjs.
const sdk = require('../sdk.cjs');
const { createAdapter } = require('../adapter.js');
let started = false; // run-once guard: the Script Editor calls main() itself (per Affinity's help); exports stay for other runners
function main() {
  if (started) return;
  started = true;
  try { createAdapter(sdk).menu(); }
  catch (e) { sdk.alertBox('Embroidery hit a problem:\n\n' + (e && e.message ? e.message : e) + '\n\nChoose "Send a diagnostic report" from the menu and share it.'); try { console.log(e && e.stack ? e.stack : e); } catch (x) { /* no console */ } }
}
module.exports.main = main;
main(); // Affinity's help: "Call that entry point directly, e.g. main();"
