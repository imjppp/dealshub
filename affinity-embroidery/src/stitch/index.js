// Object -> stitch blocks. Chooses a stitch type (auto defaults or per-object override).
//
// Input shape (all coordinates in design units, 1 du = 0.1 mm, y down):
//   { id, name,
//     paths: [{ points:[[x,y]..] (flattened outline), nodes?:[[x,y]..] (on-curve nodes), closed:boolean }],
//     fill:   { color:'#rrggbb' } | null,
//     stroke: { color:'#rrggbb', width:du } | null,
//     params: { ...overrides (see params.js) } }
// Output: Block[]  { color:int, objectId, kind, segments:number[][][], reversible:boolean }
import { resolveParams, du, MM } from './params.js';
import { hexToInt } from '../core/pattern.js';
import * as clip from '../core/clip.js';
import { tatamiFill, contourFill } from './fill.js';
import { runningStitch } from './running.js';
import { railsFromStroke, railsFromShape, satinColumn } from './satin.js';
import { manualStitch } from './manual.js';
import { dist } from '../core/geometry.js';

const colorOf = (spec, p, fallback = 0) => (p.threadColor ? hexToInt(p.threadColor) : spec?.color != null ? (typeof spec.color === 'number' ? spec.color : hexToInt(spec.color)) : fallback);
const toDu = (pt) => (pt ? [pt[0] * MM, pt[1] * MM] : null);

function regionsOf(shape) {
  const rings = shape.paths.filter((p) => p.closed && p.points.length >= 3).map((p) => p.points);
  return rings.length ? clip.normalise(rings) : [];
}

function fillBlocks(shape, p, color) {
  let regions = regionsOf(shape);
  if (!regions.length) return [];
  if (p.expand) regions = clip.offsetRegions(regions, du(p.expand));
  if (!regions.length) return [];
  const segments = [];
  const startPt = toDu(p.fillStart), endPt = toDu(p.fillEnd);
  let underlayEnd = null;
  if (p.type === 'contour') {
    return [{ color, objectId: shape.id, kind: 'contour', segments: contourFill(regions, { spacing: du(p.rowSpacing), maxLen: du(p.maxStitchLength), start: startPt }), reversible: false }];
  }
  if (p.fillUnderlay) {
    const ur = clip.offsetRegions(regions, -du(p.fillUnderlayInset));
    if (ur.length) {
      const us = tatamiFill(ur, {
        angleDeg: p.fillAngle + p.fillUnderlayAngle, spacing: du(p.fillUnderlaySpacing), maxLen: du(p.fillUnderlayMaxStitch),
        stagger: 2, start: startPt, end: null, travelMax: du(p.travelMax),
      });
      segments.push(...us);
      if (us.length) { const l = us[us.length - 1]; underlayEnd = l[l.length - 1]; }
    }
  }
  const top = tatamiFill(regions, {
    angleDeg: p.fillAngle, spacing: du(p.rowSpacing), maxLen: du(p.maxStitchLength), stagger: p.stagger,
    start: underlayEnd ?? startPt, end: endPt, travelMax: du(p.travelMax),
  });
  segments.push(...top);
  return [{ color, objectId: shape.id, kind: 'fill', segments, reversible: false }];
}

