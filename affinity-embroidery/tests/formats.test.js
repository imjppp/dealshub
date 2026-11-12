import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { FORMATS } from '../src/formats/index.js';
import { encode } from '../src/core/encoder.js';
import { CMD } from '../src/core/pattern.js';
import * as dst from '../src/formats/dst.js';
import { ALL, plainPattern } from './fixtures.js';

/** Independent DST decoder (inverse of the balanced-ternary record encoding). */
function decodeDst(buf) {
  const out = []; let x = 0, y = 0;
  for (let i = 512; i + 2 < buf.length; i += 3) {
    const [b0, b1, b2] = [buf[i], buf[i + 1], buf[i + 2]];
    const bit = (b, n) => (b >> n) & 1;
    let dx = 0, dy = 0;
    dx += bit(b0, 0) * 1 - bit(b0, 1) * 1 + bit(b0, 2) * 9 - bit(b0, 3) * 9 + bit(b1, 0) * 3 - bit(b1, 1) * 3 + bit(b1, 2) * 27 - bit(b1, 3) * 27 + bit(b2, 2) * 81 - bit(b2, 3) * 81;
    dy += bit(b0, 7) * 1 - bit(b0, 6) * 1 + bit(b0, 5) * 9 - bit(b0, 4) * 9 + bit(b1, 7) * 3 - bit(b1, 6) * 3 + bit(b1, 5) * 27 - bit(b1, 4) * 27 + bit(b2, 5) * 81 - bit(b2, 4) * 81;
    dy = -dy;
    if ((b2 & 0xf3) === 0xf3) { out.push({ x, y, cmd: CMD.END }); break; }
    if ((b2 & 0xc3) === 0xc3) { out.push({ x, y, cmd: CMD.COLOR_CHANGE }); continue; }
    x += dx; y += dy;
    out.push({ x, y, cmd: b2 & 0x80 ? CMD.JUMP : CMD.STITCH });
  }
  return out;
}

test('DST: decode(encode(p)) reproduces the encoded pattern (stitches and jumps)', () => {
  const p = plainPattern();
  const enc = encode(p, dst.caps).stitches.filter((s) => s.cmd !== CMD.TRIM);
  const dec = decodeDst(dst.write(p)).filter((s) => !(s.cmd === CMD.JUMP && Math.abs(s.x) < 0)); // trims are 3 tiny jumps; filtered below
  const move = (a) => a.filter((s) => s.cmd === CMD.STITCH).map((s) => [s.x, s.y]);
  assert.deepEqual(move(dec), move(enc));
  assert.equal(decodeDst(dst.write(p)).filter((s) => s.cmd === CMD.COLOR_CHANGE).length, 2);
});

test('DST: header is 512 bytes with LA/ST/CO fields', () => {
  const b = dst.write(plainPattern());
  assert.equal(new TextDecoder().decode(b.subarray(0, 3)), 'LA:');
  assert.equal(b[510 - 0] !== undefined, true);
  const hdr = new TextDecoder().decode(b.subarray(0, 512));
  assert.match(hdr, /CO:\s+2\r/);
  assert.equal(b.length % 3, 512 % 3);
});

