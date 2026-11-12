'use strict';
// =============================================================================
// THE ONLY FILE THAT TOUCHES THE AFFINITY SDK.   *** UNTESTED - no Affinity available when written ***
// Written against affinity.d.ts 3.3.3 and the JSLib wrapper (/document.js, /nodes.js, ...), whose
// patterns are copied from JSLib's own examples (cropMarks.js etc).
// Everything here returns plain JS data so the rest of the plugin is testable in Node.
//
// Coordinates returned are SPREAD coordinates in document "pixels" (1 px = 1/dpi inch), y down.
// If a spike shows shapes land in the wrong place, the fix belongs in readNode() below.
// =============================================================================

const { Document } = require('/document.js');
const { Selection } = require('/selections.js');
const { Dialog, DialogResult } = require('/dialog.js');
const { File } = require('/fs.js');
const { Curve, PolyCurve } = require('/geometry.js');
const { AddChildNodesCommandBuilder, CompoundCommandBuilder, DocumentCommand } = require('/commands.js');
const { ContainerNodeDefinition, PolyCurveNodeDefinition } = require('/nodes.js');
const { FillDescriptor } = require('/fills.js');
const { Colour } = require('/colours.js');
const { LineStyleDescriptor } = require('/linestyle.js');
const { UnitType } = require('/units.js');
const { BlendMode } = require('affinity:common');
const { CurveApi, PolygonApi } = require('affinity:geometry');
const { UiApi } = require('affinity:ui');
const { ApplicationApi } = require('affinity:application');
const { FileSystemApi } = require('affinity:fs');

const { utf8Encode, utf8Decode } = require('../core/bytes.js');

const PREVIEW_NAME = 'Embroidery preview';

const isOk = (r) => (r?.value ?? r) == DialogResult.Ok.value;
const xy = (p) => [p.x, p.y];
/** JSLib enum members are objects with .value; affinity.d.ts types them as plain numbers. Accept both. */
const ev = (e) => (e !== null && typeof e === 'object' && 'value' in e ? e.value : e);

function doc() { return Document.current; }

function getDocumentInfo() {
  const d = doc();
  if (!d) return null;
  let path = '';
  try { path = d.path || ''; } catch (e) { /* unsaved documents may throw */ }
  return { title: d.title, path, dpi: d.dpi, uuid: d.persistentUuid, desktop: safe(() => ApplicationApi.getUserDesktopPath(), '') };
}
function safe(fn, dflt) { try { return fn(); } catch (e) { return dflt; } }

/** Flatten one curve with Affinity's own tessellator; fall back to the Bézier list. */
function readCurve(curve, xf, tolPx) {
  const closed = curve.isClosed;
  const apply = (pt) => xy(xf ? xf.applyToPoint(pt) : pt);
  let points = null;
  try {
    const poly = CurveApi.generatePolygon(curve.handle, tolPx);
    const pts = [];
    PolygonApi.enumeratePoints(poly, (p) => { pts.push(apply(p)); return 0; /* EnumerationResult.Continue */ });
    if (pts.length >= 2) points = pts;
  } catch (e) { /* fall through to beziers */ }
  const beziers = [];
  try {
    for (const b of curve.beziers) beziers.push({ p0: apply(b.start), c1: apply(b.c1), c2: apply(b.c2), p3: apply(b.end) });
  } catch (e) { /* ignore */ }
  const nodes = [];
  try { for (const n of curve.nodes) nodes.push(apply(n.position)); } catch (e) { /* ignore */ }
  return { closed, points, beziers, nodes };
}

function colourOf(fillDescriptor) {
  try {
    const fill = fillDescriptor.fill;
    if (ev(fill.fillType) !== ev(require('affinity:fills').FillType.Solid)) return { rgb: null, alpha: 1, gradient: true };
    const c = fill.colour.rgba8;
    return { rgb: (c.r << 16) | (c.g << 8) | c.b, alpha: (c.alpha ?? 255) / 255 };
  } catch (e) { return null; }
}

