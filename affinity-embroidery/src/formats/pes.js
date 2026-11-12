// Brother PES (v1 and v6) = PES header + CEmbOne/CSewSeg vector blocks + PEC section.
import { ByteWriter } from '../core/bytes.js';
import { CMD, fixThreadCount, intToHex } from '../core/pattern.js';
import { encode } from '../core/encoder.js';
import { nearestIndex } from '../core/color.js';
import PEC_PALETTE from '../data/pec-palette.js';
import { caps as pecCaps, writePecSection } from './pec.js';

export const caps = pecCaps;

const str8 = (w, s) => { if (s == null || s === '') { w.u8(0); return; } s = String(s).slice(0, 255); w.u8(s.length).str(s); };
const str16 = (w, s) => { w.u16le(s.length).str(s); };

function headerV1(w, blocks) { w.u16le(1).u16le(1).u16le(blocks); }

function headerV6(w, p, chart, blocks) {
  w.u16le(1).str('02');
  str8(w, p.meta.name); str8(w, p.meta.category); str8(w, p.meta.author); str8(w, p.meta.keywords); str8(w, p.meta.comments);
  w.u16le(0).u16le(0).u16le(0x64).u16le(0x64).u16le(0).u16le(0xc8).u16le(0xc8).u16le(0x64).u16le(0x64).u16le(0x64);
  w.u16le(0x07).u16le(0x13).u16le(1).u16le(1).u16le(0).u16le(100).u16le(1).u16le(0);
  w.u8(0);
  [1, 0, 0, 1, 0, 0].forEach((f) => w.f32le(f));
  w.u16le(0).u16le(0).u16le(0).u16le(chart.length);
  for (const t of chart) {
    str8(w, t.catalog);
    w.u8((t.color >> 16) & 255).u8((t.color >> 8) & 255).u8(t.color & 255).u8(0).u32le(0xa);
    str8(w, t.name || intToHex(t.color)); str8(w, t.brand); str8(w, '');
  }
  w.u16le(blocks);
}

/** Group consecutive same-command stitches. */
function commandBlocks(st) {
  const out = []; let cur = [];
  for (const s of st) { if (cur.length && cur[0].cmd !== s.cmd) { out.push(cur); cur = []; } cur.push(s); }
  if (cur.length) out.push(cur);
  return out;
}

function segments(p, chartIdx, left, bottom) {
  // returns [{pts, color, flag}]
  const res = [];
  let thread = 0, color = chartIdx(thread); thread++;
  let sx = 0, sy = 0;
  for (const block of commandBlocks(p.stitches)) {
    const c = block[0].cmd;
    if (c === CMD.JUMP) {
      const last = block[block.length - 1];
      res.push({ pts: [[sx - left, sy - bottom], [last.x - left, last.y - bottom]], color, flag: 1 });
    } else if (c === CMD.COLOR_CHANGE) { color = chartIdx(thread); thread++; }
    else if (c === CMD.STITCH) {
      const pts = [];
      for (const s of block) { sx = s.x; sy = s.y; pts.push([sx - left, sy - bottom]); }
      res.push({ pts, color, flag: 0 });
    }
  }
  return res;
}

function writeBlocks(w, p, chartIdx, bd) {
  const width = bd.maxX - bd.minX, height = bd.maxY - bd.minY;
  str16(w, 'CEmbOne');
  for (let i = 0; i < 8; i++) w.u16le(0);
  const tx = 350 + 1300 / 2 - width / 2, ty = 100 + height + 1800 / 2 - height / 2;
  [1, 0, 0, 1, tx, ty].forEach((f) => w.f32le(f));
  w.u16le(1).u16le(0).u16le(0).u16le(Math.trunc(width)).u16le(Math.trunc(height));
  w.fill(0, 8);
  const secPos = w.tell(); w.u16le(0);
  w.u16le(0xffff).u16le(0);
  str16(w, 'CSewSeg');
  const segs = segments(p, chartIdx, bd.minX, bd.maxY);
  const log = []; let prev = -1, first = true, section = 0;
  for (const s of segs) {
    if (!first) w.u16le(0x8003);
    first = false;
    if (prev !== s.color) { log.push([section, s.color]); prev = s.color; }
    w.u16le(s.flag).u16le(s.color).u16le(s.pts.length);
    for (const [x, y] of s.pts) w.u16le(Math.trunc(x)).u16le(Math.trunc(y));
    section++;
  }
  w.u16le(log.length);
  for (const [a, b] of log) w.u16le(a).u16le(b);
  const cur = w.tell(); w.seek(secPos); w.u16le(section); w.seek(cur);
  w.u16le(0).u16le(0);
  return log;
}

/** @param {{version?:1|6}} [opts] */
export function write(pattern, opts = {}) {
  const version = opts.version ?? 1;
  const p = encode(pattern, caps);
  fixThreadCount(p);
  const bd = p.bounds();
  const w = new ByteWriter();
  w.str(version === 6 ? '#PES0060' : '#PES0001');
  const pecPtr = w.tell(); w.u32le(0);
  const has = p.stitches.length > 0;
  const chartIdx = version === 6 ? (i) => nearestIndex(p.threads[Math.min(i, p.threads.length - 1)].color, p.threads)
    : (i) => nearestIndex(p.threads[Math.min(i, p.threads.length - 1)].color, PEC_PALETTE);
  let log = [];
  if (version === 6) headerV6(w, p, p.threads, has ? 1 : 0); else headerV1(w, has ? 1 : 0);
  if (has) {
    w.u16le(0xffff).u16le(0);
    log = writeBlocks(w, p, chartIdx, bd);
    if (version === 6) { w.u32le(0).u32le(0); log.forEach((_, i) => w.u32le(i).u32le(0)); }
  } else { w.u16le(0).u16le(0); }
  const cur = w.tell(); w.seek(pecPtr); w.u32le(cur); w.seek(cur);
  const info = writePecSection(w, p);
  if (version === 6) {
    const idx = [info.indices.length - 1, ...info.indices]; // count byte + palette indices, as in the PEC header
    w.bytes(idx); w.fill(0x20, 128 - idx.length);
    for (let i = 0; i < info.rgbs.length; i++) w.fill(0, 0x90);
    for (const c of info.rgbs) w.u24le(c);
    w.u16le(0);
  }
  return w.result();
}
