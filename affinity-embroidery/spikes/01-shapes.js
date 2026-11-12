// Spike 1 - shapes: selection, curves, transforms
// Self-contained: paste into Affinity's script runner (or save as a .js script) and run.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-1.txt (in case the alert truncates).
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
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-1.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 1');
}

const { Document } = require('/document.js');
const { CurveApi, PolygonApi, TransformApi } = require('affinity:geometry');

function collect(nodes, out) {
  for (const n of nodes) {
    if (n.isVectorNode && !n.isTextNode) out.push(n);
    else if (n.isGroupNode || n.isContainerNode) collect(n.children.toArray(), out);
  }
}
const r1 = (v) => Math.round(v * 100) / 100;
const P = (p) => `(${r1(p.x)}, ${r1(p.y)})`;

function main() {
  const doc = Document.current;
  if (!doc) { UiApi.alert('Open a document with some vector shapes (select a few) and run again.', 'Spike 1'); return; }
  log('document:', doc.title, 'dpi=', doc.dpi, 'units=', String(doc.units && (doc.units.name ?? doc.units.value ?? doc.units)));
  log('selection count:', doc.selection.nodes.toArray().length);
  const sel = []; collect(doc.selection.nodes.toArray(), sel);
  const all = []; attempt('collect all on current spread', () => { collect(doc.currentSpread.children.toArray(), all); return all.length; });
  const nodes = sel.length ? sel : all;
  log(sel.length ? 'using SELECTION' : 'nothing selected -> using ALL vector nodes on the spread', nodes.length);
  for (const node of nodes.slice(0, 5)) {
    log('---- node', node.nodeId, 'isPolyCurveNode', node.isPolyCurveNode, 'isShapeNode', node.isShapeNode);
    const xf = attempt('localToSpreadTransform', () => node.localToSpreadTransform);
    if (xf) log('   xf.data =', xf.data);
    attempt('spread visible box', () => { const r = node.getSpreadVisibleBox(); return [r1(r.x), r1(r.y), r1(r.width), r1(r.height)]; });
    attempt('spread base box', () => { const r = node.getSpreadBaseBox(); return [r1(r.x), r1(r.y), r1(r.width), r1(r.height)]; });
    const ci = node.curvesInterface;
    attempt('curvesInterface.domainTransform', () => ci.domainTransform && ci.domainTransform.data);
    const pc = ci.polyCurve;
    attempt('polyCurve.curveCount', () => pc.curveCount);
    let ci2 = 0;
    for (const curve of pc.curves) {
      log(`  curve #${ci2++}: closed=${curve.isClosed} points=${curve.pointCount} nodes=${curve.nodeCount}`);
      attempt('   nodes (local -> spread)', () => curve.nodes.slice(0, 6).map((nd) => P(nd.position) + '->' + (xf ? P(xf.applyToPoint(nd.position)) : '?') + ' type=' + String(nd.type && (nd.type.name ?? nd.type.value ?? nd.type))));
      attempt('   beziers (first 3, local)', () => [...curve.beziers].slice(0, 3).map((b) => [P(b.start), P(b.c1), P(b.c2), P(b.end)].join(' ')));
      attempt('   bezier count', () => [...curve.beziers].length);
      attempt('   generatePolygon(0.5) point count + first 3 (local)', () => {
        const poly = CurveApi.generatePolygon(curve.handle, 0.5); const pts = [];
        PolygonApi.enumeratePoints(poly, (p) => { pts.push(p); return 0; });
        return [pts.length, pts.slice(0, 3).map(P).join(' ')];
      });
      attempt('   getPath() count', () => curve.path.length);
    }
  }
  log('INTERPRET: compare "spread visible box" with the transformed node positions to confirm localToSpreadTransform is the right transform;');
  log('           if the local points already match the box, the transform must NOT be applied (edit readNode() in src/affinity/sdk.cjs).');
  finish();
}
module.exports.main = main;