function readNode(node, dpi, tolPx) {
  if (!node.isVectorNode) return null;
  const xf = safe(() => node.localToSpreadTransform, null);
  const polyCurve = node.curvesInterface.polyCurve;
  const curves = [];
  for (const c of polyCurve.curves) curves.push(readCurve(c, xf, tolPx));
  if (!curves.length) return null;
  let fill = null, stroke = null;
  if (safe(() => node.hasBrushFill, false)) fill = colourOf(node.brushFillDescriptor);
  if (safe(() => node.hasPenFill && node.isLineStyleVisible, false)) {
    stroke = colourOf(node.penFillDescriptor);
    if (stroke) stroke.weightPx = node.lineWeight;
  }
  return { nodeId: node.nodeId, name: safe(() => node.userDescription, '') || safe(() => node.description, ''), curves, fill, stroke,
    bbox: safe(() => { const r = node.getSpreadVisibleBox(); return [r.x, r.y, r.width, r.height]; }, null) };
}

function collect(nodes, out) {
  for (const n of nodes) {
    if (n.isVectorNode && !n.isTextNode) out.push(n);
    else if (n.isGroupNode || n.isContainerNode) collect(n.children.toArray(), out);
  }
}

/** Selected vector nodes (groups are expanded), as plain data. */
function readSelection(tolPx) {
  const d = doc(); if (!d) return [];
  const nodes = []; collect(d.selection.nodes.toArray(), nodes);
  return nodes.map((n) => readNode(n, d.dpi, tolPx)).filter(Boolean);
}
/** Every vector node on the current spread (preview layers excluded). */
function readAll(tolPx) {
  const d = doc(); if (!d) return [];
  const nodes = []; collect(d.currentSpread.children.toArray().filter((n) => safe(() => n.userDescription, '') !== PREVIEW_NAME), nodes);
  return nodes.map((n) => readNode(n, d.dpi, tolPx)).filter(Boolean);
}

// ------------------------------------------------------------------ dialogs
/**
 * Declarative dialog. fields: [{id, type:'text'|'combo'|'check'|'number'|'static'|'color'|'buttons',
 *   label, value, items?, min?, max?, unit?:'mm'|'deg'|'none', group?, enabledBy?}]
 * Returns {id: value} or null when cancelled.
 */
function runDialog(title, fields, width = 440) {
  const dlg = Dialog.create(title);
  const col = dlg.addColumn();
  let group = null, groupName = null;
  const ctl = {};
  for (const f of fields) {
    if (!group || f.group !== groupName) { groupName = f.group; group = col.addGroup(f.group || ''); }
    switch (f.type) {
      case 'text': ctl[f.id] = group.addTextBox(f.label, String(f.value ?? '')); break;
      case 'static': ctl[f.id] = group.addStaticText(f.label, String(f.value ?? '')); break;
      case 'combo': ctl[f.id] = group.addComboBox(f.label, f.items, Math.max(0, f.items.indexOf(f.value))); break;
      case 'buttons': ctl[f.id] = group.addButtonSet(f.label, f.items, Math.max(0, f.items.indexOf(f.value))); break;
      case 'check': ctl[f.id] = group.addCheckBox(f.label, !!f.value); break;
      case 'number': {
        const unit = f.unit === 'mm' ? UnitType.Millimetre : f.unit === 'deg' ? UnitType.Degree : UnitType.Number;
        ctl[f.id] = group.addUnitValueEditor(f.label, unit, unit, Number(f.value), f.min ?? null, f.max ?? null).setPrecision(f.precision ?? 2);
        break;
      }
      case 'color': ctl[f.id] = group.addColourPicker(f.label, f.value ? Colour.createRGBA8({ r: (f.value >> 16) & 255, g: (f.value >> 8) & 255, b: f.value & 255, alpha: 255 }) : null); break;
      default: throw new Error('unknown field type ' + f.type);
    }
  }
  for (const f of fields) {
    if (!f.enabledBy) continue;
    const master = ctl[f.enabledBy], slave = ctl[f.id];
    const upd = () => { slave.isEnabled = !!master.value; };
    master.onValueChangedHandler = upd; upd();
  }
  dlg.initialWidth = width;
  if (!isOk(dlg.runModal())) return null;
  const out = {};
  for (const f of fields) {
    const c = ctl[f.id];
    if (f.type === 'combo' || f.type === 'buttons') out[f.id] = f.items[c.selectedIndex];
    else if (f.type === 'static') out[f.id] = f.value;
    else if (f.type === 'color') { const v = c.value; out[f.id] = v ? ((v.rgba8.r << 16) | (v.rgba8.g << 8) | v.rgba8.b) : null; }
    else if (f.type === 'text') out[f.id] = c.text;
    else out[f.id] = c.value;
  }
  return out;
}

