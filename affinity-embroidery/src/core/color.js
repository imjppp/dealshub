// Colour distance and palette matching.
export const r = (c) => (c >> 16) & 0xff;
export const g = (c) => (c >> 8) & 0xff;
export const b = (c) => c & 0xff;

/** "Redmean" distance (compuphase.com/cmetric.htm); integer maths so results
 *  match other tools that use the same formula. */
export function distance(c1, c2) {
  const r1 = r(c1), g1 = g(c1), b1 = b(c1), r2 = r(c2), g2 = g(c2), b2 = b(c2);
  const rm = Math.round((r1 + r2) / 2);
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return (((512 + rm) * dr * dr) >> 8) + 4 * dg * dg + (((767 - rm) * db * db) >> 8);
}

/** Index of nearest entry (null entries skipped). Ties pick the later entry. */
export function nearestIndex(color, palette) {
  let best = null, bd = Infinity;
  for (let i = 0; i < palette.length; i++) {
    if (!palette[i]) continue;
    const d = distance(color, palette[i].color);
    if (d <= bd) { bd = d; best = i; }
  }
  return best;
}
