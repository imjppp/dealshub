// Deterministic patterns shared by the JS tests and the Python (pyembroidery) verifier.
import { Pattern, makeThread, CMD } from '../src/core/pattern.js';

const T = (hex, name) => makeThread(parseInt(hex.slice(1), 16), name, 'Test', '');

/** Small deltas only: byte-for-byte comparable with pyembroidery output. */
export function plainPattern() {
  const p = new Pattern();
  p.meta.name = 'plain';
  p.addThread(T('#ff0000', 'Red')).addThread(T('#0000ff', 'Blue')).addThread(T('#00aa00', 'Green'));
  p.jump(0, 0);
  // red square 30x30 (3mm)
  [[0, 0], [30, 0], [30, 30], [0, 30], [0, 0], [15, 15]].forEach(([x, y]) => p.stitch(x, y));
  p.trim(); p.colorChange();
  p.jump(40, 0);
  [[40, 0], [60, 20], [80, 0], [60, -20], [40, 0], [-10, -20]].forEach(([x, y]) => p.stitch(x, y));
  p.colorChange();
  p.jump(0, 42);
  for (let i = 0; i < 20; i++) p.stitch(i * 5, 50 + ((i % 2) ? 8 : -8));
  p.end();
  return p;
}

/** Long jumps, negative + fractional coordinates (no .5 ties), trims, colour changes. Stitches stay short. */
export function stressPattern() {
  const p = new Pattern();
  p.meta.name = 'stress';
  p.addThread(T('#ffcc00', 'Gold')).addThread(T('#112233', 'Navy'));
  p.jump(-500.4, 300.6);
  p.stitch(-500.4, 300.6);
  p.stitch(-460.2, 302.7);
  p.stitch(-430.3, 280.3);
  p.trim();
  p.jump(900.2, 900.3);        // very long jump -> split
  p.stitch(900.2, 900.3);
  p.stitch(901.4, 903.6);
  p.stitch(930.2, 930.2);
  p.colorChange();
  p.jump(-300, 100);
  p.stitch(-300, 100); p.stitch(-250, 140); p.stitch(-200, 100);
  p.end();
  return p;
}

export const ALL = { plain: plainPattern, stress: stressPattern };
export { CMD };
