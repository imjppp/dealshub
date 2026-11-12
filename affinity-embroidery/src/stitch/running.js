// Running stitch, repeats and bean (triple) stitch.
import { dist, isCorner, dedupe } from '../core/geometry.js';

/**
 * Place needle points along a polyline every `len` du, always stitching at corners.
 * @param {number[][]} pts polyline (du)
 * @param {number} len stitch length (du)
 * @param {{closed?:boolean, cornerAngle?:number}} [o]
 */
export function runningPoints(pts, len, { closed = false, cornerAngle = 30 } = {}) {
  let P = dedupe(pts, 1e-6, closed);
  if (P.length < 2) return P.slice();
  if (closed) P = [...P, P[0]];
  // anchor indices: first, last, and corner vertices
  const anchor = new Set([0, P.length - 1]);
  for (let i = 1; i < P.length - 1; i++) if (isCorner(P[i - 1], P[i], P[i + 1], cornerAngle)) anchor.add(i);
  const idx = [...anchor].sort((a, b) => a - b);
  const out = [P[0]];
  for (let k = 0; k + 1 < idx.length; k++) {
    // sub-path between two anchors: stitch evenly so the last stitch is not a stub
    const sub = P.slice(idx[k], idx[k + 1] + 1);
    let L = 0;
    for (let i = 1; i < sub.length; i++) L += dist(sub[i - 1], sub[i]);
    const n = Math.max(1, Math.round(L / len));
    const step = L / n;
    let walked = 0, seg = 1, segStart = 0;
    for (let j = 1; j <= n; j++) {
      const target = j * step;
      while (seg < sub.length - 1 && segStart + dist(sub[seg - 1], sub[seg]) < target - 1e-9) {
        segStart += dist(sub[seg - 1], sub[seg]); seg++;
      }
      const a = sub[seg - 1], b = sub[seg];
      const sl = dist(a, b);
      const t = sl > 0 ? Math.min(1, Math.max(0, (target - segStart) / sl)) : 0;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
      walked = target;
    }
    void walked;
  }
  return out;
}

/** Sew each stitch forward-back-forward (triple) – `extra` extra round trips per stitch. */
export function beanify(pts, extra = 1) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i];
    for (let r = 0; r < extra; r++) { out.push(b, a); }
    out.push(b);
  }
  return out;
}

/** Repeat the whole path: forward, back, forward ... (n passes). */
export function repeatPath(pts, n) {
  if (n <= 1 || pts.length < 2) return pts;
  let out = pts.slice();
  for (let i = 1; i < n; i++) {
    const pass = i % 2 === 1 ? pts.slice().reverse() : pts.slice();
    out = out.concat(pass.slice(1));
  }
  return out;
}

export function runningStitch(pts, o) {
  const { stitchLengthDu, repeats = 1, bean = false, beanRepeats = 1, closed = false, cornerAngle = 30 } = o;
  let out = runningPoints(pts, stitchLengthDu, { closed, cornerAngle });
  if (bean) out = beanify(out, beanRepeats);
  return repeatPath(out, repeats);
}
