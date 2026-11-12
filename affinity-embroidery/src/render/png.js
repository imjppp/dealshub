// Dependency-free PNG preview renderer (Node only; uses zlib for compression).
import { deflateSync } from 'node:zlib';
import { CMD } from '../core/pattern.js';
import { MM } from '../stitch/params.js';

const crcTable = (() => { const t = new Uint32Array(256); for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
const crc32 = (buf) => { let c = 0xffffffff; for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(out.subarray(4, 8 + data.length)), 8 + data.length);
  return out;
}
export function encodePNG(width, height, rgb) {
  const raw = Buffer.alloc((width * 3 + 1) * height);
  for (let y = 0; y < height; y++) { raw[y * (width * 3 + 1)] = 0; rgb.copy(raw, y * (width * 3 + 1) + 1, y * width * 3, (y + 1) * width * 3); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4); ihdr[8] = 8; ihdr[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]);
}

/** Render stitches as thin anti-aliased lines, coloured per thread; needle points as dots when zoomed in. */
export function renderPattern(pattern, { pxPerMm = 8, margin = 4, background = [250, 250, 245], jumps = true } = {}) {
  const bd = pattern.bounds();
  const w = Math.max(1, Math.ceil(((bd.maxX - bd.minX) / MM + margin * 2) * pxPerMm));
  const h = Math.max(1, Math.ceil(((bd.maxY - bd.minY) / MM + margin * 2) * pxPerMm));
  const img = Buffer.alloc(w * h * 3);
  for (let i = 0; i < w * h; i++) { img[i * 3] = background[0]; img[i * 3 + 1] = background[1]; img[i * 3 + 2] = background[2]; }
  const px = (x) => (x - bd.minX) / MM * pxPerMm + margin * pxPerMm;
  const py = (y) => (y - bd.minY) / MM * pxPerMm + margin * pxPerMm;
  const blend = (x, y, c, a) => {
    if (x < 0 || y < 0 || x >= w || y >= h || a <= 0) return;
    const o = (y * w + x) * 3;
    for (let k = 0; k < 3; k++) img[o + k] = Math.round(img[o + k] * (1 - a) + c[k] * a);
  };
  // Xiaolin Wu line, 1px wide
  const line = (x0, y0, x1, y1, c, alpha = 1) => {
    const steep = Math.abs(y1 - y0) > Math.abs(x1 - x0);
    if (steep) { [x0, y0] = [y0, x0]; [x1, y1] = [y1, x1]; }
    if (x0 > x1) { [x0, x1] = [x1, x0]; [y0, y1] = [y1, y0]; }
    const dx = x1 - x0, dy = y1 - y0, grad = dx === 0 ? 1 : dy / dx;
    let y = y0;
    for (let x = Math.floor(x0); x <= Math.ceil(x1); x++) {
      const f = y - Math.floor(y), yi = Math.floor(y);
      if (steep) { blend(yi, x, c, (1 - f) * alpha); blend(yi + 1, x, c, f * alpha); }
      else { blend(x, yi, c, (1 - f) * alpha); blend(x, yi + 1, c, f * alpha); }
      y += grad;
    }
  };
  const threadColor = (i) => { const t = pattern.threads[Math.min(i, pattern.threads.length - 1)]; const c = t ? t.color : 0x888888; return [(c >> 16) & 255, (c >> 8) & 255, c & 255]; };
  let ti = 0, prev = null;
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.COLOR_CHANGE) { ti++; prev = [s.x, s.y]; continue; }
    if (s.cmd === CMD.STITCH && prev) {
      const c = threadColor(ti);
      // a darker core + lighter halo gives thread-like contrast on light backgrounds
      line(px(prev[0]), py(prev[1]), px(s.x), py(s.y), c, 1);
    } else if (s.cmd === CMD.JUMP && prev && jumps) line(px(prev[0]), py(prev[1]), px(s.x), py(s.y), [190, 190, 190], 0.5);
    if (s.cmd === CMD.STITCH || s.cmd === CMD.JUMP) prev = [s.x, s.y];
  }
  return { png: encodePNG(w, h, img), width: w, height: h };
}
