// Stitch plan: blocks -> ordered, optimised Pattern (colour grouping, NN routing, trims, ties).
import { Pattern, CMD, makeThread, intToHex } from '../core/pattern.js';
import { dist } from '../core/geometry.js';
import { nearestThread } from './palette.js';
import { MM } from '../stitch/params.js';

export const PLAN_DEFAULTS = Object.freeze({
  optimise: true, // false = keep document order (only merge adjacent same-colour blocks)
  stitchJoinMax: 0.6, // mm: gaps up to this are simply stitched, not jumped
  trimThreshold: 3.0, // mm: jumps longer than this get a TRIM first
  tieIn: true,
  tieOff: true,
  tieLength: 0.6, // mm
  minStitch: 0.1, // mm: points closer than this to the previous one are dropped
  palette: null, // Palette object to snap colours to, or null to keep exact RGB
  center: true, // translate so the design is centred on the hoop origin
  start: null, // [x,y] mm preferred start position (design space)
});

function threadFor(color, palette) {
  return palette ? nearestThread(color, palette) : makeThread(color, intToHex(color), '', '');
}

/** Group + order blocks. Returns [{thread, blocks:[...]}, ...] in sewing order. */
export function orderBlocks(blocks, o) {
  const groups = [];
  if (o.optimise) {
    const byColor = new Map();
    for (const b of blocks) {
      const key = threadFor(b.color, o.palette).color;
      if (!byColor.has(key)) { byColor.set(key, { thread: threadFor(b.color, o.palette), blocks: [] }); groups.push(byColor.get(key)); }
      byColor.get(key).blocks.push(b);
    }
  } else {
    for (const b of blocks) {
      const th = threadFor(b.color, o.palette);
      const last = groups[groups.length - 1];
      if (last && last.thread.color === th.color) last.blocks.push(b); else groups.push({ thread: th, blocks: [b] });
    }
  }
  // nearest-neighbour ordering inside each colour group
  let pos = o.start ? [o.start[0] * MM, o.start[1] * MM] : [0, 0];
  for (const g of groups) {
    if (!o.optimise) { for (const b of g.blocks) pos = endOf(b); continue; }
    const left = g.blocks.slice(), ordered = [];
    while (left.length) {
      let bi = 0, bd = Infinity, brev = false;
      left.forEach((b, i) => {
        const s = startOf(b), e = endOf(b);
        const d0 = dist(pos, s);
        if (d0 < bd) { bd = d0; bi = i; brev = false; }
        if (b.reversible) { const d1 = dist(pos, e); if (d1 < bd) { bd = d1; bi = i; brev = true; } }
      });
      let b = left.splice(bi, 1)[0];
      if (brev) b = reverseBlock(b);
      ordered.push(b);
      pos = endOf(b);
    }
    g.blocks = ordered;
  }
  return groups;
}
const startOf = (b) => b.segments[0][0];
const endOf = (b) => { const s = b.segments[b.segments.length - 1]; return s[s.length - 1]; };
function reverseBlock(b) { return { ...b, segments: b.segments.slice().reverse().map((s) => s.slice().reverse()) }; }

function lockStitch(p, toward, lenDu) {
  const d = dist(p, toward);
  if (d < 1e-6) return [];
  const l = Math.min(lenDu, d / 2);
  const v = [p[0] + ((toward[0] - p[0]) / d) * l, p[1] + ((toward[1] - p[1]) / d) * l];
  return [v, p]; // p -> v -> p
}

/**
 * @param {any[]} blocks from stitchShape()
 * @param {Partial<typeof PLAN_DEFAULTS>} [opts]
 * @returns {{pattern:Pattern, stats:ReturnType<typeof computeStats>}}
 */
