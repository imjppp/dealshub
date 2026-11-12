// Encoder: turns an ideal pattern into one a specific machine format can store.
//  - rounds to whole 0.1 mm units WITHOUT accumulating error (works on absolute positions)
//  - splits over-long stitches / jumps into legal pieces
//  - optionally turns STOP into a colour change that re-uses the same thread
//  - makes TRIM / COLOR_CHANGE / STOP zero-movement and guarantees one final END
import { CMD, fixThreadCount } from './pattern.js';

/**
 * @param {import('./pattern.js').Pattern} pattern
 * @param {{maxStitch:number, maxJump:number, stopAsColor?:boolean}} caps
 * @returns {import('./pattern.js').Pattern}
 */
export function encode(pattern, caps) {
  const src = pattern.clone();
  fixThreadCount(src);
  const out = src.clone();
  out.stitches = [];

  let px = 0, py = 0;
  let threadIdx = 0; // thread of the current colour block
  const emit = (x, y, cmd) => { out.stitches.push({ x, y, cmd }); px = x; py = y; };

  for (const s of src.stitches) {
    const x = Math.round(s.x), y = Math.round(s.y);
    switch (s.cmd) {
      case CMD.STITCH:
      case CMD.JUMP: {
        const max = s.cmd === CMD.STITCH ? caps.maxStitch : caps.maxJump;
        const dx = x - px, dy = y - py;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / max));
        const sx = px, sy = py;
        for (let i = 1; i <= n; i++) emit(sx + Math.round((dx * i) / n), sy + Math.round((dy * i) / n), s.cmd);
        break;
      }
      case CMD.COLOR_CHANGE:
        emit(px, py, CMD.COLOR_CHANGE);
        threadIdx++;
        break;
      case CMD.STOP:
        if (caps.stopAsColor) {
          out.threads.splice(threadIdx, 0, out.threads[threadIdx]);
          threadIdx++;
          emit(px, py, CMD.COLOR_CHANGE);
        } else emit(px, py, CMD.STOP);
        break;
      case CMD.TRIM:
        emit(px, py, CMD.TRIM);
        break;
      case CMD.END:
        break; // one END is appended below
    }
  }
  emit(px, py, CMD.END);
  return out;
}

/** Iterate colour blocks: yields {stitches, thread}. A block ends at COLOR_CHANGE
 *  (the COLOR_CHANGE record belongs to the NEXT block, like pyembroidery). */
export function* colorBlocks(pattern) {
  let idx = 0, last = 0;
  const st = pattern.stitches;
  for (let i = 0; i < st.length; i++) {
    if (st[i].cmd !== CMD.COLOR_CHANGE) continue;
    yield { stitches: st.slice(last, i), thread: pattern.threads[idx] };
    idx++;
    last = i;
  }
  yield { stitches: st.slice(last), thread: pattern.threads[idx] };
}
