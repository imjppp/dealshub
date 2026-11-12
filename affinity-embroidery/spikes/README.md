> **Superseded:** the main script (`dist/embroidery.js`) has a "Send a diagnostic report" menu choice that covers spikes 1 and 2 and the environment checks; spikes 3, 4 and 6 already passed. These files remain for reference only. See `START-HERE.md`.

# Spike scripts - run these first

Six small, **self-contained** scripts. Each tests one SDK assumption the plugin makes, prints what it found, shows the
result in an alert and also writes `<Desktop>/embroidery-spike-N.txt`. They only use APIs that appear in
`affinity.d.ts` / JSLib, wrapped in `attempt()` so one failure never hides the others.

## One-time setup (from Affinity's "Running scripts" help)
1. **Settings** (Edit > Settings on Windows, Affinity > Settings on Mac) > **Scripting** > tick **Enable Affinity Scripting** (it is off by default).
2. Under **Default Permissions** tick **Access the file system**; under **File System access** click **Add** and add your **Desktop** (the spikes write their logs there) and the folder you will export designs to. Scripts cannot touch files outside these folders.
3. Window > Scripting > **Log Console** shows `console.log` output and errors (handy if an alert is cut off).

## Running a spike
Script Editor panel > **New Script** > paste the whole spike > make sure the script's **Settings** (cog) has *Access the file system* ticked > **Run** (F5 or Ctrl+Return on Windows, Cmd+Return on Mac). New scripts are trusted by default. Each spike calls `main()` itself, as Affinity's help prescribes.

Open a document that has **a few shapes** first (a filled rectangle with a stroke, a wavy open curve, a group, a gradient-filled shape, an ellipse), and run in this order:

| # | File | Select first | What to look for |
|---|------|--------------|------------------|
| 1 | `01-shapes.js` | 2-3 shapes (or nothing -> whole page) | Do `nodes (local -> spread)` match `spread visible box`? Does `generatePolygon` return points? Is `bezier count` sane for closed curves (is the closing segment missing)? |
| 2 | `02-colours.js` | filled+stroked shapes | `brush solid colour` hex correct? `lineWeight in mm` equals what the Stroke panel says? Gradient shows a non-solid type? |
| 3 | `03-file.js` | - | `wrote 256`, `identical=true`; the subarray-view write must say `256`. Delete the Desktop test files afterwards. |
| 4 | `04-dialog.js` | - | Values read back; `mm.value` equals the typed millimetres; the dependent text box greys out when the check box is cleared. |
| 5 | `05-data.js` | **one** shape | Which set*/tag/data members exist. Run, **save, close, reopen**, select the same shape, run again: it says whether node ids are stable. |
| 6 | `06-preview.js` | - | Two zig-zag lines appear in a layer called "Embroidery preview", then are removed on OK. |

Keep the `.txt` outputs (or Log Console export): every FAIL line is a one-line fix in `src/affinity/sdk.cjs` (the only file that touches
the SDK). Findings predicted from the type declarations are in `docs/sdk-notes.md`.

Type-checking: `npm run fetch-types && npm run typecheck` checks the spikes and `sdk.cjs` against the real
`affinity.d.ts` (already clean).