export function buildPattern(blocks, opts = {}) {
  const o = { ...PLAN_DEFAULTS, ...opts };
  const live = blocks.filter((b) => b.segments.some((s) => s.length > 1));
  const pattern = new Pattern();
  if (!live.length) { pattern.end(); return { pattern, stats: computeStats(pattern) }; }
  const groups = orderBlocks(live, o);

  // centring offset
  let off = [0, 0];
  if (o.center) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const g of groups) for (const b of g.blocks) for (const s of b.segments) for (const [x, y] of s) {
      if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    off = [-(minX + maxX) / 2, -(minY + maxY) / 2];
  }
  const T = (p) => [p[0] + off[0], p[1] + off[1]];
  const joinMax = o.stitchJoinMax * MM, trimAt = o.trimThreshold * MM, minSt = o.minStitch * MM, tieLen = o.tieLength * MM;

  let cur = null; // current needle position
  let lastDir = null; // previous needle point of the current run (for tie-off direction)
  let needsTieIn = true;
  const put = (p, cmd = CMD.STITCH) => { pattern.add(p[0], p[1], cmd); cur = p; };

  groups.forEach((g, gi) => {
    if (gi > 0) { pattern.colorChange(); needsTieIn = true; }
    pattern.addThread(g.thread);
    for (const b of g.blocks) {
      for (const seg of b.segments) {
        const S = seg.map(T);
        if (S.length < 2) continue;
        // approach: stitch across tiny gaps, otherwise (tie-off, trim,) jump and tie in again
        if (cur === null) { pattern.jump(S[0][0], S[0][1]); cur = S[0]; needsTieIn = true; }
        else {
          const gap = dist(cur, S[0]);
          if (gap > joinMax || (needsTieIn && gap > 1e-6)) {
            if (!needsTieIn) {
              if (o.tieOff && lastDir) for (const q of lockStitch(cur, lastDir, tieLen)) put(q);
              if (gap > trimAt) pattern.trim();
            }
            pattern.jump(S[0][0], S[0][1]); cur = S[0]; needsTieIn = true;
          }
        }
        if (needsTieIn) {
          put(S[0]); // first penetration at the landing point
          if (o.tieIn) for (const q of lockStitch(S[0], S[1], tieLen)) put(q);
          needsTieIn = false;
        } else if (dist(cur, S[0]) > 1e-6) put(S[0]);
        for (let i = 1; i < S.length; i++) {
          if (dist(cur, S[i]) < minSt && i !== S.length - 1) continue;
          if (dist(cur, S[i]) < 1e-6) continue;
          put(S[i]);
        }
        lastDir = S.length > 1 ? S[S.length - 2] : null;
        if (dist(lastDir ?? cur, cur) < 1e-6 && S.length > 2) lastDir = S[S.length - 3];
      }
    }
    // end of colour: tie off
    if (o.tieOff && lastDir && cur) for (const q of lockStitch(cur, lastDir, tieLen)) put(q);
    needsTieIn = true;
    lastDir = null;
  });
  pattern.trim();
  pattern.end();
  return { pattern, stats: computeStats(pattern) };
}
export function computeStats(pattern) {
  const bd = pattern.bounds();
  const st = pattern.count(CMD.STITCH);
  return {
    stitches: st,
    jumps: pattern.count(CMD.JUMP),
    trims: pattern.count(CMD.TRIM),
    colorChanges: pattern.countColorChanges(),
    colors: pattern.threads.length,
    widthMm: (bd.maxX - bd.minX) / MM,
    heightMm: (bd.maxY - bd.minY) / MM,
    threads: pattern.threads.map((t) => ({ ...t, hex: intToHex(t.color) })),
  };
}

/** Plain-text thread/summary report. */
export function threadReport(pattern, stats = computeStats(pattern), title = pattern.meta.name) {
  const lines = [];
  lines.push(`Embroidery summary: ${title}`);
  lines.push(`Size: ${stats.widthMm.toFixed(1)} x ${stats.heightMm.toFixed(1)} mm`);
  lines.push(`Stitches: ${stats.stitches}   Jumps: ${stats.jumps}   Trims: ${stats.trims}   Colour changes: ${stats.colorChanges}`);
  lines.push('');
  lines.push('Thread list (in sewing order):');
  // stitches per thread
  const per = new Array(stats.threads.length).fill(0);
  let idx = 0;
  for (const s of pattern.stitches) { if (s.cmd === CMD.COLOR_CHANGE) idx++; else if (s.cmd === CMD.STITCH) per[idx] = (per[idx] || 0) + 1; }
  stats.threads.forEach((t, i) => {
    lines.push(`${String(i + 1).padStart(2)}. ${t.hex}  ${(t.brand ? t.brand + ' ' : '') + (t.catalog ? t.catalog + ' ' : '')}${t.name && t.name !== t.hex ? t.name : ''}`.trimEnd() + `  (${per[i] ?? 0} stitches)`);
  });
  return lines.join('\n') + '\n';
}
