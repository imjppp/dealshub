// Builds example designs from engine shapes and exports them in every format (+ PNG preview + thread list).
import { mkdirSync, writeFileSync } from 'node:fs';
import { stitchShape } from '../src/stitch/index.js';
import { buildPattern, threadReport } from '../src/plan/plan.js';
import { FORMATS } from '../src/formats/index.js';
import { renderPattern } from '../src/render/png.js';
import { rect, circle, ellipse, star, sCurve } from '../tests/shapes.js';

const root = new URL('../examples/', import.meta.url).pathname;
const fill = (c) => ({ color: c });

const designs = {
  'star-badge': [
    { id: 1, paths: [{ points: circle(250, 250, 240), closed: true }], fill: fill('#14214d'), stroke: { color: '#e0a800', width: 35 } },
    { id: 2, paths: [{ points: star(250, 250, 170, 70), closed: true }], fill: fill('#f7e017'), stroke: { color: '#d81e1e', width: 8 } },
    { id: 3, paths: [{ points: circle(250, 250, 28), closed: true }], fill: fill('#d81e1e'), params: { fillUnderlay: false } },
  ],
  'sampler': [
    { id: 1, paths: [{ points: rect(0, 0, 220, 160), closed: true }], fill: fill('#2e9e3e'), params: { fillAngle: 45 } },
    { id: 2, paths: [{ points: circle(380, 80, 80), closed: true }, { points: circle(380, 80, 35), closed: true }], fill: fill('#c2187a'), params: { fillAngle: 0, rowSpacing: 0.35 } },
    { id: 3, paths: [{ points: sCurve(0, 220, 200, 200), closed: false }], stroke: { color: '#1b3fa0', width: 8 }, params: { bean: true } },
    { id: 4, paths: [{ points: sCurve(260, 220, 200, 200), closed: false }], stroke: { color: '#d81e1e', width: 45 }, params: { satinContour: true } },
    { id: 5, paths: [{ points: ellipse(120, 500, 110, 40), closed: true }], fill: fill('#f28c28'), params: { type: 'satin' } },
    { id: 6, paths: [{ points: star(380, 500, 70, 28), closed: true }], fill: fill('#7a3fa0'), params: { type: 'contour', rowSpacing: 0.6 } },
  ],
};

for (const [name, shapes] of Object.entries(designs)) {
  const dir = root + name + '/';
  mkdirSync(dir, { recursive: true });
  const { pattern, stats } = buildPattern(shapes.flatMap(stitchShape));
  pattern.meta.name = name.slice(0, 16);
  writeFileSync(dir + name + '.shapes.json', JSON.stringify(shapes));
  for (const [key, f] of Object.entries(FORMATS)) {
    const file = key === 'pes1' ? `${name}-v1.pes` : key === 'pes6' ? `${name}-v6.pes` : `${name}.${f.ext}`;
    writeFileSync(dir + file, f.write(pattern, key === 'jef' ? { date: '20240101000000' } : {}));
  }
  writeFileSync(dir + name + '.png', renderPattern(pattern, { pxPerMm: 8 }).png);
  writeFileSync(dir + name + '-threads.txt', threadReport(pattern, stats, name));
  console.log(`${name}: ${stats.stitches} stitches, ${stats.colors} colours, ${stats.trims} trims, ${stats.widthMm.toFixed(1)}x${stats.heightMm.toFixed(1)} mm`);
}
