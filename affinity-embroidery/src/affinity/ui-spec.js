// Declarative dialog definitions (pure data) + value mapping. Rendered by sdk.runDialog().
import { DEFAULTS } from '../stitch/params.js';
import { FORMATS } from '../formats/index.js';

export const TYPE_ITEMS = [
  ['Auto (fill / running / satin by shape)', 'auto'],
  ['Running stitch', 'running'],
  ['Fill (tatami)', 'fill'],
  ['Contour fill (concentric)', 'contour'],
  ['Satin column', 'satin'],
  ['Manual stitch (nodes = needle points)', 'manual'],
  ['Skip this object', 'none'],
];
const typeLabel = (v) => (TYPE_ITEMS.find((t) => t[1] === v) || TYPE_ITEMS[0])[0];
const typeValue = (l) => (TYPE_ITEMS.find((t) => t[0] === l) || TYPE_ITEMS[0])[1];

export const HOOPS = [
  { name: 'No hoop check', w: 0, h: 0 },
  { name: '100 x 100 mm', w: 100, h: 100 },
  { name: '126 x 110 mm', w: 126, h: 110 },
  { name: '130 x 180 mm', w: 130, h: 180 },
  { name: '160 x 260 mm', w: 160, h: 260 },
  { name: '200 x 200 mm', w: 200, h: 200 },
  { name: '240 x 150 mm', w: 240, h: 150 },
];

/** Friendly machine names -> format keys. */
export const FORMAT_CHOICES = [
  { key: 'pes1', label: 'Brother / Babylock / Bernina (.pes)' },
  { key: 'jef', label: 'Janome (.jef)' },
  { key: 'vp3', label: 'Husqvarna Viking / Pfaff (.vp3)' },
  { key: 'dst', label: 'Tajima / most industrial machines (.dst)' },
  { key: 'exp', label: 'Melco (.exp)' },
  { key: 'pes6', label: 'Brother PES, newer version 6 (.pes)' },
  { key: 'pec', label: 'Brother PEC (.pec)' },
  { key: 'xxx', label: 'Singer / Compucon (.xxx)' },
  { key: 'u01', label: 'Barudan (.u01)' },
];

/** Density presets: label -> {rowSpacing (fill), satinSpacing} in mm. "Keep" leaves the numbers alone. */
export const DENSITY_PRESETS = [
  ['Keep the numbers below', null],
  ['Light (0.35 mm rows)', { rowSpacing: 0.35, satinSpacing: 0.5 }],
  ['Normal (0.25 mm rows)', { rowSpacing: 0.25, satinSpacing: 0.4 }],
  ['Dense (0.18 mm rows)', { rowSpacing: 0.18, satinSpacing: 0.3 }],
];

/** Global plan/machine options (shown behind "More options" on the export screen). */
export function planFields(p = {}) {
  const v = { optimise: true, trimThreshold: 3, stitchJoinMax: 0.6, tieIn: true, tieOff: true, tieLength: 0.6, minStitch: 0.1, palette: PALETTES[0], ...p };
  return [
    { id: 'optimise', type: 'check', label: 'Optimise: group by colour and shorten travel (fewer colour changes and jumps)', group: 'Order', value: v.optimise },
    { id: 'trimThreshold', type: 'number', label: 'Trim the thread when the machine jumps further than', group: 'Jumps and trims', unit: 'mm', min: 0.5, max: 100, value: v.trimThreshold },
    { id: 'stitchJoinMax', type: 'number', label: 'Gaps up to this are just stitched across (no jump)', group: 'Jumps and trims', unit: 'mm', min: 0, max: 5, value: v.stitchJoinMax },
    { id: 'tieIn', type: 'check', label: 'Lock stitches at the start of each run (tie-in)', group: 'Lock stitches', value: v.tieIn },
    { id: 'tieOff', type: 'check', label: 'Lock stitches at the end of each run (tie-off)', group: 'Lock stitches', value: v.tieOff },
    { id: 'tieLength', type: 'number', label: 'Lock stitch length', group: 'Lock stitches', unit: 'mm', min: 0.2, max: 2, value: v.tieLength },
    { id: 'minStitch', type: 'number', label: 'Drop stitches shorter than', group: 'Stitch limits', unit: 'mm', min: 0, max: 1, value: v.minStitch },
    { id: 'palette', type: 'combo', label: 'Match thread colours to a brand', group: 'Thread colours', items: PALETTES, value: v.palette },
  ];
}

