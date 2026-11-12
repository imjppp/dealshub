// Polygon booleans + offsetting via the vendored Clipper (Boost licence).
// Public API works in floating "design units"; internally scaled to integers.
import ClipperLib from '../../vendor/clipper.js';

const S = 100; // 1 du (0.1 mm) = 100 clipper units -> 1 µm resolution
const toC = (rings) => rings.map((r) => r.map(([x, y]) => ({ X: Math.round(x * S), Y: Math.round(y * S) })));
const fromC = (paths) => paths.map((p) => p.map((q) => [q.X / S, q.Y / S]));

export const FILL = { EVEN_ODD: ClipperLib.PolyFillType.pftEvenOdd, NON_ZERO: ClipperLib.PolyFillType.pftNonZero };
export const JOIN = { ROUND: ClipperLib.JoinType.jtRound, MITER: ClipperLib.JoinType.jtMiter, SQUARE: ClipperLib.JoinType.jtSquare };

/** A region is one outer ring plus zero or more hole rings. */
/** @typedef {{outer:number[][], holes:number[][][]}} Region */

function treeToRegions(tree) {
  const regions = [];
  const walk = (node) => {
    // outer polygons are at even depth, holes at odd
    for (const child of node.Childs()) {
      if (!child.IsHole()) {
        const outer = child.Contour().map((q) => [q.X / S, q.Y / S]);
        const holes = child.Childs().map((h) => h.Contour().map((q) => [q.X / S, q.Y / S]));
        regions.push({ outer, holes });
        for (const h of child.Childs()) for (const inner of h.Childs()) walk({ Childs: () => [inner] });
      }
    }
  };
  walk(tree);
  return regions;
}

function run(op, subject, clip, fill) {
  const c = new ClipperLib.Clipper();
  c.AddPaths(toC(subject), ClipperLib.PolyType.ptSubject, true);
  if (clip && clip.length) c.AddPaths(toC(clip), ClipperLib.PolyType.ptClip, true);
  const tree = new ClipperLib.PolyTree();
  c.Execute(op, tree, fill, fill);
  return treeToRegions(tree);
}

export const union = (a, b = [], fill = FILL.NON_ZERO) => run(ClipperLib.ClipType.ctUnion, a, b, fill);
export const intersect = (a, b, fill = FILL.NON_ZERO) => run(ClipperLib.ClipType.ctIntersection, a, b, fill);
export const difference = (a, b, fill = FILL.NON_ZERO) => run(ClipperLib.ClipType.ctDifference, a, b, fill);
export const xor = (a, b, fill = FILL.NON_ZERO) => run(ClipperLib.ClipType.ctXor, a, b, fill);

/** Normalise rings with the even-odd rule into regions (outer + holes). */
export function normalise(rings) {
  return run(ClipperLib.ClipType.ctUnion, rings, [], FILL.EVEN_ODD);
}

/** Offset closed regions. delta > 0 grows, < 0 shrinks (du). Returns regions. */
export function offsetRegions(regions, delta, { join = 'ROUND', miterLimit = 3, arcTol = 0.25 } = {}) {
  if (Math.abs(delta) < 1e-9) return regions;
  const co = new ClipperLib.ClipperOffset(miterLimit, arcTol * S);
  for (const reg of regions) {
    co.AddPath(toC([reg.outer])[0], JOIN[join], ClipperLib.EndType.etClosedPolygon);
    for (const h of reg.holes) co.AddPath(toC([h])[0], JOIN[join], ClipperLib.EndType.etClosedPolygon);
  }
  const tree = new ClipperLib.PolyTree();
  co.Execute(tree, delta * S);
  return treeToRegions(tree);
}

/** Offset a set of closed rings with the even-odd rule applied first. */
export function offsetRings(rings, delta, opts) { return offsetRegions(normalise(rings), delta, opts); }

/** Flatten regions back to ring lists. */
export const regionRings = (reg) => [reg.outer, ...reg.holes];
export const regionsToRings = (regions) => regions.flatMap(regionRings);
export { fromC, toC };
