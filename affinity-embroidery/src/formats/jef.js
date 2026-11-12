// Janome JEF. Header with colour table (Janome palette indices) + 2-byte stitches.
import { ByteWriter } from '../core/bytes.js';
import { CMD, fixThreadCount } from '../core/pattern.js';
import { encode } from '../core/encoder.js';
import { nearestIndex } from '../core/color.js';
import JEF_PALETTE from '../data/jef-palette.js';

export const caps = { maxStitch: 127, maxJump: 127, stopAsColor: false };

function hoopSize(w, h) {
  if (w < 500 && h < 500) return 1;
  if (w < 1260 && h < 1100) return 3;
  if (w < 1400 && h < 2000) return 2;
  if (w < 2000 && h < 2000) return 4;
  return 0;
}
function hoopEdge(w, x, y) {
  if (Math.min(x, y) >= 0) w.u32le(x).u32le(y).u32le(x).u32le(y);
  else w.u32le(-1).u32le(-1).u32le(-1).u32le(-1);
}
const pyRound = (v) => { const f = Math.floor(v); const d = v - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };

/** @param {{trims?:boolean, trimAt?:number, date?:string}} [opts] */
export function write(pattern, opts = {}) {
  const trims = opts.trims ?? false;
  const trimAt = opts.trimAt ?? 3;
  const date = opts.date ?? new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
  const p = encode(pattern, caps);
  fixThreadCount(p);

  const set = JEF_PALETTE.slice();
  let lastIndex = null, lastThread = null, colorToggled = false, colorCount = 0, ti = 0;
  const palette = [];
  for (const s of p.stitches) {
    if (s.cmd === CMD.COLOR_CHANGE || ti === 0) {
      const th = p.threads[ti++];
      colorCount++;
      let idx = nearestIndex(th.color, set);
      if (lastIndex === idx && lastThread !== th) {
        const keep = set[idx];
        set[idx] = null;
        idx = nearestIndex(th.color, set);
        set[lastIndex] = keep;
      }
      palette.push(idx);
      lastIndex = idx; lastThread = th; colorToggled = false;
    }
    if (s.cmd === CMD.STOP) {
      colorCount++;
      colorToggled = !colorToggled;
      palette.push(colorToggled ? 0 : lastIndex);
    }
  }
  let points = 1;
  for (const s of p.stitches) {
    if (s.cmd === CMD.STITCH) points += 1;
    else if (s.cmd === CMD.JUMP) points += 2;
    else if (s.cmd === CMD.TRIM) { if (trims) points += 2 * trimAt; }
    else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) points += 2;
    else if (s.cmd === CMD.END) break;
  }
  const bd = p.bounds();
  const dw = pyRound(bd.maxX - bd.minX), dh = pyRound(bd.maxY - bd.minY);
  const hw = pyRound(dw / 2), hh = pyRound(dh / 2);

  const w = new ByteWriter();
  w.u32le(0x74 + colorCount * 8).u32le(0x14);
  w.str(date.padEnd(14, '0').slice(0, 14)).u8(0).u8(0);
  w.u32le(colorCount).u32le(points).u32le(hoopSize(dw, dh));
  w.u32le(hw).u32le(hh).u32le(hw).u32le(hh);
  hoopEdge(w, 550 - hw, 550 - hh);
  hoopEdge(w, 250 - hw, 250 - hh);
  hoopEdge(w, 700 - hw, 1000 - hh);
  hoopEdge(w, 700 - hw, 1000 - hh);
  for (const t of palette) w.u32le(t);
  for (let i = 0; i < colorCount; i++) w.u32le(0x0d);

  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    if (s.cmd === CMD.STITCH) w.u8(dx).u8(-dy);
    else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.u8(0x80).u8(0x01).u8(dx).u8(-dy);
    else if (s.cmd === CMD.TRIM) { if (trims) for (let i = 0; i < trimAt; i++) w.bytes([0x80, 0x02, 0, 0]); }
    else if (s.cmd === CMD.JUMP) w.u8(0x80).u8(0x02).u8(dx).u8(-dy);
    else if (s.cmd === CMD.END) break;
  }
  w.u8(0x80).u8(0x10);
  return w.result();
}
