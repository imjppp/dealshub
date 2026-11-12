// Melco EXP. 2 bytes per stitch; 0x80 prefix for control codes. Max delta 127.
import { ByteWriter } from '../core/bytes.js';
import { CMD } from '../core/pattern.js';
import { encode } from '../core/encoder.js';

export const caps = { maxStitch: 127, maxJump: 127, stopAsColor: false };

export function write(pattern) {
  const p = encode(pattern, caps);
  const w = new ByteWriter();
  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    switch (s.cmd) {
      case CMD.STITCH: w.u8(dx).u8(-dy); break;
      case CMD.JUMP: w.u8(0x80).u8(0x04).u8(dx).u8(-dy); break;
      case CMD.TRIM: w.bytes([0x80, 0x80, 0x07, 0x00]); break;
      case CMD.COLOR_CHANGE:
      case CMD.STOP: w.bytes([0x80, 0x01, 0x00, 0x00]); break;
      default: break;
    }
  }
  return w.result();
}
