# Spike scripts - run these first

Six small, **self-contained** scripts. Each tests one SDK assumption the plugin makes, prints what it found, shows the
result in an alert and also writes `<Desktop>/embroidery-spike-N.txt`. They only use APIs that appear in
`affinity.d.ts` / JSLib, wrapped in `attempt()` so one failure never hides the others.

How to run: load the file in Affinity's scripting feature the same way as one of the SDK's JSLib examples (each file
exports `main`). *The SDK material doesn't say where scripts live; see MORNING.md.* Run them in this order, with a
document open that has **a few shapes** (a filled rectangle with a stroke, a wavy open curve, a group, a gradient-filled
shape, an ellipse):

| # | File | Select first | What to look for |
|---|------|--------------|------------------|
| 1 | `01-shapes.js` | 2-3 shapes (or nothing -> whole page) | Do `nodes (local -> spread)` match `spread visible box`? Does `generatePolygon` return points? Is `bezier count` sane for closed curves (is the closing segment missing)? |
| 2 | `02-colours.js` | filled+stroked shapes | `brush solid colour` hex correct? `lineWeight in mm` equals what the Stroke panel says? Gradient shows a non-solid type? |
| 3 | `03-file.js` | - | `wrote 256`, `identical=true`; the subarray-view write must say `256`. Delete the Desktop test files afterwards. |
| 4 | `04-dialog.js` | - | Values read back; `mm.value` equals the typed millimetres; the dependent text box greys out when the check box is cleared. |
| 5 | `05-data.js` | **one** shape | Which set*/tag/data members exist. Run, **save, close, reopen**, select the same shape, run again: it says whether node ids are stable. |
| 6 | `06-preview.js` | - | Two zig-zag lines appear in a layer called "Embroidery preview", then are removed on OK. |

Send/keep the `.txt` outputs: every FAIL line is a one-line fix in `src/affinity/sdk.cjs` (the only file that touches
the SDK). Findings predicted from the type declarations are in `docs/sdk-notes.md`.

Type-checking: `npm run fetch-types && npm run typecheck` checks the spikes and `sdk.cjs` against the real
`affinity.d.ts` (already clean).
