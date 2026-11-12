# affinity-embroidery

Turn vector artwork in **Affinity Studio** into machine embroidery files - roughly what
[Ink/Stitch](https://inkstitch.org/) does for Inkscape. Pure JavaScript, no Python, no external processes at runtime,
targeting Affinity SDK 3.3.3.

> **Status: engine tested, Affinity integration UNTESTED.** The stitch engine, planner and nine file writers run and are
> unit-tested in Node and cross-checked against pyembroidery. Everything that touches Affinity (`src/affinity/sdk.cjs`)
> was written from `affinity.d.ts` + JSLib without Affinity available. Start with `MORNING.md` and `spikes/`.

## What it does
1. Reads the selected (or all) vector shapes: outline, fill colour, stroke colour and width.
2. Picks a stitch type per object (defaults below; override per object in the **Params** dialog).
3. Plans the sew order (colour grouping, nearest-neighbour travel, trims, tie-in/off) - optional thread-palette snap.
4. Writes DST, EXP, JEF, PEC, PES (v1 and v6), VP3, XXX or U01, plus a plain-text thread list.
5. Optionally draws the stitch plan as thin coloured lines on a temporary layer for checking.

### Defaults ("auto")
| Object | Result |
|---|---|
| closed shape with a fill | fill stitch (tatami, with underlay) |
| stroke thinner than 1.5 mm | running stitch (2.5 mm) |
| stroke 1.5 mm or wider | satin column (centre-walk underlay) |
| shape with fill **and** stroke | fill first, then the stroke on top |
| two open paths + type *satin* | two-rail satin column |
| closed shape + type *satin* | satin across the shape's long axis |

## Install / build
```
cd affinity-embroidery
npm install            # dev tooling only (esbuild, typescript); the plugin has no runtime dependencies
npm test               # 36 tests (the pyembroidery cross-check is skipped unless Python + pyembroidery exist)
npm run build          # -> dist/embroidery-*.js  (single-file CommonJS bundles; JSLib/SDK requires stay external)
```
**This is a script, not a plugin** (Affinity's own help: scripting "is not a full plugin system" - no new tools or UI, no
background work; a script runs when launched, then finishes). So there is no install folder; per the "Running scripts"
help topic:
1. **Settings > Scripting**: tick *Enable Affinity Scripting*; under *Default Permissions* tick *Access the file system*;
   under *File System access* **Add** every folder you will export to (scripts cannot read/write outside them - this also
   covers the `.embroidery.json` settings file next to your document).
2. Script Editor panel > **New Script** > paste the contents of `dist/embroidery-menu.js` > check the script's own *Settings*
   has *Access the file system* ticked > **Save As** (title + category) so it appears in the **Scripts Library** panel.
   Run it by clicking it there. Repeat for any of the single-purpose scripts below.
3. Errors and `console.log` output appear in Window > Scripting > **Log Console**.

(Bundles are ~320 KB each because the engine, writers and Clipper are inlined; `npm run build` produces them unminified.
`.afscript` export from Affinity is the sharing format; I could not generate one offline.)

| Script | Does |
|---|---|
| `embroidery-menu.js` | one script with an action chooser (easiest to start with) |
| `embroidery-params.js` | stitch settings for the selected objects |
| `embroidery-export.js` | format, hoop, path, palette, plan options -> stats confirmation -> file |
| `embroidery-preview.js` / `embroidery-clear-preview.js` | draw / remove the stitch simulation layer |
| `embroidery-thread-list.js` | plain-text thread list and summary |

**Optional: a third-party installer.** [Script Manager for Affinity](https://github.com/JiriKrblich/Affinity-script-manager)
(by Jiri Krblich; not affiliated with Affinity or this project; I have only read its README, not its code) keeps a local
library of `.js` scripts and pushes them into Affinity's Scripts panel through Affinity's MCP bridge, with a console and
preview "run without install". Our bundles and spikes start with the `/** name: / description: / version: / author: */`
header it reads. Its README notes the Scripts panel needs at least one category before installs work, and the macOS build
is unsigned/un-notarised - inspect it yourself before trusting it. Pasting into the Script Editor (above) needs none of this.
A shared "community repository" for it would need a `registry.json` at the root of a public repo, which this subfolder is not.

## Features vs Ink/Stitch
| Feature | Ink/Stitch | affinity-embroidery |
|---|---|---|
| Running stitch (length, repeats) | yes | **yes** (corners always stitched) |
| Bean / triple stitch | yes | **yes** (+ extra repeats) |
| Manual stitch | yes | **yes** (nodes = needle points) |
| Fill / tatami: angle, spacing, max length, stagger | yes | **yes** |
| Fill underlay | yes | **yes** (angle, spacing, inset) |
| Fill start/end points | yes | **yes** (picks row orientation; no pick-in-canvas, numeric only) |
| Routing through islands/holes | Eulerian auto-fill | **partial**: serpentine chains, hole/concavity aware, travel stitches inside the shape for short gaps, jumps otherwise |
| Satin column from stroke | yes | **yes** |
| Satin from two rails | yes (+ rungs) | **yes, no rungs** |
| Satin underlays | centre-walk, contour, zig-zag | **all three** |
| Pull compensation | yes | **yes** (satin and fill expand) |
| Short stitches on tight curves | yes | **yes** |
| Contour fill | yes | **yes** (basic concentric) |
| Guided fill, meander, ripple | yes | **no** |
| Lettering, appliqué, clones, cross-stitch, sequins | yes | **no** |
| Per-object params | stored in the SVG | **sidecar JSON** (the SDK cannot attach data to existing nodes) |
| Stitch simulator | yes | thin-line preview layer (no animation) |
| Output formats | many | DST EXP JEF PEC PES v1/v6 VP3 XXX U01 |
| Thread palettes | many | Madeira/Isacord/Robison-Anton **placeholder** JSON (see below) |

## Formats
All writers share one encoder (`src/core/encoder.js`): positions are rounded in absolute terms (no drift), long
stitches/jumps are split to each format's limit, STOP becomes a same-thread colour change where the format needs it.
Coordinates are 0.1 mm; the design is centred on the hoop origin.

`npm run verify` (needs `pip install pyembroidery`, or `PYLIB=<dir>`) builds identical patterns in pyembroidery and
compares: **18 of 18 parsed results equal, 15 of 18 byte-identical**. The three non-identical cases are documented,
deliberate differences (the JS writers *round* coordinates where pyembroidery's VP3/XXX writers *truncate*, and U01
splits very long jumps with different intermediate rounding). Differences between file *bytes* and what a real machine
or vendor software accepts could not be tested here - **VP3 in particular needs a real Husqvarna/Pfaff check**.

## Thread palettes
`src/data/palette-{madeira,isacord,robison-anton}.json` are **placeholders**: 32 common colour *families* with
approximate sRGB values and **no catalogue numbers**, flagged `"approximate": true`. I did not have access to official
charts and will not invent catalogue numbers. Matching (redmean distance) is implemented and tested; to use real data:
`node scripts/import-palette.mjs "Madeira" chart.csv > src/data/palette-madeira.json` with a CSV of
`catalog,name,#hex`.

## Per-object settings
Stored in `<document>.embroidery.json` next to the document (`<Desktop>/untitled.embroidery.json` for unsaved ones),
keyed by node id with a geometry signature as fallback. Whether node ids survive save/reopen is what spike 05 tests.

## Layout
```
src/core/      pattern model, byte writer, encoder, geometry, Clipper wrapper      (no Affinity dependency)
src/formats/   dst exp jef pec pes vp3 xxx u01 + registry
src/stitch/    running, fill, satin, manual, dispatcher (params.js = every setting + default)
src/plan/      sew-order optimiser, trims/ties, palettes, thread report
src/render/    PNG preview (Node only; used for test-output/ and examples/)
src/affinity/  sdk.cjs (ONLY SDK-touching file) + pure adapter/convert/storage/ui-spec + entries/
spikes/        six scripts to run in Affinity first          docs/sdk-notes.md  what the .d.ts says
examples/      two designs exported in every format (+PNG, thread list)    test-output/  per-stitch-type PNGs
tests/         node:test suites          scripts/  build, verify, previews, examples, palette import
vendor/        Clipper (Boost licence)
```
Types: JSDoc, checked with `npm run typecheck` (core) and against the real `affinity.d.ts` for `sdk.cjs` and the spikes
(`npm run fetch-types` first).

## Licence and credits
MIT (see `LICENSE`). Third-party: Clipper (Boost), pyembroidery data tables (MIT), JSLib patterns (BSD-3) - `NOTICE.md`.

**Inspiration, not a port.** [Ink/Stitch](https://github.com/inkstitch/inkstitch) (GPLv3) defined the feature set this
project aims at, and [pyembroidery](https://github.com/inkstitch/pyembroidery) (MIT) is the reference the writers were
checked against. Decision: *no GPL code was ported*; stitch algorithms were written independently (details in
`NOTICE.md`). pyembroidery's writers were used as a layout reference for the file formats (MIT, credited).
