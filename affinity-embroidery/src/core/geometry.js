// Pure-JS geometry helpers. Points are [x, y] in 0.1 mm "design units" (du).
// Rings are arrays of points WITHOUT a repeated closing point.

export const dist = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);
export const lerp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Adaptive flattening of a cubic Bézier. Returns points EXCLUDING p0, INCLUDING p3. */
export function flattenCubic(p0, p1, p2, p3, tol = 0.5, out = [], depth = 0) {
  // flatness: max distance of control points from the chord
  const dx = p3[0] - p0[0], dy = p3[1] - p0[1];
  const len = Math.hypot(dx, dy);
  let d1, d2;
  if (len < 1e-9) { d1 = dist(p0, p1); d2 = dist(p0, p2); }
  else {
    d1 = Math.abs((p1[0] - p0[0]) * dy - (p1[1] - p0[1]) * dx) / len;
    d2 = Math.abs((p2[0] - p0[0]) * dy - (p2[1] - p0[1]) * dx) / len;
  }
  if (Math.max(d1, d2) <= tol || depth > 16) { out.push(p3); return out; }
  const p01 = lerp(p0, p1, 0.5), p12 = lerp(p1, p2, 0.5), p23 = lerp(p2, p3, 0.5);
  const a = lerp(p01, p12, 0.5), b = lerp(p12, p23, 0.5), m = lerp(a, b, 0.5);
  flattenCubic(p0, p01, a, m, tol, out, depth + 1);
  flattenCubic(m, b, p23, p3, tol, out, depth + 1);
  return out;
}

/**
 * Flatten a path described by on-curve nodes + cubic segments.
 * segs: array of {p0,c1,c2,p3} (cubic Béziers; lines have c1=p0,c2=p3).
 * Returns the polyline (first point included).
 */
export function flattenSegments(segs, tol = 0.5) {
  if (!segs.length) return [];
  const pts = [segs[0].p0];
  for (const s of segs) flattenCubic(s.p0, s.c1, s.c2, s.p3, tol, pts);
  return pts;
}

export function polylineLength(pts, closed = false) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += dist(pts[i - 1], pts[i]);
  if (closed && pts.length > 1) L += dist(pts[pts.length - 1], pts[0]);
  return L;
}

/** Signed area (positive = counter-clockwise in a y-up frame, i.e. clockwise on screen). */
export function signedArea(ring) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const p = ring[i], q = ring[(i + 1) % n];
    a += p[0] * q[1] - q[0] * p[1];
  }
  return a / 2;
}

export function bbox(pts) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of pts) { if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
  return { minX, minY, maxX, maxY };
}

/** Even-odd point in polygon (single ring). */
export function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Even-odd point in a set of rings (outer + holes). */
export function pointInRings(pt, rings) {
  let inside = false;
  for (const r of rings) if (pointInRing(pt, r)) inside = !inside;
  return inside;
}

/** Remove consecutive duplicates (and closing duplicate). */
export function dedupe(pts, eps = 1e-6, closed = false) {
  const out = [];
  for (const p of pts) if (!out.length || dist(out[out.length - 1], p) > eps) out.push(p);
  if (closed && out.length > 1 && dist(out[0], out[out.length - 1]) <= eps) out.pop();
  return out;
}

export function rotatePoint(p, angle, c = [0, 0]) {
  const s = Math.sin(angle), co = Math.cos(angle);
  const x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * co - y * s, c[1] + x * s + y * co];
}
export const rotateRing = (ring, angle, c) => ring.map((p) => rotatePoint(p, angle, c));

/**
 * Horizontal scanline x-intersections with a set of rings (even-odd).
 * Returns sorted x values; consecutive pairs (0-1, 2-3, ...) are inside spans.
 * Uses the half-open rule (y in [ymin, ymax)) so shared vertices count once.
 */
export function scanlineX(rings, y) {
  const xs = [];
  for (const ring of rings) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const a = ring[i], b = ring[(i + 1) % n];
      if (a[1] === b[1]) continue;
      const lo = a[1] < b[1] ? a : b, hi = a[1] < b[1] ? b : a;
      if (y >= lo[1] && y < hi[1]) xs.push(lo[0] + ((y - lo[1]) / (hi[1] - lo[1])) * (hi[0] - lo[0]));
    }
  }
  return xs.sort((p, q) => p - q);
}

/** Cumulative arc length table for a polyline. */
export function arcTable(pts, closed = false) {
  const P = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + dist(P[i - 1], P[i]));
  return { pts: P, cum, length: cum[cum.length - 1] };
}

/** Point (and unit tangent) at arc length s on a table from arcTable(). */
export function pointAt(table, s) {
  const { pts, cum, length } = table;
  if (s <= 0) s = 0;
  if (s >= length) s = length;
  // binary search
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
  const seg = cum[hi] - cum[lo];
  const t = seg > 0 ? (s - cum[lo]) / seg : 0;
  const a = pts[lo], b = pts[hi];
  const tx = seg > 0 ? (b[0] - a[0]) / seg : 1, ty = seg > 0 ? (b[1] - a[1]) / seg : 0;
  return { p: [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t], tangent: [tx, ty], index: lo };
}

/** Resample at an even arc-length step. Always keeps first and last point. */
export function resample(pts, step, closed = false) {
  const tb = arcTable(pts, closed);
  if (tb.length === 0) return [pts[0]];
  const n = Math.max(1, Math.round(tb.length / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(pointAt(tb, (tb.length * i) / n).p);
  if (closed) out.pop();
  return out;
}

/** Corner vertices: where the direction changes more than `angleDeg`. */
export function isCorner(prev, cur, next, angleDeg = 30) {
  const a1 = Math.atan2(cur[1] - prev[1], cur[0] - prev[0]);
  const a2 = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
  let d = Math.abs(a2 - a1);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return (d * 180) / Math.PI > angleDeg;
}

/** Does the straight segment a→b stay inside the rings (sampled)? */
export function segmentInside(a, b, rings, step = 2) {
  const L = dist(a, b);
  const n = Math.max(1, Math.ceil(L / step));
  for (let i = 0; i <= n; i++) if (!pointInRings(lerp(a, b, i / n), rings)) return false;
  return true;
}