export const PALETTES = ['None (exact colours)', 'Madeira (approx.)', 'Isacord (approx.)', 'Robison-Anton (approx.)'];

/** Fields for the "Params" dialog. Values come from params (mm/deg). */
export function paramFields(p) {
  const v = { ...DEFAULTS, ...p };
  const n = (id, label, group, unit, min, max, precision = 2) => ({ id, type: 'number', label, group, unit, min, max, value: v[id], precision });
  const c = (id, label, group, enabledBy) => ({ id, type: 'check', label, group, value: v[id], enabledBy });
  return [
    { id: 'type', type: 'combo', label: 'Stitch type', group: 'Object', items: TYPE_ITEMS.map((t) => t[0]), value: typeLabel(v.type) },
    { id: 'threadColor', type: 'text', label: 'Thread colour override (#rrggbb, blank = artwork colour)', group: 'Object', value: v.threadColor || '' },
    n('stitchLength', 'Stitch length', 'Running stitch', 'mm', 0.3, 12),
    n('repeats', 'Repeats (forward/back passes)', 'Running stitch', 'none', 1, 9, 0),
    c('bean', 'Bean (triple) stitch', 'Running stitch'),
    n('beanRepeats', 'Extra back-and-forth per stitch', 'Running stitch', 'none', 1, 4, 0),
    n('fillAngle', 'Angle', 'Fill', 'deg', -360, 360, 1),
    n('rowSpacing', 'Row spacing', 'Fill', 'mm', 0.1, 2, 2),
    n('maxStitchLength', 'Max stitch length', 'Fill', 'mm', 0.5, 12),
    n('stagger', 'Stagger (rows before pattern repeats, 0 = off)', 'Fill', 'none', 0, 12, 0),
    n('expand', 'Expand / pull compensation', 'Fill', 'mm', -3, 3),
    c('fillUnderlay', 'Underlay', 'Fill'),
    n('fillUnderlayAngle', 'Underlay angle (relative to fill)', 'Fill', 'deg', -360, 360, 1),
    n('fillUnderlaySpacing', 'Underlay row spacing', 'Fill', 'mm', 0.3, 6),
    n('fillUnderlayInset', 'Underlay inset', 'Fill', 'mm', 0, 3),
    n('satinSpacing', 'Zig-zag spacing (density)', 'Satin', 'mm', 0.15, 2),
    n('satinPullComp', 'Pull compensation (total extra width)', 'Satin', 'mm', 0, 2),
    n('satinMinWidth', 'Auto: strokes at least this wide become satin', 'Satin', 'mm', 0.2, 10),
    c('satinCenterWalk', 'Underlay: centre walk', 'Satin'),
    c('satinContour', 'Underlay: contour', 'Satin'),
    c('satinZigzag', 'Underlay: zig-zag', 'Satin'),
    c('shortStitch', 'Short stitches on tight curves', 'Satin'),
  ];
}

/** Dialog result -> params patch (only keys that exist in DEFAULTS). */
export function paramsFromDialog(res) {
  const out = {};
  for (const k of Object.keys(res)) {
    if (!(k in DEFAULTS)) continue;
    out[k] = res[k];
  }
  out.type = typeValue(res.type);
  const tc = String(res.threadColor || '').trim();
  out.threadColor = /^#?[0-9a-fA-F]{6}$/.test(tc) ? (tc.startsWith('#') ? tc : '#' + tc) : null;
  for (const k of ['repeats', 'beanRepeats', 'stagger']) if (k in out) out[k] = Math.round(out[k]);
  return out;
}

export const formatItems = () => Object.entries(FORMATS).map(([k, f]) => ({ key: k, label: `${f.label} (.${f.ext})` }));
