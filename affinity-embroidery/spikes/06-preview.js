/**
 * name: Embroidery Spike 6: preview layer
 * description: Diagnostic spike for the affinity-embroidery plugin. Prints what the SDK does; writes embroidery-spike-N.txt to the Desktop.
 * version: 0.1.0
 * author: affinity-embroidery
 */
// Spike 6 - preview: temporary layer
// Self-contained: Script Editor panel > New Script > paste this whole file > Run (F5 / Ctrl+Return; Cmd+Return on Mac).
// Needs Settings > Scripting > "Enable Affinity Scripting"; spikes 3 and 5 also need "Access the file system" ticked in the
// script's own Settings and your Desktop folder added under Settings > Scripting > File System access.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-6.txt (in case the alert truncates).
'use strict';
const { ApplicationApi } = require('affinity:application');
const { UiApi } = require('affinity:ui');
const { File } = require('/fs.js');

const lines = [];
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)))).join(' '); lines.push(s); try { console.log(s); } catch (e) {} };
const enc = (s) => Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));
const dec = (u8) => decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(u8))));
const attempt = (label, fn) => { try { const r = fn(); log(`OK   ${label}`, r === undefined ? '' : r); return r; } catch (e) { log(`FAIL ${label}: ${e && e.message ? e.message : e}`); return undefined; } };
function finish() {
  const text = lines.join('\n');
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-6.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 6');
}

const { Document } = require('/document.js');
const { AddChildNodesCommandBuilder, CompoundCommandBuilder, DocumentCommand } = require('/commands.js');
const { ContainerNodeDefinition, PolyCurveNodeDefinition } = require('/nodes.js');
const { FillDescriptor } = require('/fills.js');
const { Curve, PolyCurve } = require('/geometry.js');
const { Colour } = require('/colours.js');
const { LineStyleDescriptor } = require('/linestyle.js');
const { Selection } = require('/selections.js');
const { BlendMode } = require('affinity:common');
const { CurveApi } = require('affinity:geometry');
const NAME = 'Embroidery preview';
function main() {
  const doc = Document.current;
  if (!doc) { log('no document open'); UiApi.alert('Open a document first.', 'Spike 6'); return; }
  const noFill = FillDescriptor.createNone();
  const lines = [
    { rgb: 0xff0000, pts: Array.from({ length: 60 }, (_, i) => ({ x: 50 + i * 4, y: 50 + (i % 2) * 12 })) },
    { rgb: 0x0000ff, pts: Array.from({ length: 60 }, (_, i) => ({ x: 50 + i * 4, y: 90 + (i % 2) * 12 })) },
  ];
  attempt('add preview layer + 2 polylines', () => {
    const layerDef = ContainerNodeDefinition.create(NAME); layerDef.userDescription = NAME;
    const layerBuilder = AddChildNodesCommandBuilder.create(); layerBuilder.addNode(layerDef);
    const compound = CompoundCommandBuilder.create().addCommand(layerBuilder.createCommand(true));
    const lb = AddChildNodesCommandBuilder.create();
    for (const ln of lines) {
      const curve = Curve.create();
      CurveApi.setPath(curve.handle, ln.pts);
      const poly = PolyCurve.create(); poly.addCurve(curve);
      const col = Colour.createRGBA8({ r: (ln.rgb >> 16) & 255, g: (ln.rgb >> 8) & 255, b: ln.rgb & 255, alpha: 255 });
      lb.addNode(PolyCurveNodeDefinition.create(poly, noFill, FillDescriptor.createSolid(col, BlendMode.Normal), LineStyleDescriptor.createDefault(1), noFill));
    }
    compound.addCommand(lb.createCommand(false));
    doc.executeCommand(compound.createCommand());
    return 'added';
  });
  const found = () => doc.currentSpread.children.toArray().filter((n) => { try { return n.userDescription === NAME; } catch (e) { return false; } });
  log('preview layers found on spread:', found().length);
  const keep = UiApi.confirm('Two thin zig-zag lines (red, blue) should now be near the top-left of the page, inside a layer called "' + NAME + '".\n\nPress OK to REMOVE the layer now, Cancel to leave it (then run this spike again to test removal when it already exists).', 'Spike 6');
  if (keep) attempt('remove preview layer', () => { const f = found(); doc.executeCommand(DocumentCommand.createDeleteSelection(Selection.create(doc, f), true)); return 'removed ' + f.length; });
  log('layers remaining:', found().length);
  log('INTERPRET: if "add preview layer" FAILS, note the message - likely suspects are CurveApi.setPath with plain {x,y} objects (try new Point), or ContainerNodeDefinition.userDescription.');
  finish();
}
module.exports.main = main;
try { main(); } catch (e) { log('CRASH: ' + (e && e.stack ? e.stack : e)); finish(); } // the Script Editor expects the script to call main() itself
