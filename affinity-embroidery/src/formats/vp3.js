// Husqvarna Viking / Pfaff VP3. Nested, length-prefixed, big-endian blocks:
//   file(%vsm%) > design(0x03) > colour block(0x05) > stitch block(0x01)
// Each block header is 00 <id> 00 <u32be length of everything after this field>.
// Units: 0.01 mm. Per-colour-block metadata: RGB, catalogue no., name, brand.
import { ByteWriter } from '../core/bytes.js';
import { CMD, fixThreadCount, intToHex } from '../core/pattern.js';
import { encode, colorBlocks } from '../core/encoder.js';

export const caps = { maxStitch: 255, maxJump: 3200, stopAsColor: false };

const PRODUCER = 'Produced by     Software Ltd';
const s16 = (w, s) => { w.u16be(s.length * 2).str16be(s); };
const s8 = (w, s) => { const b = new TextEncoder().encode(s); w.u16be(b.length).bytes(b); };
function patch(w, off) { const cur = w.tell(); w.seek(off); w.u32be(cur - off - 4); w.seek(cur); }
const i32 = (v) => Math.trunc(v);

export function write(pattern) {
  const p = encode(pattern, caps);
  fixThreadCount(p);
  const blocks = [...colorBlocks(p)];
  const bd = p.bounds();
  const w = new ByteWriter();
  w.str('%vsm%').u8(0);
  s16(w, PRODUCER);

  w.bytes([0x00, 0x02, 0x00]);
  const fileEnd = w.tell(); w.u32be(0);
  s16(w, '');
  w.u32be(i32(bd.maxX * 100)).u32be(i32(bd.minY * -100)).u32be(i32(bd.minX * 100)).u32be(i32(bd.maxY * -100));
  w.u32be(p.stitches.length - p.count(CMD.END));
  w.u8(0).u8(blocks.length).u8(12).u8(0);
  w.u8(1); // one design

  // design block
  w.bytes([0x00, 0x03, 0x00]);
  const designEnd = w.tell(); w.u32be(0);
  const width = bd.maxX - bd.minX, height = bd.maxY - bd.minY;
  const hw = width / 2, hh = height / 2;
  const cx = bd.maxX - hw, cy = bd.maxY - hh;
  w.u32be(i32(cx) * 100).u32be(i32(cy) * -100).u8(0).u8(0).u8(0);
  w.u32be(i32(hw) * -100).u32be(i32(hw) * 100).u32be(i32(hh) * -100).u32be(i32(hh) * 100);
  w.u32be(i32(width) * 100).u32be(i32(height) * 100);
  s16(w, '');
  w.bytes([0x64, 0x64]).u32be(4096).u32be(0).u32be(0).u32be(4096);
  w.bytes([0x78, 0x78, 0x50, 0x50, 0x01, 0x00]); // "xxPP" 01 00
  s16(w, PRODUCER);
  w.u16be(blocks.length);

  blocks.forEach((blk, bi) => {
    const first = bi === 0, st = blk.stitches;
    w.bytes([0x00, 0x05, 0x00]);
    const cbEnd = w.tell(); w.u32be(0);
    let fx = 0, fy = 0, lx = 0, ly = 0;
    if (st.length) { fx = st[0].x; fy = st[0].y; if (first) { fx = 0; fy = 0; } lx = st[st.length - 1].x; ly = st[st.length - 1].y; }
    w.u32be(i32(fx - cx) * 100).u32be(i32(-(fy - cy)) * 100);
    // thread metadata
    const t = blk.thread;
    w.bytes([0x01, 0x00]).u24be(t.color).bytes([0x00, 0x00, 0x00, 0x05, 0x28]);
    s8(w, t.catalog || ''); s8(w, t.name || intToHex(t.color)); s8(w, t.brand || '');
    w.u32be(i32(lx - fx) * 100).u32be(i32(-(ly - fy)) * 100);
    // stitch block
    w.bytes([0x00, 0x01, 0x00]);
    const sbEnd = w.tell(); w.u32be(0);
    w.bytes([0x0a, 0xf6, 0x00]);
    let px = fx, py = fy;
    for (const s of st) {
      if (s.cmd === CMD.END) { w.bytes([0x80, 0x03]); break; }
      if (s.cmd === CMD.TRIM) { w.bytes([0x80, 0x03]); continue; }
      if (s.cmd !== CMD.STITCH) continue; // jumps/colour/stop: the machine just moves
      const dx = i32(s.x - px), dy = i32(s.y - py);
      px += dx; py += dy;
      if (dx >= -127 && dx <= 127 && dy >= -127 && dy <= 127) w.u8(dx).u8(dy);
      else w.bytes([0x80, 0x01]).u16be(dx).u16be(dy).bytes([0x80, 0x02]);
    }
    patch(w, sbEnd);
    w.u8(0);
    patch(w, cbEnd);
  });
  patch(w, designEnd);
  patch(w, fileEnd);
  return w.result();
}
