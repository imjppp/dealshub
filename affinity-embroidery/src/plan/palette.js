// Thread palettes (JSON) and nearest-colour matching.
import { distance } from '../core/color.js';
import { hexToInt, makeThread } from '../core/pattern.js';

/** @typedef {{brand:string, approximate?:boolean, threads:{name:string,color:string,catalog:string|null}[]}} Palette */

/** Prepare a palette object parsed from JSON. */
export function loadPalette(json) {
  return {
    brand: json.brand,
    approximate: !!json.approximate,
    threads: json.threads.map((t) => ({ name: t.name, catalog: t.catalog ?? '', color: typeof t.color === 'number' ? t.color : hexToInt(t.color) })),
  };
}

/** Nearest palette thread to a colour (int 0xRRGGBB) as a Thread. */
export function nearestThread(color, palette) {
  let best = null, bd = Infinity;
  for (const t of palette.threads) { const d = distance(color, t.color); if (d < bd) { bd = d; best = t; } }
  return makeThread(best.color, best.name, palette.brand, best.catalog);
}

/** Parse "catalog,name,#hex" CSV text into a palette JSON object. */
export function paletteFromCsv(brand, csv) {
  const threads = [];
  for (const line of csv.split(/\r?\n/)) {
    const s = line.trim();
    if (!s || s.startsWith('#') || /^catalog\s*,/i.test(s)) continue;
    const m = s.match(/^([^,]*),([^,]*),\s*#?([0-9a-fA-F]{6})\s*$/);
    if (m) threads.push({ catalog: m[1].trim() || null, name: m[2].trim(), color: '#' + m[3].toLowerCase() });
  }
  return { brand, approximate: false, threads };
}
