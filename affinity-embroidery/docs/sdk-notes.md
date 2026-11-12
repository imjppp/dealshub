# Affinity SDK notes (3.3.3)

Sources: `https://sdk.affinity.studio/3.3.3/affinity.d.ts` (9,109 lines, read), the JSLib wrapper
(`JSLib.zip`, read for patterns), and JSLib's bundled examples. **Nothing here was run in Affinity** - it is what the
declarations say. Each item maps to a spike in `spikes/` that will confirm or refute it.

The declarations are *generated* and lag the runtime in one known way: enums are declared as plain TypeScript enums, but
JSLib treats enum members as objects with `.value` (`FillType.Solid.value`). `sdk.cjs` accepts both (`ev()`).

## Script shape (confirmed by Affinity's help, https://www.affinity.studio/help/scripting-in-affinity/ and /running-scripts/, /trusting-scripts/)
* Scripting is **off by default** (Settings > Scripting > Enable Affinity Scripting). Scripts live in the **Script Editor** /
  **Scripts Library** panels (no install folder). Run: Library click, or editor Run (F5 / Ctrl+Return / Cmd+Return).
* Structure: `require(...)` modules, a `main()` function, **and a direct `main();` call**. CommonJS by default
  (an ES-module mode exists per script: "Run as module"). JSLib's bundled example files export `main` instead; the
  plugin's bundles do both behind a run-once guard.
* Permissions are per script: *Access the file system* (only inside folders listed under Settings > Scripting > File System
  access), *Access networks*, *Canva AI*. New scripts inherit the defaults; imported ones keep the author's. JSLib modules
  (`/document.js` ...) can always be required. Pasted/new scripts are trusted; imported ones are not.
* Output: `console.log` and errors go to the **Log Console** panel. Sharing: `.afscript` / `.afscripts` export.
* "Scripting is not a plugin system": no new tools, no UI changes, no background work, no input interception - it runs when
  launched and finishes. Dialogs may offer a live-preview pattern (see the Crop Marks example).
* API reference: `affin.co/affinity-sdk` (= sdk.affinity.studio). Note British spellings (`colour`, `centre`).
* There is also an MCP server / AI-assistant route ("AI Automation with Claude"); not used here.

## Phase 0 items

### 1. Selection, shapes, curves, transforms  (spike 01)
* `Document.current` → `doc.selection.nodes` (JSLib) / `DocumentApi.getCurrentSelection` + `SelectionApi.getItem/getNode`.
* Vector nodes: `node.isVectorNode`; curves via `node.curvesInterface.polyCurve.curves` (`CurvesInterfaceApi.getCurves`
  → `PolyCurveApi.getCurve/getCurveCount`). `getPolyPolyCurves()` and `getCorneredCurves()` also exist.
* Per curve (`CurveApi`): `isClosed`, `getNodeCount/getNode` (`CurveNode{position,type,style}`), `getCubicBezier(i)`
  (`CubicBezier{start,c1,c2,end}`), `getPath()`, and **`generatePolygon(tolerance)`** → `PolygonApi.enumeratePoints` -
  Affinity's own tessellator, used first by the plugin.
* Transform: `NodeApi.getLocalToSpreadTransform`, `TransformApi.applyToPoint`. `CurvesInterfaceApi.getDomainTransform`
  also exists - **open question** whether curve points are already in spread space (spike 01 compares with the
  spread box).
* Units: coordinates are document pixels; JSLib examples convert with `doc.dpi` (`points = px * 72 / dpi`), so
  `mm = px * 25.4 / dpi` (assumed; spike 02 checks stroke weight).

### 2. Fill colour, stroke colour/width  (spike 02)
* `node.hasBrushFill`, `node.brushFillDescriptor.fill` (`SolidFill.colour.rgba8 → {r,g,b,alpha}`); gradients/bitmap
  fills have other `FillType`s - treated as "no colour" (skipped for fill).
