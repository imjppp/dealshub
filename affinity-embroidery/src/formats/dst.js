// Tajima DST. 512-byte ASCII header + 3-byte balanced-ternary records.
// Units 0.1 mm. Max delta per record 121. TRIM is written as a short jump
// sequence (the de-facto convention; DST has no real trim opcode).
import { ByteWriter } from '../core/bytes.js';
import { CMD } from '../core/pattern.js';
import { encode } from '../core/encoder.js';

export const caps = { maxStitch: 121, maxJump: 121, stopAsColor: false };

function record(x, y, kind) {
  y = -y; // file Y is up
  let b0 = 0, b1 = 0, b2 = 0;
  const bit = (n) => 1 << n;
  if (kind === 'jump') b2 |= bit(7);
  if (kind === 'stitch' || kind === 'jump') {
    b2 |= bit(0) | bit(1);
    if (x > 40) { b2 |= bit(2); x -= 81; }
    if (x < -40) { b2 |= bit(3); x += 81; }
    if (x > 13) { b1 |= bit(2); x -= 27; }
    if (x < -13) { b1 |= bit(3); x += 27; }
    if (x > 4) { b0 |= bit(2); x -= 9; }
    if (x < -4) { b0 |= bit(3); x += 9; }
    if (x > 1) { b1 |= bit(0); x -= 3; }
    if (x < -1) { b1 |= bit(1); x += 3; }
    if (x > 0) { b0 |= bit(0); x -= 1; }
    if (x < 0) { b0 |= bit(1); x += 1; }
    if (x !== 0) throw new RangeError('DST dx out of range');
    if (y > 40) { b2 |= bit(5); y -= 81; }
    if (y < -40) { b2 |= bit(4); y += 81; }
    if (y > 13) { b1 |= bit(5); y -= 27; }
    if (y < -13) { b1 |= bit(4); y += 27; }
    if (y > 4) { b0 |= bit(5); y -= 9; }
    if (y < -4) { b0 |= bit(4); y += 9; }
    if (y > 1) { b1 |= bit(7); y -= 3; }
    if (y < -1) { b1 |= bit(6); y += 3; }
    if (y > 0) { b0 |= bit(7); y -= 1; }
    if (y < 0) { b0 |= bit(6); y += 1; }
    if (y !== 0) throw new RangeError('DST dy out of range');
  } else if (kind === 'color') b2 = 0b11000011;
  else if (kind === 'end') b2 = 0b11110011;
  return [b0, b1, b2];
}

const pad = (v, n) => String(v).padStart(n, ' ');

/** @param {import('../core/pattern.js').Pattern} pattern @param {{trimAt?:number}} [opts] */
export function write(pattern, opts = {}) {
  const trimAt = opts.trimAt ?? 3;
  const p = encode(pattern, caps);
  const bd = p.bounds();
  const w = new ByteWriter();
  const name = (p.meta.name || 'Untitled');
  w.str('LA:' + name.padEnd(16, ' ') + '\r');
  w.str('ST:' + pad(p.stitches.length, 7) + '\r');
  w.str('CO:' + pad(p.countColorChanges(), 3) + '\r');
  w.str('+X:' + pad(Math.abs(bd.maxX), 5) + '\r');
  w.str('-X:' + pad(Math.abs(bd.minX), 5) + '\r');
  w.str('+Y:' + pad(Math.abs(bd.maxY), 5) + '\r');
  w.str('-Y:' + pad(Math.abs(bd.minY), 5) + '\r');
  let ax = 0, ay = 0;
  if (p.stitches.length) { const l = p.stitches[p.stitches.length - 1]; ax = Math.trunc(l.x); ay = -Math.trunc(l.y); }
  w.str('AX:' + (ax >= 0 ? '+' : '-') + pad(Math.abs(ax), 5) + '\r');
  w.str('AY:' + (ay >= 0 ? '+' : '-') + pad(Math.abs(ay), 5) + '\r');
  w.str('MX:+' + pad(0, 5) + '\r');
  w.str('MY:+' + pad(0, 5) + '\r');
  w.str('PD:' + '******'.padStart(6, ' ') + '\r');
  w.u8(0x1a);
  while (w.tell() < 512) w.u8(0x20);

  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    if (s.cmd === CMD.TRIM) {
      let delta = -4;
      w.bytes(record(-delta / 2, -delta / 2, 'jump'));
      for (let i = 1; i < trimAt - 1; i++) { w.bytes(record(delta, delta, 'jump')); delta = -delta; }
      w.bytes(record(delta / 2, delta / 2, 'jump'));
    } else if (s.cmd === CMD.STITCH) w.bytes(record(dx, dy, 'stitch'));
    else if (s.cmd === CMD.JUMP) w.bytes(record(dx, dy, 'jump'));
    else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.bytes(record(0, 0, 'color'));
    else if (s.cmd === CMD.END) w.bytes(record(0, 0, 'end'));
  }
  return w.result();
}
