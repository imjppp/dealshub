// Manual stitch: the object's own nodes become needle points (no resampling).
import { dedupe } from '../core/geometry.js';
import { repeatPath } from './running.js';

export function manualStitch(nodes, { closed = false, repeats = 1 } = {}) {
  let pts = dedupe(nodes, 1e-6, false);
  if (closed && pts.length > 1) pts = [...pts, pts[0]];
  return repeatPath(pts, repeats);
}
