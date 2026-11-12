// Spike 5 - data: per-object custom data
// Self-contained: paste into Affinity's script runner (or save as a .js script) and run.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-5.txt (in case the alert truncates).
'use strict';
const { ApplicationApi } = require('affinity:application');
const { UiApi } = require('affinity:ui');
const { File } = require('/fs.js');

const lines = [];
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); lines.push(s); try { console.log(s); } catch (e) {} };
const enc = (s) => Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));
const dec = (u8) => decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(u8))));
const attempt = (label, fn) => { try { const r = fn(); log(`OK   ${label}`, r === undefined ? '' : r); return r; } catch (e) { log(`FAIL ${label}: ${e && e.message ? e.message : e}`); return undefined; } };
function finish() {
  const text = lines.join('\n');
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-5.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 5');
}

const { Document } = require('/document.js');
const { FileSystemApi } = require('affinity:fs');
function main() {
  const doc = Document.current;
  if (!doc) { UiApi.alert('Open a document, select one shape, run. Then SAVE, CLOSE, REOPEN, select the same shape and run AGAIN.', 'Spike 5'); return; }
  const node = doc.selection.nodes.toArray()[0];
  if (!node) { UiApi.alert('Select one shape first.', 'Spike 5'); return; }
  log('node id:', node.nodeId, 'document path:', doc.path, 'persistentUuid:', doc.persistentUuid);
  // (a) what can we READ off a node?
  attempt('description', () => node.description);
  attempt('userDescription', () => node.userDescription);
  attempt('tagInterface (read-only per d.ts)', () => { const t = node.tagInterface; return t ? Object.getOwnPropertyNames(Object.getPrototypeOf(t)).join(',') : 'none'; });
  // (b) probe for ANY setter-like member on node / description interface
  const probe = (obj, label) => { const names = new Set(); let o = obj; while (o && o !== Object.prototype) { Object.getOwnPropertyNames(o).forEach((n) => names.add(n)); o = Object.getPrototypeOf(o); } return label + ': ' + [...names].filter((n) => /^set|name|tag|data|descr|label|note/i.test(n)).join(', '); };
  attempt('node members matching set*/name/tag/data/description', () => probe(node, 'node'));
  attempt('descriptionInterface members', () => probe(node.descriptionInterface, 'descriptionInterface'));
  log('d.ts finding: TagInterfaceApi/DescriptionInterfaceApi are READ-ONLY; only NodeDefinitionApi.setUserDescription exists (for nodes not yet created).');
  // (c) the sidecar fallback the plugin uses
  const base = doc.path ? doc.path.replace(/\.[^./\\]+$/, '') : ApplicationApi.getUserDesktopPath() + '/untitled';
  const sidecar = base + '.embroidery-spike.json';
  let store = {};
  attempt('read existing sidecar', () => { if (FileSystemApi.exists(sidecar)) { const f = File.create(sidecar, 'rb'); const b = new ArrayBuffer(f.length); f.read(b, f.length); f.close(); store = JSON.parse(dec(new Uint8Array(b))); return store; } return 'none yet'; });
  const r = node.getSpreadVisibleBox();
  const sig = [Math.round(r.x), Math.round(r.y), Math.round(r.width), Math.round(r.height)].join(':');
  if (store.nodeId !== undefined) {
    log('PREVIOUS RUN: nodeId', store.nodeId, 'sig', store.sig, '| NOW: nodeId', node.nodeId, 'sig', sig);
    log(store.nodeId === node.nodeId ? 'RESULT: node ids ARE stable across save/reopen for this shape.' : 'RESULT: node ids CHANGED - the plugin falls back to the geometry signature.');
  } else log('first run: writing sidecar. Now save + close + reopen the document, select the SAME shape, run this spike again.');
  attempt('write sidecar', () => { const b = enc(JSON.stringify({ nodeId: node.nodeId, sig, params: { type: 'fill' } })); const f = File.create(sidecar, 'wb'); f.write(b.buffer, b.byteLength); f.close(); return sidecar; });
  finish();
}
module.exports.main = main;
