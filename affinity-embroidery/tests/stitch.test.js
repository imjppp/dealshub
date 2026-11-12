import test from 'node:test';
import assert from 'node:assert/strict';
import { stitchShape } from '../src/stitch/index.js';
import { runningPoints, beanify, repeatPath } from '../src/stitch/running.js';
import { buildPattern } from '../src/plan/plan.js';
import { CMD } from '../src/core/pattern.js';
import { dist, pointInRings } from '../src/core/geometry.js';
import { loadPalette, nearestThread, paletteFromCsv } from '../src/plan/palette.js';
import { rect, circle, star, sCurve } from './shapes.js';
import { readFileSync } from 'node:fs';

const maxStep = (pts) => Math.max(...pts.slice(1).map((p, i) => dist(p, pts[i])));

test('running stitch: even length, corners kept, closed paths close', () => {
  const pts = runningPoints([[0, 0], [100, 0], [100, 100]], 25, { cornerAngle: 30 });
  assert.deepEqual(pts[4], [100, 0]); // corner stitched exactly
  assert.ok(maxStep(pts) <= 25.0001);
  const closed = runningPoints(circle(0, 0, 50), 20, { closed: true });
  assert.ok(dist(closed[0], closed[closed.length - 1]) < 1e-6);
});

test('bean stitch triples every stitch; repeats ping-pong', () => {
  const b = beanify([[0, 0], [10, 0], [20, 0]], 1);
  assert.equal(b.length, 1 + 3 * 2);
  assert.deepEqual(repeatPath([[0, 0], [1, 0]], 3), [[0, 0], [1, 0], [0, 0], [1, 0]]);
});

test('fill: stitches stay inside the shape, honour max length, spacing and holes', () => {
  const shape = { id: 1, paths: [{ points: rect(0, 0, 400, 400), closed: true }, { points: circle(200, 200, 100), closed: true }], fill: { color: '#ff0000' }, params: { fillUnderlay: false, rowSpacing: 0.4, maxStitchLength: 3 } };
  const [blk] = stitchShape(shape);
  const rings = shape.paths.map((p) => p.points);
  let n = 0, outside = 0;
  for (const seg of blk.segments) {
    assert.ok(maxStep(seg) <= 30 + 5, 'stitch longer than max'); // rows <= 3 mm; row-to-row link ~ spacing
    for (const p of seg) { n++; if (!pointInRings(p, rings) && !onBoundary(p, rings)) outside++; }
  }
  assert.ok(n > 1000);
  assert.ok(outside / n < 0.01, `outside fraction ${outside / n}`);
  // row spacing: horizontal rows 4 du apart at angle 0
  const ys = [...new Set(blk.segments.flat().map((p) => Math.round(p[1] * 100) / 100))].sort((a, b) => a - b);
  assert.ok(Math.abs(ys[1] - ys[0] - 4) < 0.05);
});
function onBoundary(p, rings) {
  for (const r of rings) for (let i = 0; i < r.length; i++) {
    const a = r[i], b = r[(i + 1) % r.length];
    const d = Math.abs((b[0] - a[0]) * (a[1] - p[1]) - (a[0] - p[0]) * (b[1] - a[1])) / (dist(a, b) || 1);
    if (d < 1) return true;
  }
  return false;
}

test('fill underlay adds a perpendicular, sparser layer before the top fill', () => {
  const shape = { id: 1, paths: [{ points: rect(0, 0, 300, 300), closed: true }], fill: { color: '#0f0' }, params: { fillAngle: 0 } };
  const [blk] = stitchShape(shape);
  assert.ok(blk.segments.length >= 2);
  const under = blk.segments[0];
  assert.ok(Math.abs(under[1][0] - under[0][0]) < 1e-6 || Math.abs(under[1][1] - under[0][1]) > 0); // vertical rows (angle 90)
  const noUnder = stitchShape({ ...shape, params: { fillUnderlay: false } })[0];
  assert.ok(blk.segments.flat().length > noUnder.segments.flat().length);
});

