// Brother PEC stitch block (shared by PES) and standalone .PEC writer.
import { ByteWriter } from '../core/bytes.js';
import { CMD, fixThreadCount } from '../core/pattern.js';
import { encode } from '../core/encoder.js';
import { nearestIndex } from '../core/color.js';
import PEC_PALETTE from '../data/pec-palette.js';
import PEC_BLANK from '../data/pec-blank.js';

export const caps = { maxStitch: 2047, maxJump: 2047, stopAsColor: true };

const ICON_W = 48, ICON_H = 38;
const pyRound = (v) => { const f = Math.floor(v); const d = v - f; return d < 0.5 ? f : d > 0.5 ? f + 1 : (f % 2 === 0 ? f : f + 1); };

/** Assign each thread a unique PEC palette index (nearest remaining). */
export function buildUniquePalette(threads) {
  const palette = PEC_PALETTE.slice();
  const chart = new Array(palette.length).fill(null);
  const seen = new Set();
  for (const t of threads) {
    if (seen.has(t.color)) continue; // identical colours share one slot
    seen.add(t.color);
    const idx = nearestIndex(t.color, palette);
    if (idx === null) break;
    palette[idx] = null;
    chart[idx] = t;
  }
  return threads.map((t) => nearestIndex(t.color, chart));
}

function writeValue(w, v, long = false, flag = 0) {
  if (!long && v > -64 && v < 63) w.u8(v & 0x7f);
  else {
    let x = v & 0x0fff;
    x |= 0x8000;
    x |= flag << 8;
    w.u8((x >> 8) & 0xff).u8(x & 0xff);
  }
}

function pecEncode(w, p) {
  let colorTwo = true, jumping = true, init = true, xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx; yy += dy;
    if (s.cmd === CMD.STITCH) {
      if (jumping) { if (dx !== 0 && dy !== 0) { writeValue(w, 0); writeValue(w, 0); } jumping = false; }
      writeValue(w, dx); writeValue(w, dy);
    } else if (s.cmd === CMD.JUMP) {
      jumping = true;
      const flag = init ? 0b00010000 : 0b00100000; // first jump = jump, others = trim+jump
      writeValue(w, dx, true, flag); writeValue(w, dy, true, flag);
    } else if (s.cmd === CMD.COLOR_CHANGE) {
      if (jumping) { writeValue(w, 0); writeValue(w, 0); jumping = false; }
      w.u8(0xfe).u8(0xb0).u8(colorTwo ? 2 : 1);
      colorTwo = !colorTwo;
    } else if (s.cmd === CMD.END) { w.u8(0xff); break; }
    init = false;
  }
}

function markBit(g, x, y) { if (x < 0 || x >= 48 || y < 0 || y >= 38) return; g[y * 6 + (x >> 3)] |= 1 << (x & 7); }
function drawScaled(bd, points, g, buffer) {
  let dw = bd.maxX - bd.minX, dh = bd.maxY - bd.minY;
  if (dw === 0) dw = 1;
  if (dh === 0) dh = 1;
  const scale = Math.min((48 - buffer) / dw, (g.length / 6 - buffer) / dh);
  const cx = (bd.maxX + bd.minX) / 2, cy = (bd.maxY + bd.minY) / 2;
  const tx = -cx * scale + 24, ty = -cy * scale + (g.length / 6) / 2;
  for (const s of points) markBit(g, Math.floor(s.x * scale + tx), Math.floor(s.y * scale + ty));
}

/** Writes the PEC section (header, stitch block, graphics). Returns {indices, rgbs}. */
export function writePecSection(w, p) {
  fixThreadCount(p);
  const bd = p.bounds();
  // header
  const name = (p.meta.name || 'Untitled').slice(0, 8);
  w.str('LA:' + name.padEnd(16, ' ') + '\r');
  w.bytes([0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0x20, 0xff, 0x00]);
  w.u8(ICON_W / 8).u8(ICON_H);
  const idxs = buildUniquePalette(p.threads);
  const n = idxs.length;
  if (n !== 0) {
    w.fill(0x20, 12);
    w.u8(n - 1);
    if (n > 254) throw new RangeError('PEC supports at most 254 colour blocks');
    for (const i of idxs) w.u8(i);
  } else w.bytes([0x20, 0x20, 0x20, 0x20, 0x64, 0x20, 0x00, 0x20, 0x00, 0x20, 0x20, 0x20, 0xff]);
  for (let i = n; i < 463; i++) w.u8(0x20);

  // stitch block
  const start = w.tell();
  w.u8(0).u8(0).u24le(0).bytes([0x31, 0xff, 0xf0]);
  w.u16le(pyRound(bd.maxX - bd.minX)).u16le(pyRound(bd.maxY - bd.minY)).u16le(0x1e0).u16le(0x1b0);
  pecEncode(w, p);
  const len = w.tell() - start, cur = w.tell();
  w.seek(start + 2); w.u24le(len); w.seek(cur);

  // graphics: whole design, then one icon per colour block
  const all = PEC_BLANK.slice();
  drawScaled(bd, p.stitches.filter((s) => s.cmd === CMD.STITCH), all, 4);
  w.bytes(all);
  let blockStitches = [];
  const flush = () => {
    const g = PEC_BLANK.slice();
    drawScaled(bd, blockStitches, g, 5);
    w.bytes(g);
    blockStitches = [];
  };
  for (const s of p.stitches) {
    if (s.cmd === CMD.STITCH) blockStitches.push(s);
    else if (s.cmd === CMD.COLOR_CHANGE) flush();
  }
  flush();
  return { indices: idxs, rgbs: p.threads.map((t) => t.color) };
}

export function write(pattern) {
  const p = encode(pattern, caps);
  const w = new ByteWriter();
  w.str('#PEC0001');
  writePecSection(w, p);
  return w.result();
}
