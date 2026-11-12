// Bundles each entry into a single CommonJS file for Affinity.
// JSLib/SDK modules ('/document.js', 'affinity:*') stay external - Affinity provides them at runtime.
import { build } from 'esbuild';
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const entries = readdirSync(root + 'src/affinity/entries').filter((f) => f.endsWith('.cjs'));
mkdirSync(root + 'dist', { recursive: true });
const TITLES = {
  menu: ['Embroidery (menu)', 'Embroidery tools in one script: edit stitch params, export machine embroidery files, preview stitches, thread list.'],
  params: ['Embroidery: Params', 'Edit embroidery stitch settings (type, density, underlay, satin options) for the selected shapes.'],
  export: ['Embroidery: Export', 'Convert vector shapes to machine embroidery (DST, EXP, JEF, PEC, PES, VP3, XXX, U01) with stats and hoop check.'],
  preview: ['Embroidery: Preview stitches', 'Draw the planned stitches as thin coloured lines on a temporary layer.'],
  'clear-preview': ['Embroidery: Clear preview', 'Remove the embroidery preview layer.'],
  'thread-list': ['Embroidery: Thread list', 'Write a plain-text thread list and stitch summary for the design.'],
};
const version = JSON.parse(readFileSync(root + 'package.json', 'utf8')).version;
for (const f of entries) {
  const name = f.replace(/\.cjs$/, '');
  const [title, desc] = TITLES[name];
  // Script Manager-style metadata header (must be the first thing in the file)
  const banner = `/**\n * name: ${title}\n * description: ${desc}\n * version: ${version}\n * author: affinity-embroidery\n */`;
  await build({
    entryPoints: [root + 'src/affinity/entries/' + f],
    outfile: root + `dist/embroidery-${name}.js`,
    bundle: true, platform: 'neutral', format: 'cjs', target: 'es2022', mainFields: ['main'],
    external: ['affinity:*'],
    plugins: [{ name: 'jslib-external', setup(b) { b.onResolve({ filter: /^\/[A-Za-z0-9_-]+\.js$/ }, (a) => ({ path: a.path, external: true })); } }],
    legalComments: 'inline',
    banner: { js: banner },
    logLevel: 'warning',
  });
  console.log('built dist/embroidery-' + name + '.js');
}
