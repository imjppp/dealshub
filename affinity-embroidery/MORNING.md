# MORNING.md

Overnight build of an Affinity Studio embroidery plugin (SDK 3.3.3, pure JavaScript). Branch
`claude/affinity-embroidery-plugin-1qyble`, folder `affinity-embroidery/`. No PR was opened.

**One-line status:** the stitch engine, planner and nine file writers are built, unit-tested and cross-checked against
pyembroidery; the Affinity integration is written but has never run (Affinity's help is now read, so the run/permission model is known) (no Affinity here), so expect a round of small fixes in
one file, `src/affinity/sdk.cjs`.

First, a correction to the brief's premise: I **could** read `affinity.d.ts` after all. `sdk.affinity.studio` was blocked
by the sandbox's network allowlist; you approved adding it to your Default cloud environment, which is why the plugin is
written against the real declarations and JSLib (also downloaded from the SDK site) rather than guesses. That allowlist
entry stays on your Default environment until you remove it. (Later, to read Affinity's scripting help, you also approved
`www.affinity.studio`, `static.canva.com` and `content-management-files.canva.com` - same note applies.)

## 1. Done and tested (in Node)
| Area | Evidence |
|---|---|
| Pattern model, encoder (rounding without drift, long-stitch/jump splitting, STOP→colour change) | `tests/core.test.js` |
| Geometry: Bézier flattening, point-in-polygon, scanlines, arc-length sampling; Clipper booleans + offset | `tests/core.test.js` |
| **9 writers**: DST, EXP, JEF, PEC, PES v1, PES v6, VP3, XXX, U01 | round-trip via pyembroidery: **18/18 parsed results equal, 15/18 byte-identical** (`npm run verify`, needs `pip install pyembroidery`). The other 3 differ by deliberate rounding choices (README). Plus an independent DST decoder and a VP3 block-tree/length-prefix walker in `tests/formats.test.js`. |
| **VP3** nested big-endian blocks, per-colour-block RGB/catalogue/name/brand | structure walker + pyembroidery read-back; **not** checked in real Husqvarna/Pfaff software |
| Stitch types: running (+repeats, bean), fill (angle, spacing, max length, stagger, underlay, islands/holes, start/end), contour fill, satin (stroke, two-rail, closed shape; centre-walk/contour/zig-zag underlays; pull comp; short stitches), manual | `tests/stitch.test.js` + 17 PNGs in `test-output/` (I looked at the montage: fills, holes, islands, satin curves all look right) |
| Planner: colour grouping, NN ordering, auto trims, tie-in/off, palette snap, thread report | `tests/stitch.test.js` |
| Adapter logic (px→mm, params/export/preview/thread-list/menu workflows, sidecar storage) with a **fake SDK** | `tests/adapter.test.js` |
| Raw SDK calls in `sdk.cjs` and the spikes type-check against the real `affinity.d.ts` | `npm run typecheck` is clean (this caught one real enum bug) |
| Bundles build; JSLib/SDK requires stay external | `npm run build` → `dist/` |
| Examples: 2 designs × every format (+PNG, thread list) | `examples/` |

`npm test` → 36 pass (run with `PYLIB=<dir containing pyembroidery>` to include the cross-check, otherwise it skips).

## 2. Untested (everything touching Affinity)
`src/affinity/sdk.cjs` is the *only* file that calls the SDK; the rest of the plugin never saw a real handle. Specific
assumptions, each covered by a spike:
* Curve points: is `localToSpreadTransform` the right transform, and does `generatePolygon`/`enumeratePoints` work as I call it (callback returns `0` = continue)? Do closed curves' `beziers` include the closing segment? *(spike 1)*
* Units: `mm = px × 25.4 / dpi`; stroke `lineWeight` in px; `UnitValueEditor` returns the unit I asked for. *(spikes 2, 4)*
* File write of an exact-size `ArrayBuffer`; `UiApi.prompt`/`chooseFile` behaviour. *(spike 3)*
* Dialog builder calls, enable/disable handlers, colour picker. *(spike 4)*
* Whether node ids survive save/reopen (sidecar keying). *(spike 5)*
* Preview layer: `CurveApi.setPath` with plain `{x,y}` objects, container `userDescription`, delete-by-selection. *(spike 6)*
* Performance on big documents (not measured), TextEncoder-free code paths (I avoided TextEncoder/Decoder on purpose).
* **How scripts run - now known from Affinity's help** (README "Install"): paste into the Script Editor, enable scripting + file-system access + add folders in Settings > Scripting, save to the Scripts Library, run from there. Changed because of it: bundles now call `main()` themselves (the help says to) behind a run-once guard, and file errors tell you to allow the folder. Still unverified: pasting a ~320 KB script into the editor, and whether `export` + direct `main()` ever double-runs (you'd see two dialogs - tell me).

