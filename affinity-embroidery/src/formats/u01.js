// Barudan U01 (the "0x80 | flags, dy, dx" format). 0x80-byte "0" header, 0x100 total.
import { ByteWriter } from '../core/bytes.js';
import { CMD } from '../core/pattern.js';
import { encode } from '../core/encoder.js';

export const caps = { maxStitch: 127, maxJump: 127, stopAsColor: false };

export function write(pattern) {
  const p = encode(pattern, caps);
  const st = p.stitches, w = new ByteWriter();
  w.fill(0x30, 0x80);
  if (!st.length) return w.result();
  const bd = p.bounds(), last = st[st.length - 1];
  w.u16le(Math.trunc(bd.minX)).u16le(-Math.trunc(bd.maxY)).u16le(Math.trunc(bd.maxX)).u16le(-Math.trunc(bd.minY));
  w.u32le(0).u32le(st.length + 1).u16le(Math.trunc(last.x)).u16le(-Math.trunc(last.y));
  while (w.tell() < 0x100) w.u8(0);
  let xx = 0, yy = 0, needle = 1;
  let started = false;
  for (const s of st) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    let cmd = 0x80;
    if (dy >= 0) cmd |= 0x40;
    if (dx <= 0) cmd |= 0x20;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (s.cmd === CMD.STITCH) {
      if (!started) { started = true; w.u8(0xe8 | needle).u8(0).u8(0); } // select needle 1 before the first stitch
      w.u8(cmd).u8(ay).u8(ax);
    }
    else if (s.cmd === CMD.JUMP) w.u8(cmd | 0x01).u8(ay).u8(ax);
    else if (s.cmd === CMD.STOP) w.u8(cmd | 0x08).u8(ay).u8(ax);
    else if (s.cmd === CMD.TRIM) w.u8(cmd | 0x07).u8(ay).u8(ax);
    else if (s.cmd === CMD.COLOR_CHANGE) { needle = (needle % 15) + 1; w.u8(cmd | 0x08 | needle).u8(ay).u8(ax); }
    else if (s.cmd === CMD.END) break;
  }
  w.bytes([0xf8, 0, 0]);
  return w.result();
}
