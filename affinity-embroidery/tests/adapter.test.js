import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter, patternToLines } from '../src/affinity/adapter.js';
import { toEngineShape, shapeSignature, pxToDu } from '../src/affinity/convert.js';
import { sidecarPath, loadStore, saveStore, paramsFor, setParams, emptyStore } from '../src/affinity/storage.js';
import { paramFields, paramsFromDialog } from '../src/affinity/ui-spec.js';
import { Pattern, CMD, makeThread } from '../src/core/pattern.js';

const DPI = 96;
const mm = (v) => (v * DPI) / 25.4; // mm -> px

function fakeSdk(script = {}) {
  const files = new Map(), alerts = [], dialogs = [];
  const raw = (id, curves, extra = {}) => ({ nodeId: id, name: '', curves, fill: null, stroke: null, bbox: [0, 0, 10, 10], ...extra });
  const square = (s, x = 0) => [[mm(x), 0], [mm(x + s), 0], [mm(x + s), mm(s)], [mm(x), mm(s)]];
  const shapes = script.shapes ?? [
    raw(1, [{ closed: true, points: square(20), nodes: square(20) }], { fill: { rgb: 0xff0000, alpha: 1 }, stroke: { rgb: 0x0000ff, alpha: 1, weightPx: mm(3) } }),
    raw(2, [{ closed: false, beziers: [{ p0: [0, mm(30)], c1: [mm(10), mm(25)], c2: [mm(20), mm(35)], p3: [mm(30), mm(30)] }], nodes: [[0, mm(30)], [mm(30), mm(30)]] }], { stroke: { rgb: 0x00aa00, alpha: 1, weightPx: mm(0.6) } }),
  ];
  const sdk = {
    PREVIEW_NAME: 'Embroidery preview',
    previews: [], removed: 0, files, alerts, dialogs,
    getDocumentInfo: () => script.noDoc ? null : { title: 'Logo.afdesign', path: '/docs/Logo.afdesign', dpi: DPI, uuid: 'u', desktop: '/desk' },
    readSelection: () => script.selection ?? shapes,
    readAll: () => shapes,
    runDialog: (title, fields) => {
      dialogs.push({ title, fields });
      const h = script.dialogs?.find((d) => title.startsWith(d.title));
      if (!h) return null;
      if (h.cancel) return null;
      const out = {};
      for (const f of fields) out[f.id] = f.id in (h.values || {}) ? h.values[f.id] : f.value;
      return out;
    },
    alertBox: (m) => alerts.push(m), confirmBox: () => true, chooseFile: () => '',
    writeFileBytes: (p, b) => files.set(p, b), writeText: (p, t) => files.set(p, t),
    readText: (p) => files.get(p), fileExists: (p) => files.has(p), makeDirs() {},
    addPreview(lines) { sdk.previews.push(lines); }, removePreview() { sdk.removed++; return 1; },
  };
  return sdk;
}

test('convert: px -> design units, closed shapes, bezier flattening, colours, stroke width', () => {
  const sdk = fakeSdk();
  const [sq, curve] = sdk.readAll();
  const a = toEngineShape(sq, DPI);
  assert.equal(a.paths[0].closed, true);
  assert.ok(Math.abs(a.paths[0].points[1][0] - 200) < 1e-6, '20 mm = 200 du');
  assert.equal(a.fill.color, '#ff0000');
  assert.ok(Math.abs(a.stroke.width - 30) < 1e-6, '3 mm = 30 du');
  const b = toEngineShape(curve, DPI);
  assert.ok(b.paths[0].points.length > 6 && !b.paths[0].closed);
  assert.ok(Math.abs(pxToDu(96) - 10 * 25.4 / 96) < 1e-12);
  assert.equal(toEngineShape({ ...sq, fill: { rgb: 0, alpha: 0 } }, DPI).fill, null, 'transparent fill ignored');
});

test('export workflow: dialogs -> plan -> file bytes + thread list + sidecar', () => {
  const sdk = fakeSdk({ dialogs: [
    { title: 'Export embroidery -', values: {} },
    { title: 'Export embroidery', values: { format: 'Husqvarna/Pfaff VP3 (.vp3)', path: '/out/logo.vp3', scope: 'Whole page', hoop: '100 x 100 mm' } },
  ].reverse() });
  createAdapter(sdk).exportEmbroidery();
  const bytes = sdk.files.get('/out/logo.vp3');
  assert.ok(bytes instanceof Uint8Array && bytes.length > 500);
  assert.equal(String.fromCharCode(...bytes.subarray(0, 5)), '%vsm%');
  assert.match(sdk.files.get('/out/logo-threads.txt'), /Thread list/);
  const store = JSON.parse(sdk.files.get('/docs/Logo.embroidery.json'));
  assert.equal(store.export.format, 'Husqvarna/Pfaff VP3 (.vp3)');
  const confirm = sdk.dialogs.find((d) => d.title.includes('confirm'));
  assert.ok(confirm.fields.some((f) => f.label === 'Hoop' && /fits 100/.test(f.value)));
  assert.match(sdk.alerts.at(-1), /Wrote \d+ bytes/);
});