function satinBlocks(shape, p, color, widthDu, source) {
  const spacing = du(p.satinSpacing);
  let rails = null;
  const open = shape.paths.filter((q) => !q.closed && q.points.length >= 2);
  if (p.satinRails) rails = { A: p.satinRails[0], B: p.satinRails[1] };
  else if (open.length === 2 && source === 'two-rail') rails = { A: open[0].points, B: open[1].points };
  else if (source === 'shape') {
    const ring = shape.paths.find((q) => q.closed && q.points.length >= 3);
    rails = ring ? railsFromShape(ring.points, spacing) : null;
  } else {
    const path = shape.paths[0];
    rails = railsFromStroke(path.points, widthDu, { closed: path.closed, step: spacing });
    if (rails) return [{ color, objectId: shape.id, kind: 'satin', reversible: false, segments: satinColumn(rails, satinOpts(p, true)) }];
  }
  if (!rails) return [];
  return [{ color, objectId: shape.id, kind: 'satin', reversible: false, segments: satinColumn(rails, satinOpts(p, false)) }];
}
function satinOpts(p, preservePairing) {
  return {
    spacing: du(p.satinSpacing), pullComp: du(p.satinPullComp), maxStitch: du(p.satinMaxStitch),
    centerWalk: p.satinCenterWalk, contour: p.satinContour, zigzagUnderlay: p.satinZigzag,
    underlayInset: du(p.satinUnderlayInset), underlayStitch: du(p.satinUnderlayStitch), zigzagSpacing: du(p.satinZigzagSpacing),
    shortStitch: p.shortStitch, shortDist: du(p.shortStitchDistance), shortInset: p.shortStitchInset, preservePairing,
  };
}

function runBlocks(shape, p, color, which) {
  const segs = [];
  for (const path of which) {
    if (path.points.length < 2) continue;
    segs.push(runningStitch(path.points, { stitchLengthDu: du(p.stitchLength), repeats: p.repeats, bean: p.bean, beanRepeats: p.beanRepeats, closed: path.closed, cornerAngle: p.runCornerAngle }));
  }
  return segs.length ? [{ color, objectId: shape.id, kind: 'run', segments: segs, reversible: !p.bean && p.repeats <= 1 }] : [];
}

/** Decide stitch type(s) for a shape and generate blocks in sewing order. */
export function stitchShape(shape) {
  const p = resolveParams(shape.params);
  const blocks = [];
  const hasClosed = shape.paths.some((q) => q.closed && q.points.length >= 3);
  const fillColor = colorOf(shape.fill, p, 0);
  const strokeColor = shape.stroke ? colorOf(shape.stroke, { threadColor: null }, 0) : fillColor;
  const strokeW = shape.stroke ? shape.stroke.width : 0;
  const type = p.type;
  if (type === 'none') return [];

  if (type === 'manual') {
    const segs = shape.paths.map((q) => manualStitch(q.nodes ?? q.points, { closed: q.closed, repeats: p.repeats })).filter((s) => s.length > 1);
    return segs.length ? [{ color: colorOf(shape.fill ?? shape.stroke, p), objectId: shape.id, kind: 'manual', segments: segs, reversible: false }] : [];
  }
  if (type === 'running') return runBlocks(shape, p, colorOf(shape.stroke ?? shape.fill, p), shape.paths);
  if (type === 'satin') {
    const color = colorOf(shape.stroke ?? shape.fill, p);
    const open = shape.paths.filter((q) => !q.closed);
    const source = open.length === 2 ? 'two-rail' : shape.stroke && !(hasClosed && shape.fill) ? 'stroke' : hasClosed ? 'shape' : 'stroke';
    return satinBlocks(shape, p, color, strokeW || du(p.satinMinWidth * 2), source);
  }
  if (type === 'fill' || type === 'contour') {
    return fillBlocks(shape, p, shape.fill ? fillColor : colorOf(shape.stroke, p));
  }

  // ---- auto
  if (shape.fill && hasClosed) blocks.push(...fillBlocks(shape, { ...p, type: 'fill' }, fillColor));
  if (shape.stroke && strokeW > 0) {
    const w = strokeW / MM;
    const ps = { ...p, threadColor: null };
    if (w >= p.satinMinWidth) {
      const open = shape.paths.filter((q) => !q.closed);
      const source = open.length === 2 && !shape.fill ? 'two-rail' : 'stroke';
      // wide strokes: one satin column per path
      for (const path of shape.paths) {
        const sub = { ...shape, paths: [path] };
        blocks.push(...satinBlocks(sub, ps, strokeColor, strokeW, source === 'two-rail' ? 'stroke' : 'stroke'));
      }
    } else blocks.push(...runBlocks(shape, ps, strokeColor, shape.paths));
  }
  return blocks;
}

export { dist };
