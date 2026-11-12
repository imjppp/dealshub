// Bundles each entry into a single CommonJS file for Affinity.
// JSLib/SDK modules ('/document.js', 'affinity:*') stay external - Affinity provides them at runtime.
import { build } from 'esbuild';
import { readdirSync, mkdirSync, readFileSync } from 'node:fs';

const root = new URL('../', import.meta.url).pathname;
const entries = readdirSync(root + 'src/affinity/entries').filter((f) => f.endsWith('.cjs'));
mkdirSync(root + 'dist', { recursive: true });
const TITLES = { embroidery: ['Embroidery', 'Turn shapes into machine embroidery files: make a file, preview stitches, change stitch settings, thread list.'] };
const version = JSON.parse(readFileSync(root + 'package.json', 'utf8')).version;
for (const f of entries) {
  const name = f.replace(/\.cjs$/, '');
  const [title, desc] = TITLES[name];
  // Script Manager-style metadata header (must be the first thing in the file)
  const banner = `/**\n * name: ${title}\n * description: ${desc}\n * version: ${version}\n * author: affinity-embroidery\n */`;
  await build({
    entryPoints: [root + 'src/affinity/entries/' + f],
    outfile: root + `dist/${name}.js`,
    bundle: true, platform: 'neutral', format: 'cjs', target: 'es2022', mainFields: ['main'],
    external: ['affinity:*'],
    plugins: [{ name: 'jslib-external', setup(b) { b.onResolve({ filter: /^\/[A-Za-z0-9_-]+\.js$/ }, (a) => ({ path: a.path, external: true })); } }],
    legalComments: 'inline',
    banner: { js: banner },
    logLevel: 'warning',
  });
  console.log('built dist/' + name + '.js');
}