* Stroke: `node.hasPenFill`, `node.isLineStyleVisible`, `node.penFillDescriptor`, `node.lineWeight` (pixels),
  `node.lineWeightPts`. Dashes, caps, joins are readable but ignored.

### 3. Write a binary file  (spike 03)
* `FileApi.write(file, buffer, length)` accepts `ArrayBuffer | typed array | BufferHandle`; JSLib `File.create(path,'wb')`.
  The plugin passes an exact-size `ArrayBuffer` copy to sidestep `byteOffset` ambiguity (the spike also tests a view).
* **No save dialog exists.** `UiApi.chooseFile()` is open-style (no arguments, returns an existing path); there is
  `prompt()`. Workaround: the export dialog has a **path text box** pre-filled with `<document folder>/<title>.<ext>`.
* `FileSystemApi.createDirectories/exists/getFileSize` exist. `EnvironmentApi.hasPermission(FileSystem)` may gate writes.

### 4. Dialogs  (spike 04)
* `Dialog.create(title)` → `addColumn().addGroup(label)` → `addTextBox / addComboBox / addCheckBox / addButtonSet /
  addRadioGroup / addSwitch / addColourPicker / addUnitValueEditor / addStaticText / addButton ...` → `runModal()` →
  read `.text / .selectedIndex / .value`. `onValueChangedHandler` enables/disables dependants.
* `UnitValueEditor(label, units, displayUnits, min, max, initial)`; the plugin uses `UnitType.Millimetre`, `Degree`,
  `Number`. Assumption: `.value` comes back in `units` (spike 04 checks).
* Dialogs are modal and synchronous - no live preview inside them.

### 5. Per-object custom data  (spike 05) - **not possible as asked**
* `TagInterfaceApi` is read-only (`getValueForKey`, `hasKey`); `DescriptionInterfaceApi` is read-only;
  `NodeDefinitionApi.setUserDescription` exists but only for definitions of nodes not yet created. No
  set-name/set-tag/set-data command appears among the `DocumentCommandApi.create*` commands.
* Fallbacks considered: (a) encode in layer names - impossible (can't rename existing nodes); (b) **sidecar JSON next to
  the document - chosen** (`src/affinity/storage.js`), keyed by node id with a geometry-signature fallback. Spike 05
  tests whether node ids survive save/close/reopen.

### 6. Preview geometry on a temporary layer  (spike 06)
* `AddChildNodesCommandBuilder` + `ContainerNodeDefinition.create(name)` + `PolyCurveNodeDefinition.create(poly, brush,
  pen, lineStyle, transparency)`, executed as a `CompoundCommandBuilder` command (pattern from JSLib's `cropMarks.js`).
  A polyline is built with `CurveApi.setPath(curve, Point[])`.
* Removal: find the container by `userDescription` and run `DocumentCommand.createDeleteSelection(...)`.
* Executed commands land on the undo stack - "Clear preview" or Undo both work.

## Not available / not used
* No SDK-level file/save dialog, no custom data on existing nodes, no way to register a menu item from the SDK material
  (so the plugin ships several single-purpose scripts + one menu script).
* `affinity:network` is not used (the plugin makes no network calls).

## Findings from running the spikes in Affinity 3.3.3.5004 (macOS)
* `node.nodeId` is a **BigInt** - never `JSON.stringify` it raw; the plugin stringifies it (`sdk.cjs`).
* Spike 3: file write works (exact bytes, also from a typed-array view); `UiApi.chooseFile()` and `UiApi.prompt()` work; no save dialog.
* Spike 4: dialogs and all controls used by the plugin work; values read back as set.
* Spike 6: adding a preview layer (polyline via `CurveApi.setPath` with plain `{x, y}`) and removing it by selection both work.
* Log Console shows the MCP bridge's view: permissions `{fileSystem:true, network:false, genAI:false}`, roots `["/Users/jp/Desktop"]` - scripts can only touch the folders listed there.
* Test document reported `dpi = 300` and `units = 8`.