test('fill start/end points steer the orientation', () => {
  const base = { id: 1, paths: [{ points: rect(0, 0, 300, 200), closed: true }], fill: { color: '#0f0' }, params: { fillUnderlay: false } };
  const a = stitchShape({ ...base, params: { ...base.params, fillStart: [0, 0] } })[0].segments[0][0];
  const b = stitchShape({ ...base, params: { ...base.params, fillStart: [30, 20] } })[0].segments[0][0];
  assert.ok(dist(a, [0, 0]) < 10); assert.ok(dist(b, [300, 200]) < 10);
});

test('islands: one fill block covers disjoint shapes', () => {
  const shape = { id: 1, paths: [{ points: circle(100, 100, 80), closed: true }, { points: circle(400, 100, 80), closed: true }], fill: { color: '#00f' }, params: { fillUnderlay: false } };
  const [blk] = stitchShape(shape);
  const xs = blk.segments.flat().map((p) => p[0]);
  assert.ok(Math.min(...xs) < 40 && Math.max(...xs) > 440);
});

test('satin: stroke width respected (incl. pull compensation); rungs cross the column', () => {
  const stroke = { id: 1, paths: [{ points: [[0, 0], [300, 0]], closed: false }], stroke: { color: '#f00', width: 40 }, params: { satinCenterWalk: false, satinPullComp: 0.0, shortStitch: false } };
  const [blk] = stitchShape(stroke);
  const ys = blk.segments[0].map((p) => p[1]);
  assert.ok(Math.abs(Math.max(...ys) - 20) < 1e-6 && Math.abs(Math.min(...ys) + 20) < 1e-6);
  const pc = stitchShape({ ...stroke, params: { ...stroke.params, satinPullComp: 0.4 } })[0].segments[0].map((p) => p[1]);
  assert.ok(Math.abs(Math.max(...pc) - 22) < 1e-6); // +0.2 mm per side
  // density: spacing 0.4 mm -> 4 du between rungs along x
  const xs = [...new Set(blk.segments[0].map((p) => Math.round(p[0] * 10) / 10))];
  assert.ok(Math.abs(xs[1] - xs[0] - 4) < 0.5);
});

test('satin underlays: centre walk / contour / zigzag add stitches in order', () => {
  const base = { id: 1, paths: [{ points: sCurve(0, 0, 300, 300), closed: false }], stroke: { color: '#f00', width: 60 } };
  const count = (params) => stitchShape({ ...base, params })[0].segments.flat().length;
  const plain = count({ satinCenterWalk: false });
  assert.ok(count({ satinCenterWalk: true }) > plain);
  assert.ok(count({ satinCenterWalk: true, satinContour: true }) > count({ satinCenterWalk: true }));
  assert.ok(count({ satinCenterWalk: true, satinContour: true, satinZigzag: true }) > count({ satinCenterWalk: true, satinContour: true }));
});

test('satin: two open rails and closed shapes both produce columns', () => {
  const rails = { id: 1, paths: [{ points: [[0, 0], [200, 20]], closed: false }, { points: [[0, 60], [200, 90]], closed: false }], params: { type: 'satin' }, stroke: { color: '#0f0', width: 10 } };
  assert.ok(stitchShape(rails)[0].segments[0].length > 20);
  const shape = { id: 2, paths: [{ points: star(100, 100, 90, 40), closed: true }], fill: { color: '#00f' }, params: { type: 'satin' } };
  assert.ok(stitchShape(shape)[0].segments[0].length > 20);
});

