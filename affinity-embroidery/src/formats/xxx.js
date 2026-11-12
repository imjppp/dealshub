// Compucon / Singer XXX.
import { ByteWriter } from '../core/bytes.js';
import { CMD, fixThreadCount } from '../core/pattern.js';
import { encode } from '../core/encoder.js';

export const caps = { maxStitch: 124, maxJump: 124, stopAsColor: false };

export function write(pattern) {
  const p = encode(pattern, caps);
  fixThreadCount(p);
  const st = p.stitches, bd = p.bounds();
  const last = st[st.length - 1];
  const w = new ByteWriter();
  w.fill(0, 0x17).u32le(st.length - 1).fill(0, 0x0c).u32le(p.threads.length).u16le(0);
  w.u16le(Math.trunc(bd.maxX - bd.minX)).u16le(Math.trunc(bd.maxY - bd.minY));
  w.u16le(Math.trunc(last.x)).u16le(Math.trunc(-last.y));
  w.u16le(Math.trunc(-bd.minX)).u16le(Math.trunc(bd.maxY));
  w.fill(0, 0x42).u16le(0).u16le(0).fill(0, 0x73).u16le(0x20).fill(0, 8);
  const ptr = w.tell(); w.u32le(0);
  let xx = 0, yy = 0;
  for (const s of st) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.u8(0x7f).u8(0x08).u8(dx).u8(-dy);
    else if (s.cmd === CMD.END) break;
    else if (s.cmd === CMD.STITCH) {
      if (dx > -124 && dx < 124 && dy > -124 && dy < 124) w.u8(dx).u8(-dy);
      else w.u8(0x7d).u16le(dx).u16le(-dy);
    } else if (s.cmd === CMD.TRIM) w.u8(0x7f).u8(0x03).u8(dx).u8(-dy);
    else if (s.cmd === CMD.JUMP) w.u8(0x7f).u8(0x01).u8(dx).u8(-dy);
  }
  const end = w.tell(); w.seek(ptr); w.u32le(end); w.seek(end);
  w.u8(0x7f).u8(0x7f).u8(0x02).u8(0x14);
  w.u8(0).u8(0);
  p.threads.forEach((t) => w.u8(0).u8(t.color >> 16).u8(t.color >> 8).u8(t.color));
  for (let i = p.threads.length; i < 21; i++) w.u32le(0);
  w.u32le(0xffffff00).u8(0).u8(1);
  return w.result();
}