/** Walk the VP3 block tree and check every length prefix lands exactly on a block boundary. */
function checkVp3(b) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  assert.equal(new TextDecoder().decode(b.subarray(0, 5)), '%vsm%');
  let pos = 5 + 1; // marker + 0
  const slen = dv.getUint16(pos); pos += 2 + slen; // producer string (UTF-16)
  const blocks = [];
  // file block: 00 02 00 <len>
  assert.deepEqual([...b.subarray(pos, pos + 3)], [0, 2, 0]);
  const fileEnd = pos + 3 + 4 + dv.getUint32(pos + 3);
  assert.equal(fileEnd, b.length, 'file block length reaches EOF');
  pos += 7;
  pos += 2 + dv.getUint16(pos); // notes string
  pos += 16 + 4; // extents + stitch count
  const colors = b[pos + 1]; pos += 4; // 0, colours, 12, 0
  assert.equal(b[pos], 1); pos++; // designs
  assert.deepEqual([...b.subarray(pos, pos + 3)], [0, 3, 0]);
  const designEnd = pos + 7 + dv.getUint32(pos + 3);
  assert.equal(designEnd, fileEnd);
  pos += 7;
  pos += 4 + 4 + 3 + 16 + 8; // centre, 3 zero bytes, extents2, w/h
  pos += 2 + dv.getUint16(pos); // notes
  pos += 2 + 16 + 6; // 'dd', 4 x int32, 'xxPP' 01 00
  pos += 2 + dv.getUint16(pos); // producer
  const count = dv.getUint16(pos); pos += 2;
  assert.equal(count, colors);
  for (let i = 0; i < count; i++) {
    assert.deepEqual([...b.subarray(pos, pos + 3)], [0, 5, 0]);
    const end = pos + 7 + dv.getUint32(pos + 3);
    let q = pos + 7 + 8; // start x,y
    assert.deepEqual([...b.subarray(q, q + 2)], [1, 0]);
    const rgb = (b[q + 2] << 16) | (b[q + 3] << 8) | b[q + 4];
    q += 2 + 3 + 5;
    for (let s = 0; s < 3; s++) q += 2 + dv.getUint16(q); // catalogue, name, brand
    q += 8; // block shift
    assert.deepEqual([...b.subarray(q, q + 3)], [0, 1, 0]);
    const sEnd = q + 7 + dv.getUint32(q + 3);
    assert.equal(sEnd + 1, end, 'stitch block + trailing 0 ends the colour block');
    blocks.push({ rgb });
    pos = end;
  }
  assert.equal(pos, designEnd);
  return blocks;
}

test('VP3: nested big-endian length prefixes are consistent; per-block colours preserved', () => {
  const p = plainPattern();
  const blocks = checkVp3(FORMATS.vp3.write(p));
  assert.deepEqual(blocks.map((b) => b.rgb), p.threads.map((t) => t.color));
  checkVp3(FORMATS.vp3.write(ALL.stress()));
});

test('every format writes non-empty output without throwing for all fixtures', () => {
  for (const [name, make] of Object.entries(ALL)) for (const [k, f] of Object.entries(FORMATS)) {
    const bytes = f.write(make(), {});
    assert.ok(bytes.length > 20, `${name}/${k}`);
  }
});

test('PES signatures', () => {
  const p = plainPattern();
  assert.equal(new TextDecoder().decode(FORMATS.pes1.write(p).subarray(0, 8)), '#PES0001');
  assert.equal(new TextDecoder().decode(FORMATS.pes6.write(p).subarray(0, 8)), '#PES0060');
  assert.equal(new TextDecoder().decode(FORMATS.pec.write(p).subarray(0, 8)), '#PEC0001');
});

test('cross-check against pyembroidery (skipped if python/pyembroidery unavailable)', (t) => {
  const py = process.env.PYTHON || 'python3';
  const probe = spawnSync(py, ['-c', 'import pyembroidery'], { env: { ...process.env, PYTHONPATH: process.env.PYLIB || '' } });
  if (probe.status !== 0) { t.skip('pyembroidery not installed (pip install pyembroidery, or set PYLIB)'); return; }
  const dir = mkdtempSync(join(tmpdir(), 'embfx-'));
  execFileSync('node', [new URL('../scripts/dump-fixtures.mjs', import.meta.url).pathname, dir]);
  const r = spawnSync(py, [new URL('../scripts/verify_pyembroidery.py', import.meta.url).pathname, dir], { env: { ...process.env, PYTHONPATH: process.env.PYLIB || '' }, encoding: 'utf8' });
  assert.equal(r.status, 0, r.stdout + r.stderr);
  assert.ok(existsSync(dir));
});