test('auto: thin strokes -> running, wide strokes -> satin, closed fills -> fill', () => {
  const line = (w) => ({ id: 1, paths: [{ points: [[0, 0], [200, 0]], closed: false }], stroke: { color: '#000', width: w } });
  assert.equal(stitchShape(line(10))[0].kind, 'run');
  assert.equal(stitchShape(line(20))[0].kind, 'satin');
  const both = stitchShape({ id: 2, paths: [{ points: rect(0, 0, 200, 200), closed: true }], fill: { color: '#f00' }, stroke: { color: '#00f', width: 5 } });
  assert.deepEqual(both.map((b) => b.kind), ['fill', 'run']);
  assert.deepEqual(stitchShape({ id: 3, paths: [{ points: rect(0, 0, 9, 9), closed: true }], fill: { color: '#f00' }, params: { type: 'none' } }), []);
});

test('manual stitch uses nodes verbatim', () => {
  const nodes = [[0, 0], [13, 7], [40, 2]];
  const [blk] = stitchShape({ id: 1, paths: [{ points: [[0, 0], [50, 50]], nodes, closed: false }], stroke: { color: '#000', width: 3 }, params: { type: 'manual' } });
  assert.deepEqual(blk.segments[0], nodes);
});

test('plan: groups colours (fewer colour changes), trims long jumps, ties, ends with END', () => {
  const sq = (x, c) => ({ id: x, paths: [{ points: rect(x, 0, 100, 100), closed: true }], fill: { color: c }, params: { fillUnderlay: false } });
  const blocks = ['#ff0000', '#0000ff', '#ff0000', '#0000ff'].flatMap((c, i) => stitchShape(sq(i * 300, c)));
  const grouped = buildPattern(blocks).pattern;
  assert.equal(grouped.countColorChanges(), 1);
  const ordered = buildPattern(blocks, { optimise: false }).pattern;
  assert.equal(ordered.countColorChanges(), 3);
  assert.ok(grouped.count(CMD.TRIM) >= 2);
  assert.equal(grouped.stitches.at(-1).cmd, CMD.END);
  const noTies = buildPattern(blocks, { tieIn: false, tieOff: false }).pattern;
  assert.ok(grouped.count(CMD.STITCH) > noTies.count(CMD.STITCH));
  assert.equal(grouped.threads.length, 2);
});

test('plan: nearest-neighbour ordering reduces total jump length', () => {
  const dots = [0, 900, 100, 800, 200, 700].map((x, i) => ({ id: i, paths: [{ points: [[x, 0], [x + 30, 0]], closed: false }], stroke: { color: '#000', width: 5 }, params: { type: 'running' } }));
  const blocks = dots.flatMap(stitchShape);
  const jl = (p) => { let L = 0, last = null; for (const s of p.stitches) { if (s.cmd === CMD.JUMP && last) L += dist(last, [s.x, s.y]); last = [s.x, s.y]; } return L; };
  assert.ok(jl(buildPattern(blocks).pattern) < jl(buildPattern(blocks, { optimise: false }).pattern));
});

test('palettes: nearest match, CSV import, JSON files load', () => {
  for (const f of ['madeira', 'isacord', 'robison-anton']) {
    const pal = loadPalette(JSON.parse(readFileSync(new URL(`../src/data/palette-${f}.json`, import.meta.url))));
    assert.ok(pal.threads.length >= 30);
    assert.equal(nearestThread(0xff0000, pal).name, 'Red');
    assert.ok(pal.approximate);
  }
  const csv = paletteFromCsv('Test', 'catalog,name,hex\n1001,Snow,#fefefe\n1002,Coal,#101010\n');
  assert.equal(nearestThread(0x000000, loadPalette(csv)).catalog, '1002');
  const { pattern } = buildPattern(stitchShape({ id: 1, paths: [{ points: rect(0, 0, 100, 100), closed: true }], fill: { color: '#fe0101' } }), { palette: loadPalette(csv) });
  assert.equal(pattern.threads[0].brand, 'Test');
});

test('determinism: same input gives byte-identical pattern', () => {
  const mk = () => buildPattern(stitchShape({ id: 1, paths: [{ points: star(200, 200, 190, 80), closed: true }], fill: { color: '#fc0' }, stroke: { color: '#003', width: 30 } })).pattern;
  assert.deepEqual(mk().stitches, mk().stitches);
});
