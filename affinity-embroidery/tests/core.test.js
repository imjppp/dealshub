import test from 'node:test';
import assert from 'node:assert/strict';
import { Pattern, CMD, makeThread } from '../src/core/pattern.js';
import { encode } from '../src/core/encoder.js';
import { ByteWriter } from '../src/core/bytes.js';
import * as G from '../src/core/geometry.js';
import * as clip from '../src/core/clip.js';
import { rect, circle } from './shapes.js';

test('encoder splits long stitches/jumps and never exceeds caps', () => {
  const p = new Pattern();
  p.addThread(makeThread(0xff0000));
  p.jump(0, 0); p.stitch(0, 0); p.stitch(1000, 0); p.jump(-2000, 1500); p.stitch(-2000, 1500); p.end();
  const e = encode(p, { maxStitch: 121, maxJump: 121 });
  let x = 0, y = 0;
  for (const s of e.stitches) {
    if (s.cmd === CMD.STITCH || s.cmd === CMD.JUMP) assert.ok(Math.abs(s.x - x) <= 121 && Math.abs(s.y - y) <= 121);
    x = s.x; y = s.y;
  }
  assert.equal(e.stitches[e.stitches.length - 1].cmd, CMD.END);
  assert.equal(x, -2000); assert.equal(y, 1500); // end position preserved exactly
});

test('encoder rounds absolute positions (no drift)', () => {
  const p = new Pattern(); p.addThread(makeThread(0));
  for (let i = 0; i <= 100; i++) p.stitch(i * 0.3, 0);
  const e = encode(p, { maxStitch: 127, maxJump: 127 });
  const last = e.stitches[e.stitches.length - 2];
  assert.equal(last.x, 30);
});

test('STOP becomes colour change with duplicated thread when requested', () => {
  const p = new Pattern(); p.addThread(makeThread(1)).addThread(makeThread(2));
  p.stitch(0, 0); p.stitch(5, 0); p.stop(); p.stitch(9, 0); p.colorChange(); p.stitch(12, 0); p.end();
  const e = encode(p, { maxStitch: 127, maxJump: 127, stopAsColor: true });
  assert.equal(e.countColorChanges(), 2);
  assert.deepEqual(e.threads.map((t) => t.color), [1, 1, 2]);
});

test('ByteWriter integers and patching', () => {
  const w = new ByteWriter(2);
  w.u16be(0x0102).u32le(0x0a0b0c0d).u24be(0x112233).u8(-1);
  w.seek(0); w.u16le(0xaabb);
  assert.deepEqual([...w.result()], [0xbb, 0xaa, 0x0d, 0x0c, 0x0b, 0x0a, 0x11, 0x22, 0x33, 0xff]);
});

test('geometry: flatten stays within tolerance of the true curve', () => {
  const p0 = [0, 0], p1 = [0, 100], p2 = [100, 100], p3 = [100, 0];
  const pts = [p0]; G.flattenCubic(p0, p1, p2, p3, 0.25, pts);
  assert.ok(pts.length > 8);
  // midpoint of the true curve (t=.5) is (50, 75)
  const near = Math.min(...pts.map((q, i) => (i ? Math.min(...[0, 1].map(() => Math.hypot(q[0] - 50, q[1] - 75))) : 1e9)));
  assert.ok(near < 3);
});

test('geometry: point in polygon, scanline, arc-length sampling', () => {
  const sq = rect(0, 0, 100, 100);
  assert.ok(G.pointInRing([50, 50], sq)); assert.ok(!G.pointInRing([150, 50], sq));
  assert.deepEqual(G.scanlineX([sq], 50), [0, 100]);
  const rs = G.resample([[0, 0], [100, 0]], 10);
  assert.equal(rs.length, 11); assert.ok(Math.abs(rs[3][0] - 30) < 1e-9);
  assert.ok(Math.abs(G.polylineLength(sq, true) - 400) < 1e-9);
  assert.ok(G.signedArea(sq) > 0 || G.signedArea(sq) < 0);
});

test('clip: boolean ops and offset', () => {
  const regs = clip.normalise([rect(0, 0, 100, 100), rect(30, 30, 40, 40)]);
  assert.equal(regs.length, 1); assert.equal(regs[0].holes.length, 1);
  const shrunk = clip.offsetRegions(regs, -5);
  const bb = G.bbox(shrunk[0].outer);
  assert.ok(Math.abs(bb.minX - 5) < 0.1 && Math.abs(bb.maxX - 95) < 0.1);
  assert.equal(clip.union([rect(0, 0, 50, 50)], [rect(25, 0, 50, 50)]).length, 1);
  assert.equal(clip.intersect([rect(0, 0, 50, 50)], [rect(100, 0, 50, 50)]).length, 0);
  const grown = clip.offsetRegions(clip.normalise([circle(0, 0, 50)]), 10);
  assert.ok(Math.abs(G.bbox(grown[0].outer).maxX - 60) < 1);
});
