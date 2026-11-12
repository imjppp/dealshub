// Pure conversion: raw SDK shapes (document pixels) -> engine shapes (design units), and back.
import { flattenSegments } from '../core/geometry.js';
import { intToHex } from '../core/pattern.js';
import { MM } from '../stitch/params.js';

/** document pixels -> design units (0.1 mm) for a given document DPI */
export const pxToDu = (dpi) => (MM * 25.4) / dpi;
export const duToPx = (dpi) => dpi / (MM * 25.4);
export const mmToPx = (mm, dpi) => (mm * dpi) / 25.4;
export const pxToMm = (px, dpi) => (px * 25.4) / dpi;

/**
 * @param {any} raw shape from sdk.readSelection()/readAll()
 * @param {number} dpi
 * @param {any} [params] per-object overrides
 * @param {{toleranceMm?:number}} [opt]
 */
export function toEngineShape(raw, dpi, params = {}, { toleranceMm = 0.2 } = {}) {
  const k = pxToDu(dpi);
  const S = (p) => [p[0] * k, p[1] * k];
  const paths = [];
  for (const c of raw.curves) {
    let points = null;
    if (c.points && c.points.length >= 2) points = c.points.map(S);
    else if (c.beziers && c.beziers.length) {
      const segs = c.beziers.map((b) => ({ p0: S(b.p0), c1: S(b.c1), c2: S(b.c2), p3: S(b.p3) }));
      points = flattenSegments(segs, toleranceMm * MM);
    }
    if (!points || points.length < 2) continue;
    // drop an explicit closing duplicate
    const f = points[0], l = points[points.length - 1];
    if (c.closed && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-6) points = points.slice(0, -1);
    paths.push({ points, nodes: c.nodes && c.nodes.length ? c.nodes.map(S) : undefined, closed: !!c.closed });
  }
  const visible = (f) => f && f.rgb != null && f.alpha > 0.01;
  return {
    id: raw.nodeId,
    name: raw.name || '',
    paths,
    fill: visible(raw.fill) ? { color: intToHex(raw.fill.rgb) } : null,
    stroke: visible(raw.stroke) ? { color: intToHex(raw.stroke.rgb), width: raw.stroke.weightPx * k } : null,
    params,
  };
}

/** Stable-ish signature so stored settings can be re-matched if node ids change. */
export function shapeSignature(raw, dpi) {
  const b = raw.bbox ? raw.bbox.map((v) => Math.round(pxToMm(v, dpi) * 10) / 10) : [];
  return [raw.curves.length, ...b].join(':');
}
