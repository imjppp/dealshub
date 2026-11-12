// The Embroidery script: ONE entry point that opens a menu, then guides you through each task.
// Pure logic; every SDK call goes through the injected `sdk` object (see sdk.cjs), so this runs under Node with a
// fake sdk in tests.
import { stitchShape } from '../stitch/index.js';
import { buildPattern, threadReport, PLAN_DEFAULTS } from '../plan/plan.js';
import { FORMATS } from '../formats/index.js';
import { CMD } from '../core/pattern.js';
import { loadPalette } from '../plan/palette.js';
import { toEngineShape, shapeSignature, duToPx, mmToPx } from './convert.js';
import { loadStore, saveStore, paramsFor, setParams } from './storage.js';
import { paramFields, paramsFromDialog, planFields, FORMAT_CHOICES, DENSITY_PRESETS, HOOPS, PALETTES } from './ui-spec.js';
import MADEIRA from '../data/palette-madeira.json' with { type: 'json' };
import ISACORD from '../data/palette-isacord.json' with { type: 'json' };
import ROBISON from '../data/palette-robison-anton.json' with { type: 'json' };

const PALETTE_DATA = [null, MADEIRA, ISACORD, ROBISON];
const TOL_MM = 0.2;

export const ACTIONS = {
  make: 'Make an embroidery file',
  preview: 'Preview the stitches on the page',
  clear: 'Remove the preview',
  settings: 'Change stitch settings (density, stitch type, underlay...)',
  threads: 'Save a thread list (text file)',
  diagnose: 'Send a diagnostic report (if something looks wrong)',
};

const norm = (p) => String(p || '').replace(/\\/g, '/').replace(/\/+$/, '');
const underAny = (path, roots) => roots.some((r) => { const a = norm(path).toLowerCase(), b = norm(r).toLowerCase(); return a === b || a.startsWith(b + '/'); });
const dirOf = (p) => norm(p).replace(/\/[^/]*$/, '');
const safeName = (s) => (String(s || 'design').replace(/\.[^.]*$/, '').replace(/[^\w .()-]+/g, '_').trim() || 'design');

const NO_PERMISSION = [
  'Embroidery needs permission to save files, and Affinity has it switched off.',
  '',
  'Turn it on once:',
  '  1. Open Settings (Edit > Settings on Windows, Affinity > Settings on Mac) and choose Scripting.',
  '  2. Tick "Enable Affinity Scripting".',
  '  3. Under Default Permissions tick "Access the file system".',
  '  4. Under "File System access" click Add and choose the folder you want embroidery files saved to (for example your Desktop).',
  '  5. In the Script Editor, open this script\'s Settings (cog icon) and make sure "Access the file system" is ticked too.',
  '',
  'Then run the script again.',
].join('\n');

