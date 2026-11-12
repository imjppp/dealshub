// Internal embroidery pattern model.
// Units: 0.1 mm (the unit every machine format uses). Y axis points DOWN, like
// SVG / Affinity. Writers flip Y where a format needs it.

export const CMD = Object.freeze({
  STITCH: 0,
  JUMP: 1,
  TRIM: 2,
  COLOR_CHANGE: 3,
  STOP: 4,
  END: 5,
});
export const CMD_NAMES = ['STITCH', 'JUMP', 'TRIM', 'COLOR_CHANGE', 'STOP', 'END'];

/** @typedef {{color:number, name:string, brand:string, catalog:string}} Thread */
/** @typedef {{x:number, y:number, cmd:number}} Stitch */

/** @returns {Thread} */
export function makeThread(color = 0, name = '', brand = '', catalog = '') {
  return { color: color & 0xffffff, name, brand, catalog };
}

export function hexToInt(hex) {
  return parseInt(String(hex).replace('#', ''), 16) & 0xffffff;
}
export function intToHex(c) {
  return '#' + (c & 0xffffff).toString(16).padStart(6, '0');
}

export class Pattern {
  constructor() {
    /** @type {Stitch[]} */ this.stitches = [];
    /** @type {Thread[]} */ this.threads = [];
    this.meta = { name: 'Untitled', author: '', comments: '' };
  }
  get lastX() { return this.stitches.length ? this.stitches[this.stitches.length - 1].x : 0; }
  get lastY() { return this.stitches.length ? this.stitches[this.stitches.length - 1].y : 0; }
  add(x, y, cmd) { this.stitches.push({ x, y, cmd }); return this; }
  stitch(x, y) { return this.add(x, y, CMD.STITCH); }
  jump(x, y) { return this.add(x, y, CMD.JUMP); }
  trim() { return this.add(this.lastX, this.lastY, CMD.TRIM); }
  colorChange() { return this.add(this.lastX, this.lastY, CMD.COLOR_CHANGE); }
  stop() { return this.add(this.lastX, this.lastY, CMD.STOP); }
  end() { return this.add(this.lastX, this.lastY, CMD.END); }
  addThread(t) { this.threads.push(t); return this; }

  /** Bounds over every stitch position (any command), like pyembroidery. */
  bounds() {
    if (!this.stitches.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const s of this.stitches) {
      if (s.x < minX) minX = s.x;
      if (s.x > maxX) maxX = s.x;
      if (s.y < minY) minY = s.y;
      if (s.y > maxY) maxY = s.y;
    }
    return { minX, minY, maxX, maxY };
  }

  count(cmd) { let n = 0; for (const s of this.stitches) if (s.cmd === cmd) n++; return n; }
  countColorChanges() { return this.count(CMD.COLOR_CHANGE); }
  /** Number of colour blocks that contain at least one stitch. */
  colorBlockCount() { return this.count(CMD.COLOR_CHANGE) + 1; }

  clone() {
    const p = new Pattern();
    p.stitches = this.stitches.map((s) => ({ ...s }));
    p.threads = this.threads.map((t) => ({ ...t }));
    p.meta = { ...this.meta };
    return p;
  }
}

const FILLERS = [0xff0000, 0x00aa00, 0x0000ff, 0xffaa00, 0x990099, 0x00aaaa, 0x777777, 0x000000];
/** Thread for index i, inventing a filler when the list is short. */
export function threadOrFiller(pattern, i) {
  return pattern.threads[i] ?? makeThread(FILLERS[i % FILLERS.length], 'Filler ' + (i + 1));
}

/** Pad the thread list so every colour block has a thread. */
export function fixThreadCount(pattern) {
  let blocks = 0, init = true;
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.STITCH) { if (init) { blocks++; init = false; } }
    else if (s.cmd === CMD.COLOR_CHANGE) init = true;
  }
  while (pattern.threads.length < blocks) pattern.threads.push(threadOrFiller(pattern, pattern.threads.length));
  return pattern;
}
