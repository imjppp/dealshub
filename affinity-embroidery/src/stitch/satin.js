// Satin columns: from a stroke (centre line + width), from two rails, or from a closed shape.
import { dist, arcTable, pointAt, dedupe, resample } from '../core/geometry.js';
import { runningPoints } from './running.js';

const lerpP = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Rails of a stroke: centre line sampled at `step`, offset by ±width/2 with miter-limited normals. */
export function railsFromStroke(center, widthDu, { closed = false, step, cornerAngle = 35 }) {
  let C = dedupe(center, 1e-6, closed);
  if (C.length < 2) return null;
  // sample, keeping sharp corners as anchors
  C = runningPoints(C, step, { closed, cornerAngle });
  if (closed && dist(C[0], C[C.length - 1]) < 1e-6) C.pop();
  const n = C.length;
  const A = [], B = [], mid = [];
  const segN = (p, q) => { const d = dist(p, q) || 1; return [-(q[1] - p[1]) / d, (q[0] - p[0]) / d]; };
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? C[i - 1] : closed ? C[n - 1] : null;
    const next = i < n - 1 ? C[i + 1] : closed ? C[0] : null;
    let nv;
    const n1 = prev ? segN(prev, C[i]) : null, n2 = next ? segN(C[i], next) : null;
    if (n1 && n2) {
      const m = [n1[0] + n2[0], n1[1] + n2[1]];
      const l2 = m[0] * m[0] + m[1] * m[1];
      if (l2 < 1e-9) nv = n1; // 180° turn: fall back
      else { const k = Math.min(2, 2 / l2 > 0 ? Math.sqrt(2 / (1 + (n1[0] * n2[0] + n1[1] * n2[1]))) : 1); const ml = Math.sqrt(l2); nv = [(m[0] / ml) * k, (m[1] / ml) * k]; }
    } else nv = n1 || n2;
    const h = widthDu / 2;
    A.push([C[i][0] + nv[0] * h, C[i][1] + nv[1] * h]);
    B.push([C[i][0] - nv[0] * h, C[i][1] - nv[1] * h]);
    mid.push(C[i]);
  }
  if (closed) { A.push(A[0]); B.push(B[0]); mid.push(mid[0]); }
  return { A, B, mid };
}

/** Split a closed shape into two rails along its principal axis (extreme points). */
export function railsFromShape(ring, step) {
  const P = resample(ring, Math.max(step, 2), true);
  const n = P.length;
  if (n < 6) return null;
  let cx = 0, cy = 0;
  for (const p of P) { cx += p[0]; cy += p[1]; }
  cx /= n; cy /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of P) { const dx = p[0] - cx, dy = p[1] - cy; sxx += dx * dx; syy += dy * dy; sxy += dx * dy; }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ax = Math.cos(ang), ay = Math.sin(ang);
  let imin = 0, imax = 0, pmin = Infinity, pmax = -Infinity;
  P.forEach((p, i) => { const t = (p[0] - cx) * ax + (p[1] - cy) * ay; if (t < pmin) { pmin = t; imin = i; } if (t > pmax) { pmax = t; imax = i; } });
  const arc = (from, to) => { const out = [P[from]]; for (let i = from; i !== to;) { i = (i + 1) % n; out.push(P[i]); } return out; };
  const r1 = arc(imin, imax);
  const r2 = arc(imax, imin).reverse(); // both run min -> max
  return { A: r1, B: r2 };
}

/** Resample two rails to the same number of samples by normalised arc length. */
function pairRails(A, B, step) {
  const ta = arcTable(A), tb = arcTable(B);
  const L = Math.max(ta.length, tb.length);
  const N = Math.max(2, Math.ceil(L / step));
  const a = [], b = [];
  for (let i = 0; i <= N; i++) { a.push(pointAt(ta, (ta.length * i) / N).p); b.push(pointAt(tb, (tb.length * i) / N).p); }
  return { A: a, B: b };
}

