import test from 'node:test';
import assert from 'node:assert/strict';
import { createAdapter, patternToLines, ACTIONS } from '../src/affinity/adapter.js';
import { toEngineShape, shapeSignature, pxToDu } from '../src/affinity/convert.js';
import { sidecarPath, loadStore, saveStore, paramsFor, setParams, emptyStore } from '../src/affinity/storage.js';
import { paramFields, paramsFromDialog } from '../src/affinity/ui-spec.js';
import { Pattern, CMD, makeThread } from '../src/core/pattern.js';

const DPI = 96;
const mm = (v) => (v * DPI) / 25.4; // mm -> px

function fakeSdk(script = {}) {
  const files = new Map(), alerts = [], dialogs = [];
  const raw = (id, curves, extra = {}) => ({ nodeId: String(id), name: '', curves, fill: null, stroke: null, bbox: [0, 0, 10, 10], ...extra });
  const square = (s, x = 0) => [[mm(x), 0], [mm(x + s), 0], [mm(x + s), mm(s)], [mm(x), mm(s)]];
  const shapes = script.shapes ?? [
    raw(1, [{ closed: true, points: square(20), nodes: square(20) }], { fill: { rgb: 0xff0000, alpha: 1 }, stroke: { rgb: 0x0000ff, alpha: 1, weightPx: mm(3) } }),
    raw(2, [{ closed: false, beziers: [{ p0: [0, mm(30)], c1: [mm(10), mm(25)], c2: [mm(20), mm(35)], p3: [mm(30), mm(30)] }], nodes: [[0, mm(30)], [mm(30), mm(30)]] }], { stroke: { rgb: 0x00aa00, alpha: 1, weightPx: mm(0.6) } }),
  ];
  const sdk = {
    PREVIEW_NAME: 'Embroidery preview',
    previews: [], removed: 0, files, alerts, dialogs,
    getDocumentInfo: () => script.noDoc ? null : { title: 'Logo.afdesign', path: script.docPath ?? '/Users/jp/Desktop/Logo.afdesign', dpi: DPI, uuid: 'u', desktop: '/Users/jp/Desktop' },
    getEnvironment: () => ({ fileSystem: script.fileSystem ?? true, roots: script.roots ?? ['/Users/jp/Desktop'], desktop: '/Users/jp/Desktop', sdkVersion: 'test' }),
    countSelection: () => (script.selection ?? shapes).length,
    readSelection: () => script.selection ?? shapes,
    readAll: () => shapes,
    diagnose: () => 'DIAGNOSTIC TEXT',
    runDialog: (title, fields) => {
      dialogs.push({ title, fields });
      const h = script.dialogs?.find((d) => title.startsWith(d.title));
      if (!h || h.cancel) return null;
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

test('storage: sidecar path, id/signature matching, corrupt file tolerance', () => {
  assert.equal(sidecarPath({ title: 'Logo.afdesign', path: '/a/b/Logo.afdesign' }), '/a/b/Logo.embroidery.json');
  assert.equal(sidecarPath({ title: 'Logo', path: '/a/b/Logo.afdesign', saveDir: '/allowed' }), '/allowed/Logo.embroidery.json');
  assert.equal(sidecarPath({ title: '', path: '', desktop: '/desk' }), '/desk/untitled.embroidery.json');
  const st = emptyStore(); st.defaults = { stitchLength: 3 };
  setParams(st, 7, 'sigA', { type: 'running' });
  assert.deepEqual(paramsFor(st, 7, 'sigA'), { stitchLength: 3, type: 'running' });
  assert.equal(paramsFor(st, 99, 'sigA').type, 'running', 'falls back to signature when the id changed');
  assert.equal(paramsFor(st, 99, 'zzz').type, undefined);
  const sdk = fakeSdk(); const info = { ...sdk.getDocumentInfo(), saveDir: '/Users/jp/Desktop' };
  sdk.files.set('/Users/jp/Desktop/Logo.embroidery.json', '{not json');
  assert.deepEqual(loadStore(sdk, info), emptyStore());
  saveStore(sdk, info, st);
  assert.equal(loadStore(sdk, info).objects['7'].params.type, 'running');
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

test('make a file: friendly dialog -> file in the allowed folder, summary, remembered choices', () => {
  const sdk = fakeSdk({ dialogs: [{ title: 'Embroidery - make a file', values: { format: 'Husqvarna Viking / Pfaff (.vp3)', name: 'My Logo', hoop: '100 x 100 mm' } }] });
  createAdapter(sdk).makeFile();
  const bytes = sdk.files.get('/Users/jp/Desktop/My Logo.vp3');
  assert.ok(bytes instanceof Uint8Array && bytes.length > 500);
  assert.equal(String.fromCharCode(...bytes.subarray(0, 5)), '%vsm%');
  assert.match(sdk.alerts.at(-1), /Saved My Logo\.vp3/);
  assert.match(sdk.alerts.at(-1), /Fits your 100 x 100 mm hoop/);
  const store = JSON.parse(sdk.files.get('/Users/jp/Desktop/Logo.embroidery.json'));
  assert.equal(store.export.name, 'My Logo');
  const dlg = sdk.dialogs[0].fields;
  assert.ok(dlg.some((f) => f.id === 'where' && f.value === '/Users/jp/Desktop'), 'tells the user where it saves');
  assert.ok(!dlg.some((f) => f.id === 'path'), 'no path to type');
});

test('make a file: hoop warning, cancel, and "more options" reach the plan', () => {
  const big = [{ nodeId: '5', name: '', curves: [{ closed: true, points: [[0, 0], [mm(150), 0], [mm(150), mm(20)], [0, mm(20)]] }], fill: { rgb: 1, alpha: 1 }, stroke: null, bbox: [0, 0, 1, 1] }];
  const sdk = fakeSdk({ shapes: big, dialogs: [{ title: 'Embroidery - make a file', values: { hoop: '100 x 100 mm', format: 'Tajima / most industrial machines (.dst)' } }] });
  createAdapter(sdk).makeFile();
  assert.match(sdk.alerts.at(-1), /WARNING: too big/);
  const c = fakeSdk({ dialogs: [{ title: 'Embroidery - make a file', cancel: true }] });
  createAdapter(c).makeFile();
  assert.equal(c.files.size, 0);
  const m = fakeSdk({ dialogs: [{ title: 'Embroidery - make a file', values: { more: true, format: 'Janome (.jef)' } }, { title: 'Embroidery - more options', values: { tieIn: false, tieOff: false, optimise: false } }] });
  createAdapter(m).makeFile();
  const stored = JSON.parse(m.files.get('/Users/jp/Desktop/Logo.embroidery.json'));
  assert.equal(stored.export.plan.tieIn, false);
  assert.ok(m.files.get('/Users/jp/Desktop/Logo.jef').length > 100);
});

test('permissions and documents are explained in plain language', () => {
  const noperm = fakeSdk({ fileSystem: false });
  createAdapter(noperm).makeFile();
  assert.match(noperm.alerts[0], /Access the file system/); assert.match(noperm.alerts[0], /File System access/);
  assert.equal(noperm.files.size, 0);
  const nodoc = fakeSdk({ noDoc: true });
  createAdapter(nodoc).menu();
  assert.match(nodoc.alerts[0], /Open a document/);
  const noRoots = fakeSdk({ roots: [], docPath: '/Elsewhere/doc.afdesign' });
  createAdapter(noRoots).makeFile();
  assert.equal(noRoots.dialogs[0].fields.find((f) => f.id === 'where').value, '/Users/jp/Desktop', 'falls back to the Desktop');
  const outside = fakeSdk({ dialogs: [{ title: 'Embroidery - make a file' }], docPath: '/Elsewhere/doc.afdesign' });
  createAdapter(outside).makeFile();
  assert.ok(outside.files.has('/Users/jp/Desktop/Logo.pes'), 'saves in an allowed folder, not next to a document outside them');
});

test('settings: density preset + every setting editable; per-shape or global default; preview uses them', () => {
  const sdk = fakeSdk({ dialogs: [{ title: 'Embroidery settings', values: { densityPreset: 'Dense (0.18 mm rows)', type: 'Fill (tatami)', fillAngle: 45, stitchLength: 3.5, threadColor: '00ff00' } }] });
  createAdapter(sdk).settings();
  const ids = sdk.dialogs[0].fields.map((f) => f.id);
  for (const id of ['rowSpacing', 'maxStitchLength', 'stagger', 'fillAngle', 'expand', 'fillUnderlay', 'satinSpacing', 'satinPullComp', 'stitchLength', 'bean', 'satinContour', 'densityPreset', 'applyTo']) assert.ok(ids.includes(id), id);
  const store = JSON.parse(sdk.files.get('/Users/jp/Desktop/Logo.embroidery.json'));
  assert.equal(Object.keys(store.objects).length, 2);
  const p = store.objects['1'].params;
  assert.equal(p.type, 'fill'); assert.equal(p.fillAngle, 45); assert.equal(p.rowSpacing, 0.18); assert.equal(p.satinSpacing, 0.3); assert.equal(p.stitchLength, 3.5); assert.equal(p.threadColor, '#00ff00');
  createAdapter(sdk).preview();
  assert.ok(new Set(sdk.previews[0].map((l) => l.rgb)).has(0x00ff00));
  const g = fakeSdk({ selection: [], dialogs: [{ title: 'Embroidery settings', values: { rowSpacing: 0.4 } }] });
  createAdapter(g).settings();
  const gs = JSON.parse(g.files.get('/Users/jp/Desktop/Logo.embroidery.json'));
  assert.equal(gs.defaults.rowSpacing, 0.4); assert.deepEqual(gs.objects, {});
});

test('menu: shows selection status and dispatches to every action', () => {
  const run = (action, extra = []) => {
    const sdk = fakeSdk({ dialogs: [{ title: 'Embroidery', values: { a: action } }, ...extra] });
    createAdapter(sdk).menu();
    return sdk;
  };
  const m = run(ACTIONS.threads);
  assert.match(m.dialogs[0].fields.find((f) => f.id === 'status').value, /3|2 shapes selected/);
  assert.match(m.files.get('/Users/jp/Desktop/Logo-threads.txt'), /#ff0000/);
  assert.ok(run(ACTIONS.preview).previews.length === 1);
  assert.equal(run(ACTIONS.clear).removed, 1);
  assert.equal(run(ACTIONS.diagnose).files.get('/Users/jp/Desktop/embroidery-diagnostics.txt'), 'DIAGNOSTIC TEXT');
  const mk = run(ACTIONS.make, [{ title: 'Embroidery - make a file' }]);
  assert.ok(mk.files.has('/Users/jp/Desktop/Logo.pes'));
  const nothing = fakeSdk({ selection: [], dialogs: [{ title: 'Embroidery' }] });
  createAdapter(nothing).menu();
  assert.match(nothing.dialogs[0].fields.find((f) => f.id === 'status').value, /whole page/);
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

void CMD; void shapeSignature;
