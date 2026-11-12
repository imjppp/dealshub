// Writes every fixture in every format to a directory, plus patterns.json for the Python verifier.
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ALL } from '../tests/fixtures.js';
import { FORMATS } from '../src/formats/index.js';

const out = process.argv[2];
if (!out) { console.error('usage: dump-fixtures.mjs <outdir>'); process.exit(2); }
mkdirSync(out, { recursive: true });
const meta = {};
for (const [name, make] of Object.entries(ALL)) {
  const p = make();
  meta[name] = { name: p.meta.name, threads: p.threads, stitches: p.stitches.map((s) => [s.x, s.y, s.cmd]) };
  for (const [key, f] of Object.entries(FORMATS)) {
    const opts = key === 'jef' ? { date: '20240101000000' } : {};
    writeFileSync(join(out, `${name}-${key}.${f.ext}`), f.write(p, opts));
  }
}
writeFileSync(join(out, 'patterns.json'), JSON.stringify(meta));
console.log('wrote fixtures to', out);