function zigzag(A, B, maxStitch) {
  const pts = [];
  for (let i = 0; i < A.length; i++) {
    const [p, q] = i % 2 === 0 ? [A[i], B[i]] : [B[i], A[i]];
    pts.push(p);
    const L = dist(p, q);
    if (L > maxStitch) { const k = Math.ceil(L / maxStitch); for (let j = 1; j < k; j++) pts.push(lerpP(p, q, j / k)); }
    pts.push(q);
  }
  return pts;
}

/**
 * Build a complete satin column (underlays + top stitching) as continuous segments.
 * @param {{A:number[][],B:number[][],mid?:number[][]}} rails raw rails (already paired or not)
 * @param {object} o  all values in du
 */
export function satinColumn(rails, o) {
  const { spacing, pullComp, maxStitch, centerWalk, contour, zigzagUnderlay, underlayInset, underlayStitch, zigzagSpacing,
    shortStitch, shortDist, shortInset, preservePairing = false } = o;
  let A, B;
  if (preservePairing) ({ A, B } = rails); else ({ A, B } = pairRails(rails.A, rails.B, spacing));
  const n = A.length;
  if (n < 2) return [];
  const widths = A.map((p, i) => dist(p, B[i]));
  const mid = A.map((p, i) => lerpP(p, B[i], 0.5));

  // --- underlays use the un-compensated rails
  const inset = (X, Y, d) => X.map((p, i) => { const w = widths[i]; if (w < 1e-6) return p; return lerpP(p, Y[i], Math.min(0.5, d / w)); });
  const meanW = widths.reduce((s, v) => s + v, 0) / n;
  const layers = []; // each: {kind, pts, parity:'oneway'|'loop'}
  const walkPts = (path) => runningPoints(path, underlayStitch, { cornerAngle: 40 });
  if (centerWalk) layers.push({ kind: 'oneway', make: (rev) => { const p = walkPts(mid); return rev ? p.slice().reverse() : p; } });
  if (contour && meanW > underlayInset * 2 + 2) {
    const Ai = inset(A, B, underlayInset), Bi = inset(B, A, underlayInset);
    layers.push({ kind: 'loop', make: (rev) => {
      const a = walkPts(Ai), b = walkPts(Bi);
      return rev ? [...a.slice().reverse(), ...b] : [...a, ...b.slice().reverse()];
    } });
  }
  if (zigzagUnderlay && meanW > underlayInset * 2 + 2) {
    const Ai = inset(A, B, underlayInset), Bi = inset(B, A, underlayInset);
    const pr = pairRails(Ai, Bi, zigzagSpacing);
    layers.push({ kind: 'oneway', make: (rev) => { const z = zigzag(pr.A, pr.B, maxStitch); return rev ? z.slice().reverse() : z; } });
  }

  // --- top stitching with pull compensation + short stitches
  const A2 = A.map((p) => p.slice()), B2 = B.map((p) => p.slice());
  for (let i = 0; i < n; i++) {
    const w = widths[i];
    if (w < 1e-6 || !pullComp) continue;
    const ux = (A[i][0] - B[i][0]) / w, uy = (A[i][1] - B[i][1]) / w;
    A2[i] = [A[i][0] + (ux * pullComp) / 2, A[i][1] + (uy * pullComp) / 2];
    B2[i] = [B[i][0] - (ux * pullComp) / 2, B[i][1] - (uy * pullComp) / 2];
  }
  if (shortStitch) {
    for (const [X, Y] of [[A2, B2], [B2, A2]]) {
      let parity = 0, last = X[0];
      for (let i = 1; i < n; i++) {
        if (dist(X[i], last) < shortDist) {
          if (parity++ % 2 === 1) X[i] = lerpP(X[i], Y[i], shortInset);
        } else { last = X[i]; parity = 0; }
      }
    }
  }
  layers.push({ kind: 'oneway', top: true, make: (rev) => { const z = zigzag(A2, B2, maxStitch); return rev ? z.slice().reverse() : z; } });

  // --- chain layers so each starts where the previous ended
  const out = [];
  let atEnd = false;
  for (const L of layers) {
    const rev = atEnd;
    out.push(...L.make(rev));
    if (L.kind === 'oneway') atEnd = !atEnd;
  }
  return [out];
}
