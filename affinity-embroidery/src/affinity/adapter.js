// Plugin workflows (Params, Export, Preview, Thread list). Pure logic; every SDK call goes through the
// injected `sdk` object (see sdk.cjs), so this file runs under Node with a fake sdk in tests.
import { stitchShape } from '../stitch/index.js';
import { buildPattern, threadReport, PLAN_DEFAULTS } from '../plan/plan.js';
import { FORMATS } from '../formats/index.js';
import { CMD, intToHex } from '../core/pattern.js';
import { loadPalette } from '../plan/palette.js';
import { MM } from '../stitch/params.js';
import { toEngineShape, shapeSignature, duToPx, mmToPx } from './convert.js';
import { loadStore, saveStore, paramsFor, setParams } from './storage.js';
import { paramFields, paramsFromDialog, formatItems, HOOPS, PALETTES } from './ui-spec.js';
import MADEIRA from '../data/palette-madeira.json' with { type: 'json' };
import ISACORD from '../data/palette-isacord.json' with { type: 'json' };
import ROBISON from '../data/palette-robison-anton.json' with { type: 'json' };

const PALETTE_DATA = [null, MADEIRA, ISACORD, ROBISON];
const TOL_MM = 0.2;

const dirOf = (p) => p.replace(/[/\\][^/\\]*$/, '');
const baseOf = (p) => p.replace(/^.*[/\\]/, '').replace(/\.[^.]*$/, '');