## 3. Exact steps for the morning
0. **Enable scripting** (off by default): Edit > Settings (Windows) / Affinity > Settings (Mac) > **Scripting** > *Enable Affinity Scripting*; *Default Permissions* > tick **Access the file system**; *File System access* > **Add** your Desktop and the folder you'll export into. (Scripts cannot touch files outside listed folders - the #1 thing that will bite.)
1. `cd affinity-embroidery && npm install && npm test && npm run build` (optionally `npm run fetch-types && npm run typecheck`).
2. **Spikes** - `spikes/README.md` has the exact table. Script Editor > New Script > paste `spikes/01-shapes.js` > Run (F5 / Ctrl+Return). Do 01-06 in order with a few shapes on the page (filled+stroked rectangle, wavy open curve, a group, an ellipse, a gradient shape). Each shows an alert and writes `Desktop/embroidery-spike-N.txt`; `console.log` also goes to Window > Scripting > Log Console. Keep the output; every `FAIL` line is a one-line fix in `sdk.cjs`. Spike 5 needs two runs (save, close, reopen, select same shape, run again).
3. Paste `dist/embroidery-menu.js` into a new script, make sure its Settings have *Access the file system* ticked, **Save As** into the Scripts Library, and run it. Draw a **filled rectangle with a 3 mm stroke**, select it, then:
   * *Preview stitches* (fill + satin border as thin lines on an "Embroidery preview" layer) > *Clear preview*.
   * *Params*: Stitch type = *Fill*, angle 45; preview again.
   * *Export embroidery file*: DST, hoop 100x100, edit the output path (must be inside an allowed folder); confirm the stats dialog.
4. Check the exported file in any viewer. Without installing anything else: `pip install pyembroidery pillow`, then
   `python3 -c "import pyembroidery as p; p.write_png(p.read('out.dst'), 'out.png')"`.
5. Repeat the export as PES / VP3 and open in your machine vendor's software (VP3 is the risky one).

## 4. Known gaps and limitations
* **Fill routing is simpler than Ink/Stitch's**: serpentine chains per region, short travel stitches *inside* the shape, jumps (with trims over 3 mm) otherwise. No Euler-path optimiser and no hidden under-path travel along the outline, so complex shapes jump more than Ink/Stitch would.
* Satin: no rungs; two-rail columns only from exactly two open paths; closed-shape satin splits along the principal axis (fine for leaves/ellipses/letter strokes, wrong for rings or sharply bent shapes). Strokes use miter-limited normals - very sharp corners look rough.
* Not implemented: guided fill, meander/ripple, lettering/text (text nodes are skipped - convert to curves first), appliqué, cloning, cross-stitch, gradient/bitmap fills (skipped), dashed strokes, non-uniform stroke scaling, clipping/masks, embedded images, hoop positioning/multi-hoop.
* Start/end points are numeric parameters (mm, document space), not picked on canvas.
* Per-object settings live in a sidecar JSON, not in the document (SDK limitation); they follow node id, falling back to a geometry signature. Moving a shape and renaming/re-saving the file under another name loses them.
* Thread palettes are **placeholders** (approximate colours, no catalogue numbers) - deliberately, rather than inventing vendor data.
* PEC/PES: one palette slot per distinct colour (nearest unused Brother colour); PES v6 stores true RGB.
* The format writers were derived from pyembroidery's source (MIT, credited in `NOTICE.md`), not from format documentation alone - say if you want that handled differently. pyembroidery's own writers are the only oracle I had: agreement proves consistency with them, **not** acceptance by every machine/vendor tool.
* Jump/trim policy is conservative: stitch gaps ≤ 0.6 mm are sewn across; > 3 mm are trimmed; PEC marks every jump after the first as trim+jump (as pyembroidery does).

## 5. Next tasks (priority order)
1. Run the spikes; fix `sdk.cjs` from the FAIL lines (expect: transform/space, enum `.value`, preview creation).
2. End-to-end in Affinity: preview → export DST/PES; open in a viewer; sew a test patch (small square fill + satin border + a text-free logo) on a real machine and tune density/pull-comp defaults.
3. Check VP3 and PES v6 in Husqvarna/Pfaff and Brother software; fix any header nit (thread-metadata block and design extents are the likeliest).
4. Replace placeholder palettes with official charts via `scripts/import-palette.mjs`.
5. Fill: Euler-path routing / under-path travel; better underlay (edge-walk); auto-split for very long rows.
6. Satin: rungs, auto "ring" handling, per-end caps, corner insertion.
7. Text → curves workflow; gradient fill → average colour option; multi-object start/end pickers (e.g. named marker objects).
8. Guided fill, meander/ripple, lettering.
9. Performance profile on large documents (the NN chain/block ordering is O(n²)).
10. Distribution: export the working scripts from the Scripts Library as `.afscript`/`.afscripts` and add them to the repo; consider minified bundles and a live-preview export dialog (Affinity's Crop Marks example shows the pattern).
