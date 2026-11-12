// usage: node scripts/import-palette.mjs "<Brand>" chart.csv > src/data/palette-<brand>.json
// CSV lines: catalog,name,#rrggbb  (header line and #comments are ignored)
import { readFileSync } from 'node:fs';
import { paletteFromCsv } from '../src/plan/palette.js';
const [brand, file] = process.argv.slice(2);
if (!brand || !file) { console.error('usage: import-palette.mjs "<Brand>" chart.csv'); process.exit(2); }
process.stdout.write(JSON.stringify(paletteFromCsv(brand, readFileSync(file, 'utf8')), null, 1) + '\n');