export function createAdapter(sdk) {
  function needDoc() {
    const info = sdk.getDocumentInfo();
    if (!info) { sdk.alertBox('Open a document first.'); return null; }
    return info;
  }
  const tolPx = (info) => mmToPx(TOL_MM, info.dpi);

  function gather(info, scope) {
    return scope === 'Selection' ? sdk.readSelection(tolPx(info)) : sdk.readAll(tolPx(info));
  }

  function build(info, store, raws, planOpts) {
    const shapes = raws.map((r) => toEngineShape(r, info.dpi, paramsFor(store, r.nodeId, shapeSignature(r, info.dpi)), { toleranceMm: TOL_MM }));
    const blocks = shapes.flatMap((s) => stitchShape(s));
    const { pattern, stats } = buildPattern(blocks, planOpts);
    pattern.meta.name = (info.title || 'Untitled').replace(/\.[^.]*$/, '').slice(0, 16);
    return { pattern, stats, shapes };
  }

  // ---------------------------------------------------------------- Params
  function editParams() {
    const info = needDoc(); if (!info) return;
    const raws = sdk.readSelection(tolPx(info));
    if (!raws.length) { sdk.alertBox('Select one or more vector shapes first.'); return; }
    const store = loadStore(sdk, info);
    const first = paramsFor(store, raws[0].nodeId, shapeSignature(raws[0], info.dpi));
    const res = sdk.runDialog(`Embroidery params (${raws.length} object${raws.length > 1 ? 's' : ''})`, paramFields(first), 480);
    if (!res) return;
    const patch = paramsFromDialog(res);
    for (const r of raws) {
      const sig = shapeSignature(r, info.dpi);
      setParams(store, r.nodeId, sig, { ...paramsFor(store, r.nodeId, sig), ...patch });
    }
    saveStore(sdk, info, store);
    sdk.alertBox(`Saved stitch settings for ${raws.length} object(s) in ${baseOf(info.path || 'untitled')}.embroidery.json`);
  }

  // ---------------------------------------------------------------- Export
  function exportEmbroidery() {
    const info = needDoc(); if (!info) return;
    const store = loadStore(sdk, info);
    const last = store.export || {};
    const fmts = formatItems();
    const outDir = info.path ? dirOf(info.path) : info.desktop || '';
    const fmtLabel = fmts.find((f) => f.key === last.format)?.label ?? fmts[0].label;
    const defPath = (key) => `${outDir ? outDir + '/' : ''}${(info.title || 'design').replace(/\.[^.]*$/, '')}.${FORMATS[key].ext}`;
    const first = sdk.runDialog('Export embroidery', [
      { id: 'format', type: 'combo', label: 'File format', group: 'Output', items: fmts.map((f) => f.label), value: fmtLabel },
      { id: 'path', type: 'text', label: 'Output path (full path incl. file name)', group: 'Output', value: last.path || defPath(fmts.find((f) => f.label === fmtLabel).key) },
      { id: 'scope', type: 'buttons', label: 'Export', group: 'Output', items: ['Selection', 'Whole page'], value: last.scope || 'Whole page' },
      { id: 'hoop', type: 'combo', label: 'Hoop size', group: 'Machine', items: HOOPS.map((h) => h.name), value: last.hoop || HOOPS[0].name },
      { id: 'palette', type: 'combo', label: 'Snap thread colours to', group: 'Machine', items: PALETTES, value: last.palette || PALETTES[0] },
      { id: 'optimise', type: 'check', label: 'Optimise (group colours, shortest travel)', group: 'Plan', value: last.optimise ?? true },
      { id: 'trimThreshold', type: 'number', label: 'Trim jumps longer than', group: 'Plan', unit: 'mm', min: 0.5, max: 50, value: last.trimThreshold ?? PLAN_DEFAULTS.trimThreshold },
      { id: 'ties', type: 'check', label: 'Tie-in / tie-off stitches', group: 'Plan', value: last.ties ?? true },
      { id: 'threadList', type: 'check', label: 'Also write thread list (.txt)', group: 'Plan', value: last.threadList ?? true },
    ], 480);
    if (!first) return;
    const fmt = fmts.find((f) => f.label === first.format);
    const hoop = HOOPS.find((h) => h.name === first.hoop) || HOOPS[0];
    const pal = PALETTE_DATA[Math.max(0, PALETTES.indexOf(first.palette))];
    const raws = gather(info, first.scope);
    if (!raws.length) { sdk.alertBox(first.scope === 'Selection' ? 'Nothing selected.' : 'No vector shapes found on this page.'); return; }
    const { pattern, stats } = build(info, store, raws, {
      optimise: first.optimise, trimThreshold: first.trimThreshold, tieIn: first.ties, tieOff: first.ties,
      palette: pal ? loadPalette(pal) : null,
    });
    if (!stats.stitches) { sdk.alertBox('Nothing to stitch: the chosen shapes produced no stitches.'); return; }

    const fits = !hoop.w || (stats.widthMm <= hoop.w && stats.heightMm <= hoop.h);
    const summary = [
      { id: 's1', type: 'static', label: 'Stitches', group: 'Design', value: String(stats.stitches) },
      { id: 's2', type: 'static', label: 'Colours / colour changes', group: 'Design', value: `${stats.colors} / ${stats.colorChanges}` },
      { id: 's3', type: 'static', label: 'Trims / jumps', group: 'Design', value: `${stats.trims} / ${stats.jumps}` },
      { id: 's4', type: 'static', label: 'Size', group: 'Design', value: `${stats.widthMm.toFixed(1)} x ${stats.heightMm.toFixed(1)} mm` },
      { id: 's5', type: 'static', label: 'Hoop', group: 'Design', value: hoop.w ? (fits ? `fits ${hoop.name}` : `DOES NOT FIT ${hoop.name}`) : 'not checked' },
      { id: 's6', type: 'static', label: 'Threads', group: 'Design', value: stats.threads.map((t, i) => `${i + 1}:${t.hex}${t.name && t.name !== t.hex ? ' ' + t.name : ''}`).join('  ') },
      { id: 's7', type: 'static', label: 'Writes', group: 'Design', value: `${fmt.label} -> ${first.path}` },
    ];
    if (!sdk.runDialog('Export embroidery - confirm', summary, 520)) return;

    const bytes = FORMATS[fmt.key].write(pattern, {});
    sdk.writeFileBytes(first.path, bytes);
    let extra = '';
    if (first.threadList) {
      const txt = first.path.replace(/\.[^./\\]+$/, '') + '-threads.txt';
      sdk.writeText(txt, threadReport(pattern, stats, pattern.meta.name));
      extra = `\nThread list: ${txt}`;
    }
    store.export = { format: fmt.label, path: first.path, scope: first.scope, hoop: hoop.name, palette: first.palette, optimise: first.optimise, trimThreshold: first.trimThreshold, ties: first.ties, threadList: first.threadList };
    saveStore(sdk, info, store);
    sdk.alertBox(`Wrote ${bytes.length} bytes to ${first.path}${extra}`);
  }

  // ---------------------------------------------------------------- Preview / simulator
  function preview() {
    const info = needDoc(); if (!info) return;
    const store = loadStore(sdk, info);
    const sel = sdk.readSelection(tolPx(info));
    const raws = sel.length ? sel : sdk.readAll(tolPx(info));
    if (!raws.length) { sdk.alertBox('No vector shapes to preview.'); return; }
    const { pattern, stats } = build(info, store, raws, { center: false, optimise: store.export?.optimise ?? true });
    sdk.addPreview(patternToLines(pattern, info.dpi));
    sdk.alertBox(`Preview drawn on layer "${sdk.PREVIEW_NAME}": ${stats.stitches} stitches, ${stats.colors} colours.\nRun "Clear preview" to remove it.`);
  }
  function clearPreview() {
    if (!needDoc()) return;
    const n = sdk.removePreview();
    sdk.alertBox(n ? 'Preview removed.' : 'No preview layer found.');
  }

  // ---------------------------------------------------------------- Thread list
  function threadList() {
    const info = needDoc(); if (!info) return;
    const store = loadStore(sdk, info);
    const raws = gather(info, 'Whole page');
    if (!raws.length) { sdk.alertBox('No vector shapes found.'); return; }
    const outDir = info.path ? dirOf(info.path) : info.desktop || '';
    const res = sdk.runDialog('Thread list', [{ id: 'path', type: 'text', label: 'Write to', group: 'Output', value: `${outDir ? outDir + '/' : ''}${baseOf(info.title || 'design')}-threads.txt` }]);
    if (!res) return;
    const { pattern, stats } = build(info, store, raws, {});
    const text = threadReport(pattern, stats, pattern.meta.name);
    sdk.writeText(res.path, text);
    sdk.alertBox(text + `\nSaved to ${res.path}`);
  }

  function menu() {
    const actions = { 'Params (edit stitch settings)': editParams, 'Export embroidery file': exportEmbroidery, 'Preview stitches': preview, 'Clear preview': clearPreview, 'Thread list': threadList };
    const r = sdk.runDialog('Embroidery', [{ id: 'a', type: 'combo', label: 'Action', group: '', items: Object.keys(actions), value: 'Export embroidery file' }], 380);
    if (r) actions[r.a]();
  }

  return { editParams, exportEmbroidery, preview, clearPreview, threadList, menu };
}

/** Pattern (design units, y down) -> preview polylines in spread pixels. One line per uninterrupted run. */
export function patternToLines(pattern, dpi, weightMm = 0.18) {
  const k = duToPx(dpi);
  const lines = [];
  let ti = 0, cur = null;
  const rgb = () => pattern.threads[Math.min(ti, pattern.threads.length - 1)]?.color ?? 0x808080;
  const flush = () => { if (cur && cur.pts.length > 1) lines.push(cur); cur = null; };
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.STITCH) {
      if (!cur) cur = { pts: [], rgb: rgb(), weightPx: Math.max(0.5, mmToPx(weightMm, dpi)) };
      cur.pts.push([s.x * k, s.y * k]);
    } else {
      // movement commands end the run; the landing point of a JUMP is the start of the next
      flush();
      if (s.cmd === CMD.COLOR_CHANGE) ti++;
      if (s.cmd === CMD.JUMP) cur = { pts: [[s.x * k, s.y * k]], rgb: rgb(), weightPx: Math.max(0.5, mmToPx(weightMm, dpi)) };
    }
  }
  flush();
  return lines;
}
void MM; void intToHex;
