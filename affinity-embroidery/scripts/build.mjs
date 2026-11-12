// Bundles each entry into a single CommonJS file for Affinity.
// JSLib/SDK modules ('/document.js', 'affinity:*') stay external - Affinity provides them at runtime.
import { build } from 'esbuild';
import { readdirSync, mkdirSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const entries = readdirSync(root + 'src/affinity/entries').filter((f) => f.endsWith('.cjs'));
mkdirSync(root + 'dist', { recursive: true });
for (const f of entries) {
  const name = f.replace(/\.cjs$/, '');
  await build({
    entryPoints: [root + 'src/affinity/entries/' + f],
    outfile: root + `dist/embroidery-${name}.js`,
    bundle: true, platform: 'neutral', format: 'cjs', target: 'es2022', mainFields: ['main'],
    external: ['affinity:*'],
    plugins: [{ name: 'jslib-external', setup(b) { b.onResolve({ filter: /^\/[A-Za-z0-9_-]+\.js$/ }, (a) => ({ path: a.path, external: true })); } }],
    legalComments: 'inline',
    logLevel: 'warning',
  });
  console.log('built dist/embroidery-' + name + '.js');
}
