// Renders one PNG per stitch type into test-output/ so results can be eyeballed.
import { mkdirSync, writeFileSync } from 'node:fs';
import { stitchShape } from '../src/stitch/index.js';
import { buildPattern } from '../src/plan/plan.js';
import { renderPattern } from '../src/render/png.js';
import { rect, circle, ellipse, star, sCurve } from '../tests/shapes.js';

const out = new URL('../test-output/', import.meta.url).pathname;
mkdirSync(out, { recursive: true });
const MM = 10;
const fill = (c) => ({ color: c });
const cases = {
  'running': { id: 1, paths: [{ points: sCurve(0, 0, 400, 400), closed: false }], stroke: { color: '#1b3fa0', width: 8 } },
  'running-bean': { id: 2, paths: [{ points: sCurve(0, 0, 400, 400), closed: false }], stroke: { color: '#1b3fa0', width: 8 }, params: { bean: true, stitchLength: 3 } },
  'running-closed': { id: 3, paths: [{ points: circle(200, 200, 150), closed: true }], stroke: { color: '#d81e1e', width: 8 }, params: { stitchLength: 2 } },
  'fill-angle0': { id: 4, paths: [{ points: star(200, 200, 190, 80), closed: true }], fill: fill('#e0a800'), params: { fillUnderlay: false } },
  'fill-angle45-underlay': { id: 5, paths: [{ points: star(200, 200, 190, 80), closed: true }], fill: fill('#2e9e3e'), params: { fillAngle: 45 } },
  'fill-no-stagger': { id: 6, paths: [{ points: circle(200, 200, 150), closed: true }], fill: fill('#7a3fa0'), params: { stagger: 0, fillUnderlay: false, rowSpacing: 0.4 } },
  'fill-hole': { id: 7, paths: [{ points: rect(0, 0, 400, 400), closed: true }, { points: circle(200, 200, 100), closed: true }], fill: fill('#c2187a'), params: { fillAngle: 20 } },
  'fill-islands': { id: 8, paths: [{ points: circle(100, 100, 90), closed: true }, { points: circle(330, 100, 90), closed: true }, { points: circle(215, 300, 90), closed: true }], fill: fill('#0e8a8a') },
  'fill-start-end': { id: 9, paths: [{ points: rect(0, 0, 300, 200), closed: true }], fill: fill('#f28c28'), params: { fillUnderlay: false, fillStart: [30, 20], fillEnd: [0, 0] } },
  'contour-fill': { id: 10, paths: [{ points: star(200, 200, 190, 80), closed: true }], fill: fill('#b5532a'), params: { type: 'contour', rowSpacing: 0.5 } },
  'satin-stroke': { id: 11, paths: [{ points: sCurve(0, 0, 400, 400), closed: false }], stroke: { color: '#14214d', width: 40 } },
  'satin-stroke-wide-underlays': { id: 12, paths: [{ points: sCurve(0, 0, 400, 400), closed: false }], stroke: { color: '#7a1428', width: 60 }, params: { satinContour: true, satinZigzag: true } },
  'satin-shape-ellipse': { id: 13, paths: [{ points: ellipse(250, 100, 240, 70), closed: true }], fill: fill('#f2705c'), params: { type: 'satin' } },
  'satin-two-rail': { id: 14, paths: [{ points: [[0, 0], [150, 40], [300, 0], [450, 60]], closed: false }, { points: [[0, 90], [150, 130], [300, 100], [450, 170]], closed: false }], stroke: { color: '#2cc4c4', width: 10 }, params: { type: 'satin' } },
  'satin-tight-curve-short-stitch': { id: 15, paths: [{ points: circle(150, 150, 70, 80).concat([circle(150, 150, 70, 80)[0]]), closed: false }], stroke: { color: '#6b7a2a', width: 70 } },
  'manual': { id: 16, paths: [{ points: [[0, 0], [60, 40], [20, 90], [120, 120], [80, 200]], nodes: [[0, 0], [60, 40], [20, 90], [120, 120], [80, 200]], closed: false }], stroke: { color: '#d81e1e', width: 8 }, params: { type: 'manual' } },
  'auto-fill-plus-outline': { id: 17, paths: [{ points: star(200, 200, 190, 80), closed: true }], fill: fill('#f7e017'), stroke: { color: '#14214d', width: 30 } },
};
for (const [name, shape] of Object.entries(cases)) {
  const blocks = stitchShape(shape);
  const { pattern, stats } = buildPattern(blocks);
  const { png } = renderPattern(pattern, { pxPerMm: name.startsWith('fill-') || name.startsWith('contour') || name.startsWith('satin') ? 10 : 8 });
  writeFileSync(out + name + '.png', png);
  console.log(name.padEnd(34), `${stats.stitches} stitches, ${stats.jumps} jumps, ${stats.trims} trims, ${stats.widthMm.toFixed(1)}x${stats.heightMm.toFixed(1)} mm`);
}
