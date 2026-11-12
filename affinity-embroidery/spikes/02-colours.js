/**
 * name: Embroidery Spike 2: colours
 * description: Diagnostic spike for the affinity-embroidery plugin. Prints what the SDK does; writes embroidery-spike-N.txt to the Desktop.
 * version: 0.1.0
 * author: affinity-embroidery
 */
// Spike 2 - colours: fill and stroke
// Self-contained: Script Editor panel > New Script > paste this whole file > Run (F5 / Ctrl+Return; Cmd+Return on Mac).
// Needs Settings > Scripting > "Enable Affinity Scripting"; spikes 3 and 5 also need "Access the file system" ticked in the
// script's own Settings and your Desktop folder added under Settings > Scripting > File System access.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-2.txt (in case the alert truncates).
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
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-2.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 2');
}

const { Document } = require('/document.js');
const hex = (c) => '#' + [c.r, c.g, c.b].map((v) => v.toString(16).padStart(2, '0')).join('');
function main() {
  const doc = Document.current;
  if (!doc) { log('no document open'); UiApi.alert('Open a document and select shapes with fills/strokes.', 'Spike 2'); return; }
  const nodes = doc.selection.nodes.toArray().filter((n) => n.isVectorNode);
  if (!nodes.length) { log('nothing selected'); UiApi.alert('Select some vector shapes first.', 'Spike 2'); return; }
  for (const node of nodes.slice(0, 8)) {
    log('---- node', node.nodeId);
    attempt('hasBrushFill', () => node.hasBrushFill);
    attempt('brush fill type', () => String(node.brushFillDescriptor.fill.fillType.name ?? node.brushFillDescriptor.fill.fillType.value));
    attempt('brush solid colour rgba8', () => { const c = node.brushFillDescriptor.fill.colour.rgba8; return `${hex(c)} alpha=${c.alpha}`; });
    attempt('hasPenFill', () => node.hasPenFill);
    attempt('isLineStyleVisible', () => node.isLineStyleVisible);
    attempt('pen fill type', () => String(node.penFillDescriptor.fill.fillType.name ?? node.penFillDescriptor.fill.fillType.value));
    attempt('pen solid colour rgba8', () => { const c = node.penFillDescriptor.fill.colour.rgba8; return `${hex(c)} alpha=${c.alpha}`; });
    attempt('lineWeight (px)', () => node.lineWeight);
    attempt('lineWeight in mm  (px*25.4/dpi)', () => Math.round((node.lineWeight * 25.4 / doc.dpi) * 1000) / 1000);
    attempt('lineWeightPts', () => node.lineWeightPts);
    attempt('lineCap / lineJoin', () => [String(node.lineCap.name ?? node.lineCap.value), String(node.lineJoin.name ?? node.lineJoin.value)]);
  }
  log('INTERPRET: lineWeight should be pixels at document dpi (the plugin assumes this). Gradient fills report a non-solid fill type;');
  log('           the plugin ignores those (no colour) - tell me if you want a "use average colour" fallback.');
  finish();
}
module.exports.main = main;
try { main(); } catch (e) { log('CRASH: ' + (e && e.stack ? e.stack : e)); finish(); } // the Script Editor expects the script to call main() itself
