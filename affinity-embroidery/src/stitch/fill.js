// Fill stitch: tatami rows (angle, spacing, stagger), underlay, routing, contour fill.
import { scanlineX, rotatePoint, dist, segmentInside, regionsToRingsSafe } from './fill-util.js';
import * as clip from '../core/clip.js';
import { runningPoints } from './running.js';

const MIN_ROW = 1; // du: ignore intervals narrower than 0.1 mm

/**
 * Build the serpentine chains for rows inside `regions`.
 * @returns {number[][][]} chains: each chain is a polyline of needle points
 */
export function tatamiChains(regions, { angleDeg, spacing, maxLen, stagger, reverseRows = false, flipSide = false }) {
  const theta = (angleDeg * Math.PI) / 180;
  const rot = (p) => rotatePoint(p, -theta);
  const unrot = (p) => rotatePoint(p, theta);
  const rings = regions.flatMap((r) => [r.outer, ...r.holes]).map((ring) => ring.map(rot));
  if (!rings.length) return [];
  let minY = Infinity, maxY = -Infinity;
  for (const r of rings) for (const p of r) { if (p[1] < minY) minY = p[1]; if (p[1] > maxY) maxY = p[1]; }
  const k0 = Math.floor(minY / spacing), k1 = Math.ceil(maxY / spacing);
  const period = Math.max(1, stagger | 0);
  const rows = []; // {k, spans:[{x1,x2,used}]}
  for (let k = k0; k <= k1; k++) {
    const y = (k + 0.5) * spacing;
    if (y < minY || y > maxY) continue;
    const xs = scanlineX(rings, y);
    const spans = [];
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] >= MIN_ROW) spans.push({ x1: xs[i], x2: xs[i + 1], y, k, used: false });
    if (spans.length) rows.push({ k, y, spans });
  }
  if (!rows.length) return [];
  const order = reverseRows ? [...rows].reverse() : rows;

  const spanPoints = (s, leftToRight) => {
    const off = ((((s.k % period) + period) % period) / period) * maxLen;
    const minSeg = Math.min(maxLen * 0.25, 3);
    const pts = [[s.x1, s.y]];
    const first = Math.ceil((s.x1 + minSeg - off) / maxLen);
    for (let m = first; ; m++) {
      const x = off + m * maxLen;
      if (x > s.x2 - minSeg) break;
      pts.push([x, s.y]);
    }
    pts.push([s.x2, s.y]);
    return leftToRight ? pts : pts.reverse();
  };
  const overlap = (a, b) => Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1);

  const chains = [];
  for (let ri = 0; ri < order.length; ri++) {
    for (const start of order[ri].spans) {
      if (start.used) continue;
      let cur = start, row = ri, ltr = !flipSide;
      const chain = [];
      for (;;) {
        cur.used = true;
        chain.push(...spanPoints(cur, ltr));
        const next = order[row + 1];
        if (!next || Math.abs(next.k - order[row].k) !== 1) break;
        // best overlapping unused span in the next row
        let best = null, bo = MIN_ROW;
        for (const s of next.spans) { if (s.used) continue; const o = overlap(cur, s); if (o > bo) { bo = o; best = s; } }
        if (!best) break;
        // connection runs from the end of cur to the same-side end of best
        const a = chain[chain.length - 1];
        const b = ltr ? [best.x2, best.y] : [best.x1, best.y];
        // short connections hug the boundary (midpoint is ambiguous there); only long ones need the check
        if (dist(a, b) > spacing * 4 && !segmentInside(a, b, rings, 3, true)) break;
        cur = best; row++; ltr = !ltr;
      }
      chains.push(chain.map(unrot));
    }
  }
  return chains;
}

/** Join chains into segments, bridging gaps with travel stitches inside the shape when short. */
export function routeChains(chains, regions, { start = null, travelMax = 50 } = {}) {
  if (!chains.length) return [];
  const rings = regionsToRingsSafe(regions);
  const left = chains.map((c) => c.slice());
  const segments = [];
  let cur = start;
  let seg = null;
  while (left.length) {
    // nearest chain end (allow reversal)
    let bi = 0, bd = Infinity, brev = false;
    for (let i = 0; i < left.length; i++) {
      const c = left[i];
      const p = cur ?? c[0];
      const d0 = dist(p, c[0]), d1 = dist(p, c[c.length - 1]);
      if (d0 < bd) { bd = d0; bi = i; brev = false; }
      if (d1 < bd) { bd = d1; bi = i; brev = true; }
    }
    let c = left.splice(bi, 1)[0];
    if (brev) c = c.reverse();
    if (seg && cur && bd <= travelMax && segmentInside(cur, c[0], rings, 3, true)) {
      seg.push(...c);
    } else {
      seg = c.slice();
      segments.push(seg);
    }
    cur = seg[seg.length - 1];
  }
  return segments;
}

/**
 * Complete tatami fill for regions. Tries the four row orientations and keeps the one
 * whose start/end best match the requested start/end points.
 * @returns {number[][][]} segments
 */
export function tatamiFill(regions, o) {
  const { start = null, end = null, travelMax = 50 } = o;
  let best = null, bestCost = Infinity;
  const variants = start || end ? [[false, false], [true, false], [false, true], [true, true]] : [[false, false]];
  for (const [reverseRows, flipSide] of variants) {
    const chains = tatamiChains(regions, { ...o, reverseRows, flipSide });
    const segs = routeChains(chains, regions, { start, travelMax });
    if (!segs.length) continue;
    const first = segs[0][0], last = segs[segs.length - 1][segs[segs.length - 1].length - 1];
    const cost = (start ? dist(first, start) : 0) + (end ? dist(last, end) : 0);
    if (cost < bestCost) { bestCost = cost; best = segs; }
  }
  return best ?? [];
}

/** Concentric contour fill: repeated inward offsets, sewn as closed running paths. */
export function contourFill(regions, { spacing, maxLen, start = null }) {
  const segments = [];
  let cur = regions;
  let pos = start;
  let seg = null;
  for (let guard = 0; guard < 2000 && cur.length; guard++) {
    for (const reg of cur) {
      for (const ring of [reg.outer, ...reg.holes]) {
        let pts = runningPoints(ring, maxLen, { closed: true });
        if (pts.length < 2) continue;
        // start at the point nearest the current position
        if (pos) {
          let bi = 0, bd = Infinity;
          pts.forEach((p, i) => { const d = dist(p, pos); if (d < bd) { bd = d; bi = i; } });
          pts = [...pts.slice(bi), ...pts.slice(0, bi)];
        }
        pts.push(pts[0]);
        if (seg && pos && dist(pos, pts[0]) <= spacing * 3) seg.push(...pts);
        else { seg = pts; segments.push(seg); }
        pos = pts[pts.length - 1];
      }
    }
    cur = clip.offsetRegions(cur, -spacing, { join: 'MITER' });
  }
  return segments;
}