const alertBox = (message, title = 'Embroidery') => UiApi.alert(message, title);
const confirmBox = (message, title = 'Embroidery') => UiApi.confirm(message, title);
const chooseFile = () => safe(() => UiApi.chooseFile(), '');

// ------------------------------------------------------------------ files
function writeFileBytes(path, bytes) {
  const f = File.create(path, 'wb');
  try {
    // hand over an exact-size ArrayBuffer
    const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
    f.write(ab, bytes.byteLength);
    f.flush();
  } finally { f.close(); }
}
function writeText(path, text) { writeFileBytes(path, utf8Encode(text)); }
function fileExists(path) { return safe(() => FileSystemApi.exists(path), false); }
function readText(path) {
  const f = File.create(path, 'rb');
  try {
    const len = f.length;
    const buf = new ArrayBuffer(len);
    f.read(buf, len);
    return utf8Decode(new Uint8Array(buf));
  } finally { f.close(); }
}
function makeDirs(path) { FileSystemApi.createDirectories(path); }

// ------------------------------------------------------------------ preview layer
/** lines: [{pts:[[x,y]..] (spread px), rgb:int, weightPx:number}] -> one layer with one curve per line. */
function addPreview(lines) {
  const d = doc(); if (!d) return;
  removePreview();
  const noFill = FillDescriptor.createNone();
  const compound = CompoundCommandBuilder.create();
  const layerBuilder = AddChildNodesCommandBuilder.create();
  const layerDef = ContainerNodeDefinition.create(PREVIEW_NAME);
  layerDef.userDescription = PREVIEW_NAME;
  layerBuilder.addNode(layerDef);
  compound.addCommand(layerBuilder.createCommand(true));
  const lineBuilder = AddChildNodesCommandBuilder.create();
  for (const ln of lines) {
    if (ln.pts.length < 2) continue;
    const curve = Curve.create();
    CurveApi.setPath(curve.handle, ln.pts.map(([x, y]) => ({ x, y })));
    const poly = PolyCurve.create(); poly.addCurve(curve);
    const col = Colour.createRGBA8({ r: (ln.rgb >> 16) & 255, g: (ln.rgb >> 8) & 255, b: ln.rgb & 255, alpha: 255 });
    const def = PolyCurveNodeDefinition.create(poly, noFill, FillDescriptor.createSolid(col, BlendMode.Normal), LineStyleDescriptor.createDefault(ln.weightPx), noFill);
    def.userDescription = 'stitches';
    lineBuilder.addNode(def);
  }
  compound.addCommand(lineBuilder.createCommand(false));
  d.executeCommand(compound.createCommand());
}

function removePreview() {
  const d = doc(); if (!d) return 0;
  const found = d.currentSpread.children.toArray().filter((n) => safe(() => n.userDescription, '') === PREVIEW_NAME);
  if (!found.length) return 0;
  const sel = Selection.create(d, found);
  d.executeCommand(DocumentCommand.createDeleteSelection(sel, true));
  return found.length;
}

module.exports = { getDocumentInfo, readSelection, readAll, runDialog, alertBox, confirmBox, chooseFile, writeFileBytes, writeText, readText, fileExists, makeDirs, addPreview, removePreview, PREVIEW_NAME };