export function createAdapter(sdk) {
  // ------------------------------------------------------------------ shared helpers
  /** Checks the document and what the script may do. Returns {info, env, saveDir} or null after explaining. */
  function preflight({ needFiles = true } = {}) {
    const info = sdk.getDocumentInfo();
    if (!info) { sdk.alertBox('Open a document first, with some shapes in it.'); return null; }
    const env = sdk.getEnvironment();
    if (needFiles && !env.fileSystem) { sdk.alertBox(NO_PERMISSION); return null; }
    const roots = env.roots || [];
    // best place to save: next to the document if allowed, else the first allowed folder, else Desktop
    let saveDir = info.path && underAny(dirOf(info.path), roots) ? dirOf(info.path) : roots[0] || env.desktop || '';
    saveDir = norm(saveDir);
    info.saveDir = saveDir;
    if (needFiles && !saveDir) { sdk.alertBox(NO_PERMISSION); return null; }
    return { info, env, saveDir };
  }

  const tolPx = (info) => mmToPx(TOL_MM, info.dpi);

  /** Shapes to work on: the selection if there is one, otherwise everything on the page. */
  function gather(info, selectedOnly = true) {
    const sel = selectedOnly ? sdk.readSelection(tolPx(info)) : [];
    return sel.length ? { raws: sel, usedSelection: true } : { raws: sdk.readAll(tolPx(info)), usedSelection: false };
  }

  function build(info, store, raws, planOpts) {
    const shapes = raws.map((r) => toEngineShape(r, info.dpi, paramsFor(store, r.nodeId, shapeSignature(r, info.dpi)), { toleranceMm: TOL_MM }));
    const blocks = shapes.flatMap((s) => stitchShape(s));
    const { pattern, stats } = buildPattern(blocks, planOpts);
    pattern.meta.name = (info.title || 'Untitled').replace(/\.[^.]*$/, '').slice(0, 16);
    return { pattern, stats };
  }

  const planOptsFrom = (saved = {}) => {
    const pal = PALETTE_DATA[Math.max(0, PALETTES.indexOf(saved.palette))];
    return {
      optimise: saved.optimise ?? PLAN_DEFAULTS.optimise,
      trimThreshold: saved.trimThreshold ?? PLAN_DEFAULTS.trimThreshold,
      stitchJoinMax: saved.stitchJoinMax ?? PLAN_DEFAULTS.stitchJoinMax,
      tieIn: saved.tieIn ?? true, tieOff: saved.tieOff ?? true,
      tieLength: saved.tieLength ?? PLAN_DEFAULTS.tieLength,
      minStitch: saved.minStitch ?? PLAN_DEFAULTS.minStitch,
      palette: pal ? loadPalette(pal) : null,
    };
  };

  const trySave = (info, store) => { try { saveStore(sdk, info, store); return ''; } catch (e) { return `\n(Your settings could not be saved to a file: ${e && e.message ? e.message.split(' - ')[0] : e})`; } };

  // ------------------------------------------------------------------ 1. Make an embroidery file
  function makeFile() {
    const pf = preflight(); if (!pf) return;
    const { info, saveDir } = pf;
    const store = loadStore(sdk, info);
    const last = store.export || {};
    const nSel = sdk.countSelection();
    const fmtLabels = FORMAT_CHOICES.map((f) => f.label);
    const fields = [
      { id: 'format', type: 'combo', label: 'Your machine / file type', group: 'Make an embroidery file', items: fmtLabels, value: last.format || fmtLabels[0] },
      { id: 'name', type: 'text', label: 'File name', group: 'Make an embroidery file', value: last.name || safeName(info.title) },
      { id: 'where', type: 'static', label: 'Saved in', group: 'Make an embroidery file', value: saveDir },
      { id: 'hoop', type: 'combo', label: 'Check it fits my hoop', group: 'Make an embroidery file', items: HOOPS.map((h) => h.name), value: last.hoop || HOOPS[0].name },
    ];
    if (nSel > 0) fields.push({ id: 'selectedOnly', type: 'check', label: `Only the ${nSel} selected shape${nSel > 1 ? 's' : ''} (untick for the whole page)`, group: 'What to stitch', value: last.selectedOnly ?? true });
    fields.push({ id: 'more', type: 'check', label: 'Show more options next (trims, lock stitches, thread brands...)', group: 'More', value: false });
    const res = sdk.runDialog('Embroidery - make a file', fields, 500);
    if (!res) return;

    let planSaved = store.export?.plan || {};
    if (res.more) {
      const p = sdk.runDialog('Embroidery - more options', planFields(planSaved), 520);
      if (!p) return;
      planSaved = p;
    }
    const { raws, usedSelection } = gather(info, nSel > 0 ? res.selectedOnly : false);
    if (!raws.length) { sdk.alertBox('There are no shapes to stitch. Draw some shapes (or select the ones you want) and try again.'); return; }
    const { pattern, stats } = build(info, store, raws, planOptsFrom(planSaved));
    if (!stats.stitches) { sdk.alertBox('Those shapes produced no stitches. Text must be converted to curves first, and shapes need a fill or a stroke.'); return; }

    const fmt = FORMAT_CHOICES.find((f) => f.label === res.format) || FORMAT_CHOICES[0];
    const hoop = HOOPS.find((h) => h.name === res.hoop) || HOOPS[0];
    const fileName = `${safeName(res.name)}.${FORMATS[fmt.key].ext}`;
    const path = `${saveDir}/${fileName}`;
    const bytes = FORMATS[fmt.key].write(pattern, {});
    sdk.writeFileBytes(path, bytes);

    store.export = { format: fmt.label, name: safeName(res.name), hoop: hoop.name, selectedOnly: res.selectedOnly, plan: planSaved };
    const warn = trySave(info, store);
    const fits = !hoop.w || (stats.widthMm <= hoop.w && stats.heightMm <= hoop.h);
    sdk.alertBox([
      `Saved ${fileName}`,
      `in ${saveDir}`,
      '',
      `${stats.stitches} stitches, ${stats.colors} thread colour${stats.colors === 1 ? '' : 's'}, ${stats.trims} trims`,
      `Size ${stats.widthMm.toFixed(1)} x ${stats.heightMm.toFixed(1)} mm`,
      hoop.w ? (fits ? `Fits your ${hoop.name} hoop.` : `WARNING: too big for a ${hoop.name} hoop - resize the artwork or pick a bigger hoop.`) : '',
      usedSelection ? '' : 'Used every shape on the page.',
      '',
      'Threads: ' + stats.threads.map((t, i) => `${i + 1}) ${t.name && t.name !== t.hex ? t.name + ' ' : ''}${t.hex}`).join('   '),
      warn,
    ].filter((l) => l !== '').join('\n'));
  }

  // ------------------------------------------------------------------ 2. Preview / 3. clear
  function preview() {
    const pf = preflight({ needFiles: false }); if (!pf) return;
    const { info } = pf;
    const store = loadStore(sdk, info); // settings are optional for a preview: an unreadable file just means defaults
    const { raws } = gather(info, true);
    if (!raws.length) { sdk.alertBox('There are no shapes to preview. Draw some shapes (or select the ones you want) first.'); return; }
    const { pattern, stats } = build(info, store, raws, { ...planOptsFrom(store.export?.plan), center: false });
    sdk.addPreview(patternToLines(pattern, info.dpi));
    sdk.alertBox(`Preview drawn on a layer called "${sdk.PREVIEW_NAME}": ${stats.stitches} stitches, ${stats.colors} colour${stats.colors === 1 ? '' : 's'}.\n\nChoose "Remove the preview" when you are done.`);
  }
  function clearPreview() {
    if (!preflight({ needFiles: false })) return;
    const n = sdk.removePreview();
    sdk.alertBox(n ? 'Preview removed.' : 'There was no preview on this page.');
  }

  // ------------------------------------------------------------------ 4. Stitch settings
  function settings() {
    const pf = preflight(); if (!pf) return;
    const { info } = pf;
    const store = loadStore(sdk, info);
    const nSel = sdk.countSelection();
    const raws = nSel ? sdk.readSelection(tolPx(info)) : [];
    const first = raws.length ? paramsFor(store, raws[0].nodeId, shapeSignature(raws[0], info.dpi)) : { ...store.defaults };
    const fields = [
      { id: 'applyTo', type: 'buttons', label: 'Apply to', group: 'Who gets these settings', items: ['Selected shapes', 'Every shape (new default)'], value: raws.length ? 'Selected shapes' : 'Every shape (new default)' },
      { id: 'densityPreset', type: 'combo', label: 'Density preset', group: 'Density (how closely the stitches are packed)', items: DENSITY_PRESETS.map((d) => d[0]), value: DENSITY_PRESETS[0][0] },
      ...paramFields(first),
    ];
    const res = sdk.runDialog(raws.length ? `Embroidery settings (${raws.length} selected)` : 'Embroidery settings (default for every shape)', fields, 520);
    if (!res) return;
    const patch = paramsFromDialog(res);
    const preset = DENSITY_PRESETS.find((d) => d[0] === res.densityPreset)?.[1];
    if (preset) Object.assign(patch, preset);
    if (res.applyTo === 'Every shape (new default)' || !raws.length) {
      store.defaults = { ...store.defaults, ...patch };
      sdk.alertBox('Saved as the default for every shape.' + trySave(info, store));
      return;
    }
    for (const r of raws) {
      const sig = shapeSignature(r, info.dpi);
      setParams(store, r.nodeId, sig, { ...paramsFor(store, r.nodeId, sig), ...patch });
    }
    sdk.alertBox(`Saved settings for ${raws.length} shape${raws.length > 1 ? 's' : ''}. Use "Preview the stitches" to see the effect.` + trySave(info, store));
  }

  // ------------------------------------------------------------------ 5. Thread list
  function threadList() {
    const pf = preflight(); if (!pf) return;
    const { info, saveDir } = pf;
    const store = loadStore(sdk, info);
    const { raws } = gather(info, true);
    if (!raws.length) { sdk.alertBox('There are no shapes to list threads for.'); return; }
    const { pattern, stats } = build(info, store, raws, planOptsFrom(store.export?.plan));
    const text = threadReport(pattern, stats, pattern.meta.name);
    const path = `${saveDir}/${safeName(info.title)}-threads.txt`;
    sdk.writeText(path, text);
    sdk.alertBox(text + `\nSaved to ${path}`);
  }

  // ------------------------------------------------------------------ 6. Diagnostics
  function diagnose() {
    const info = sdk.getDocumentInfo();
    const env = sdk.getEnvironment();
    const saveDir = norm((env.roots && env.roots[0]) || env.desktop || '');
    const text = sdk.diagnose(info ? tolPx(info) : 1);
    let where = '';
    if (env.fileSystem && saveDir) {
      try { sdk.writeText(`${saveDir}/embroidery-diagnostics.txt`, text); where = `\n\nAlso saved to ${saveDir}/embroidery-diagnostics.txt`; } catch (e) { where = '\n\n(Could not save the report to a file; copy it from this window or the Log Console.)'; }
    }
    sdk.alertBox(text.slice(0, 1800) + (text.length > 1800 ? '\n...(cut off - see the saved file)' : '') + where, 'Embroidery diagnostics');
  }

  // ------------------------------------------------------------------ the menu
  function menu() {
    const info = sdk.getDocumentInfo();
    if (!info) { sdk.alertBox('Open a document first, with some shapes in it.'); return; }
    const n = sdk.countSelection();
    const status = n ? `${n} shape${n > 1 ? 's' : ''} selected - only those will be used.` : 'Nothing selected - the whole page will be used.';
    const r = sdk.runDialog('Embroidery', [
      { id: 'status', type: 'static', label: 'Selection', group: 'Embroidery', value: status },
      { id: 'a', type: 'combo', label: 'What would you like to do?', group: 'Embroidery', items: Object.values(ACTIONS), value: ACTIONS.make },
    ], 480);
    if (!r) return;
    const fn = { [ACTIONS.make]: makeFile, [ACTIONS.preview]: preview, [ACTIONS.clear]: clearPreview, [ACTIONS.settings]: settings, [ACTIONS.threads]: threadList, [ACTIONS.diagnose]: diagnose }[r.a];
    fn();
  }

  return { menu, makeFile, preview, clearPreview, settings, threadList, diagnose };
}

/** Pattern (design units, y down) -> preview polylines in spread pixels. One line per uninterrupted run. */
export function patternToLines(pattern, dpi, weightMm = 0.18) {
  const k = duToPx(dpi);
  const lines = [];
  let ti = 0, cur = null;
  const rgb = () => pattern.threads[Math.min(ti, pattern.threads.length - 1)]?.color ?? 0x808080;
  const weightPx = Math.max(0.5, mmToPx(weightMm, dpi));
  const flush = () => { if (cur && cur.pts.length > 1) lines.push(cur); cur = null; };
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.STITCH) {
      if (!cur) cur = { pts: [], rgb: rgb(), weightPx };
      cur.pts.push([s.x * k, s.y * k]);
    } else {
      flush(); // movement commands end the run; the landing point of a JUMP starts the next
      if (s.cmd === CMD.COLOR_CHANGE) ti++;
      if (s.cmd === CMD.JUMP) cur = { pts: [[s.x * k, s.y * k]], rgb: rgb(), weightPx };
    }
  }
  flush();
  return lines;
}