test('export: hoop too small is flagged; cancel writes nothing; no document handled', () => {
  const sdk = fakeSdk({ dialogs: [{ title: 'Export embroidery -' }, { title: 'Export embroidery', values: { path: '/o.dst', format: 'Tajima DST (.dst)', hoop: '100 x 100 mm' } }].reverse(), shapes: [{ nodeId: 5, name: '', curves: [{ closed: true, points: [[0, 0], [mm(150), 0], [mm(150), mm(20)], [0, mm(20)]] }], fill: { rgb: 1, alpha: 1 }, stroke: null, bbox: [0, 0, 1, 1] }] });
  createAdapter(sdk).exportEmbroidery();
  assert.ok(sdk.dialogs.find((d) => d.title.includes('confirm')).fields.some((f) => /DOES NOT FIT/.test(f.value)));
  const cancelled = fakeSdk({ dialogs: [{ title: 'Export embroidery', cancel: true }] });
  createAdapter(cancelled).exportEmbroidery();
  assert.equal(cancelled.files.size, 0);
  const nodoc = fakeSdk({ noDoc: true });
  createAdapter(nodoc).exportEmbroidery();
  assert.match(nodoc.alerts[0], /Open a document/);
});

test('params workflow stores per-object settings; export honours them', () => {
  const sdk = fakeSdk({ dialogs: [{ title: 'Embroidery params', values: { type: 'Fill (tatami)', fillAngle: 45, rowSpacing: 0.5, threadColor: '00ff00' } }] });
  createAdapter(sdk).editParams();
  const store = JSON.parse(sdk.files.get('/docs/Logo.embroidery.json'));
  assert.equal(Object.keys(store.objects).length, 2);
  const p = store.objects['1'].params;
  assert.equal(p.type, 'fill'); assert.equal(p.fillAngle, 45); assert.equal(p.threadColor, '#00ff00');
  // preview picks them up: one green fill block + ...
  createAdapter(sdk).preview();
  const colours = new Set(sdk.previews[0].map((l) => l.rgb));
  assert.ok(colours.has(0x00ff00));
});

test('storage: sidecar path, id/signature matching, corrupt file tolerance', () => {
  assert.equal(sidecarPath({ path: '/a/b/Logo.afdesign' }), '/a/b/Logo.embroidery.json');
  assert.equal(sidecarPath({ path: '', desktop: '/desk' }), '/desk/untitled.embroidery.json');
  const st = emptyStore(); st.defaults = { stitchLength: 3 };
  setParams(st, 7, 'sigA', { type: 'running' });
  assert.deepEqual(paramsFor(st, 7, 'sigA'), { stitchLength: 3, type: 'running' });
  assert.equal(paramsFor(st, 99, 'sigA').type, 'running', 'falls back to signature when the id changed');
  assert.equal(paramsFor(st, 99, 'zzz').type, undefined);
  const sdk = fakeSdk(); sdk.files.set('/docs/Logo.embroidery.json', '{not json');
  assert.deepEqual(loadStore(sdk, sdk.getDocumentInfo()), emptyStore());
  saveStore(sdk, sdk.getDocumentInfo(), st);
  assert.equal(loadStore(sdk, sdk.getDocumentInfo()).objects['7'].params.type, 'running');
});

test('ui-spec: field list covers all params; dialog result round-trips', () => {
  const f = paramFields({ type: 'satin', satinContour: true });
  assert.equal(f.find((x) => x.id === 'type').value, 'Satin column');
  assert.equal(f.find((x) => x.id === 'satinContour').value, true);
  const res = Object.fromEntries(f.map((x) => [x.id, x.value]));
  const back = paramsFromDialog(res);
  assert.equal(back.type, 'satin'); assert.equal(back.threadColor, null);
  assert.equal(paramsFromDialog({ ...res, threadColor: 'abc' }).threadColor, null);
});

test('preview: lines per thread run in px; clear removes layer; selection empty falls back to page', () => {
  const sdk = fakeSdk({ selection: [] });
  const a = createAdapter(sdk);
  a.preview();
  const lines = sdk.previews[0];
  assert.ok(lines.length >= 2 && lines.every((l) => l.pts.length > 1));
  const xs = lines.flatMap((l) => l.pts.map((p) => p[0]));
  assert.ok(Math.min(...xs) >= -mm(2) && Math.max(...xs) <= mm(32), 'stays in design space (no centring)');
  a.clearPreview();
  assert.equal(sdk.removed, 1);
  const p = new Pattern(); p.addThread(makeThread(0xff0000)).addThread(makeThread(0x00ff00));
  p.jump(0, 0); p.stitch(0, 0); p.stitch(10, 0); p.trim(); p.colorChange(); p.jump(50, 50); p.stitch(50, 50); p.stitch(60, 50); p.end();
  const l2 = patternToLines(p, DPI);
  assert.equal(l2.length, 2); assert.deepEqual(l2.map((l) => l.rgb), [0xff0000, 0x00ff00]);
});

test('thread list + menu dispatch', () => {
  const sdk = fakeSdk({ dialogs: [{ title: 'Thread list' }, { title: 'Embroidery', values: { a: 'Thread list' } }].reverse() });
  createAdapter(sdk).menu();
  assert.match(sdk.files.get('/docs/Logo-threads.txt'), /#ff0000/);
});
void CMD; void shapeSignature;
