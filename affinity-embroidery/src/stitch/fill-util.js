// Small re-exports/adapters used by fill.js.
import { scanlineX, rotatePoint, dist, pointInRings } from '../core/geometry.js';
export { scanlineX, rotatePoint, dist };
export const regionsToRingsSafe = (regions) => regions.flatMap((r) => [r.outer, ...r.holes]);
/** Is the straight segment inside the rings? Interior samples only when `interiorOnly`. */
export function segmentInside(a, b, rings, step = 2, interiorOnly = false) {
  const L = dist(a, b);
  if (L < 1e-6) return true;
  const n = Math.max(2, Math.ceil(L / step));
  for (let i = interiorOnly ? 1 : 0; i <= (interiorOnly ? n - 1 : n); i++) {
    const t = i / n;
    if (!pointInRings([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], rings)) return false;
  }
  return true;
}
