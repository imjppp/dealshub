// Test geometry generators (design units: 1 du = 0.1 mm, y down).
import { flattenCubic } from '../src/core/geometry.js';

export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export const circle = (cx, cy, r, n = 64) => Array.from({ length: n }, (_, i) => [cx + r * Math.cos((i / n) * Math.PI * 2), cy + r * Math.sin((i / n) * Math.PI * 2)]);
export const ellipse = (cx, cy, rx, ry, n = 64) => Array.from({ length: n }, (_, i) => [cx + rx * Math.cos((i / n) * Math.PI * 2), cy + ry * Math.sin((i / n) * Math.PI * 2)]);
export function star(cx, cy, ro, ri, n = 5) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) { const r = i % 2 ? ri : ro, a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return pts;
}
/** An "S" curve built from two cubic Béziers, flattened. */
export function sCurve(x, y, w, h) {
  const p0 = [x, y], p3 = [x + w / 2, y + h / 2], p6 = [x, y + h];
  const pts = [p0];
  flattenCubic(p0, [x + w, y], [x + w, y + h / 2 - h * 0.1], p3, 0.5, pts);
  flattenCubic(p3, [x - w * 0.1, y + h / 2 + h * 0.1], [x - w * 0.1 + w * 0.0, y + h], [x + w * 0.9, y + h], 0.5, pts);
  void p6;
  return pts;
}
