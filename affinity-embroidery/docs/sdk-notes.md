# Affinity SDK notes (3.3.3)

Sources: `https://sdk.affinity.studio/3.3.3/affinity.d.ts` (9,109 lines, read), the JSLib wrapper
(`JSLib.zip`, read for patterns), and JSLib's bundled examples. **Nothing here was run in Affinity** - it is what the
declarations say. Each item maps to a spike in `spikes/` that will confirm or refute it.

The declarations are *generated* and lag the runtime in one known way: enums are declared as plain TypeScript enums, but
JSLib treats enum members as objects with `.value` (`FillType.Solid.value`). `sdk.cjs` accepts both (`ev()`).

## Script shape
JSLib examples are CommonJS files that `require('/document.js')`-style JSLib modules and `require('affinity:xxx')` raw
modules, and export `module.exports.main`. Globals `alert()` is used by examples; `UiApi.alert/confirm/prompt` also exist.
Nothing in the SDK material says *where scripts are installed or how they are launched* - see MORNING.md.

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
