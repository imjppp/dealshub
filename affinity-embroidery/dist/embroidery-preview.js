/**
 * name: Embroidery: Preview stitches
 * description: Draw the planned stitches as thin coloured lines on a temporary layer.
 * version: 0.1.0
 * author: affinity-embroidery
 */
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __commonJS = (cb, mod) => function __require() {
  try {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  } catch (e) {
    throw mod = 0, e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/core/bytes.js
var bytes_exports = {};
__export(bytes_exports, {
  ByteWriter: () => ByteWriter,
  utf8Decode: () => utf8Decode,
  utf8Encode: () => utf8Encode
});
function utf8Encode(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.codePointAt(i);
    if (c > 65535) i++;
    if (c < 128) out.push(c);
    else if (c < 2048) out.push(192 | c >> 6, 128 | c & 63);
    else if (c < 65536) out.push(224 | c >> 12, 128 | c >> 6 & 63, 128 | c & 63);
    else out.push(240 | c >> 18, 128 | c >> 12 & 63, 128 | c >> 6 & 63, 128 | c & 63);
  }
  return Uint8Array.from(out);
}
function utf8Decode(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; ) {
    const c = bytes[i++];
    if (c < 128) s += String.fromCharCode(c);
    else if (c < 224) s += String.fromCharCode((c & 31) << 6 | bytes[i++] & 63);
    else if (c < 240) {
      s += String.fromCharCode((c & 15) << 12 | (bytes[i] & 63) << 6 | bytes[i + 1] & 63);
      i += 2;
    } else {
      const cp = (c & 7) << 18 | (bytes[i] & 63) << 12 | (bytes[i + 1] & 63) << 6 | bytes[i + 2] & 63;
      i += 3;
      s += String.fromCodePoint(cp);
    }
  }
  return s;
}
var ByteWriter;
var init_bytes = __esm({
  "src/core/bytes.js"() {
    ByteWriter = class {
      constructor(size = 4096) {
        this.buf = new Uint8Array(size);
        this.dv = new DataView(this.buf.buffer);
        this.pos = 0;
        this.len = 0;
      }
      _ensure(n) {
        if (this.pos + n <= this.buf.length) return;
        let size = this.buf.length * 2;
        while (size < this.pos + n) size *= 2;
        const nb = new Uint8Array(size);
        nb.set(this.buf);
        this.buf = nb;
        this.dv = new DataView(nb.buffer);
      }
      _adv(n) {
        this.pos += n;
        if (this.pos > this.len) this.len = this.pos;
      }
      tell() {
        return this.pos;
      }
      seek(p) {
        this.pos = p;
      }
      u8(v) {
        this._ensure(1);
        this.buf[this.pos] = v & 255;
        this._adv(1);
        return this;
      }
      u16le(v) {
        this._ensure(2);
        this.dv.setUint16(this.pos, v & 65535, true);
        this._adv(2);
        return this;
      }
      u16be(v) {
        this._ensure(2);
        this.dv.setUint16(this.pos, v & 65535, false);
        this._adv(2);
        return this;
      }
      u24le(v) {
        return this.u8(v).u8(v >> 8).u8(v >> 16);
      }
      u24be(v) {
        return this.u8(v >> 16).u8(v >> 8).u8(v);
      }
      u32le(v) {
        this._ensure(4);
        this.dv.setUint32(this.pos, v >>> 0, true);
        this._adv(4);
        return this;
      }
      u32be(v) {
        this._ensure(4);
        this.dv.setUint32(this.pos, v >>> 0, false);
        this._adv(4);
        return this;
      }
      f32le(v) {
        this._ensure(4);
        this.dv.setFloat32(this.pos, v, true);
        this._adv(4);
        return this;
      }
      bytes(arr) {
        this._ensure(arr.length);
        this.buf.set(arr, this.pos);
        this._adv(arr.length);
        return this;
      }
      fill(v, n) {
        for (let i = 0; i < n; i++) this.u8(v);
        return this;
      }
      /** UTF-8 string, no terminator. */
      str(s) {
        return this.bytes(utf8Encode(s));
      }
      /** UTF-16 big-endian, no terminator. */
      str16be(s) {
        for (let i = 0; i < s.length; i++) this.u16be(s.charCodeAt(i));
        return this;
      }
      result() {
        return this.buf.slice(0, this.len);
      }
    };
  }
});

// src/affinity/sdk.cjs
var require_sdk = __commonJS({
  "src/affinity/sdk.cjs"(exports2, module3) {
    "use strict";
    var { Document } = require("/document.js");
    var { Selection } = require("/selections.js");
    var { Dialog, DialogResult } = require("/dialog.js");
    var { File } = require("/fs.js");
    var { Curve, PolyCurve } = require("/geometry.js");
    var { AddChildNodesCommandBuilder, CompoundCommandBuilder, DocumentCommand } = require("/commands.js");
    var { ContainerNodeDefinition, PolyCurveNodeDefinition } = require("/nodes.js");
    var { FillDescriptor } = require("/fills.js");
    var { Colour } = require("/colours.js");
    var { LineStyleDescriptor } = require("/linestyle.js");
    var { UnitType } = require("/units.js");
    var { BlendMode } = require("affinity:common");
    var { CurveApi, PolygonApi } = require("affinity:geometry");
    var { UiApi } = require("affinity:ui");
    var { ApplicationApi } = require("affinity:application");
    var { FileSystemApi } = require("affinity:fs");
    var { utf8Encode: utf8Encode2, utf8Decode: utf8Decode2 } = (init_bytes(), __toCommonJS(bytes_exports));
    var PREVIEW_NAME = "Embroidery preview";
    var isOk = (r2) => (r2?.value ?? r2) == DialogResult.Ok.value;
    var xy = (p) => [p.x, p.y];
    var ev = (e) => e !== null && typeof e === "object" && "value" in e ? e.value : e;
    function doc() {
      return Document.current;
    }
    function getDocumentInfo() {
      const d = doc();
      if (!d) return null;
      let path = "";
      try {
        path = d.path || "";
      } catch (e) {
      }
      return { title: d.title, path, dpi: d.dpi, uuid: d.persistentUuid, desktop: safe(() => ApplicationApi.getUserDesktopPath(), "") };
    }
    function safe(fn, dflt) {
      try {
        return fn();
      } catch (e) {
        return dflt;
      }
    }
    function readCurve(curve, xf, tolPx) {
      const closed = curve.isClosed;
      const apply = (pt) => xy(xf ? xf.applyToPoint(pt) : pt);
      let points = null;
      try {
        const poly = CurveApi.generatePolygon(curve.handle, tolPx);
        const pts = [];
        PolygonApi.enumeratePoints(poly, (p) => {
          pts.push(apply(p));
          return 0;
        });
        if (pts.length >= 2) points = pts;
      } catch (e) {
      }
      const beziers = [];
      try {
        for (const b2 of curve.beziers) beziers.push({ p0: apply(b2.start), c1: apply(b2.c1), c2: apply(b2.c2), p3: apply(b2.end) });
      } catch (e) {
      }
      const nodes = [];
      try {
        for (const n of curve.nodes) nodes.push(apply(n.position));
      } catch (e) {
      }
      return { closed, points, beziers, nodes };
    }
    function colourOf(fillDescriptor) {
      try {
        const fill = fillDescriptor.fill;
        if (ev(fill.fillType) !== ev(require("affinity:fills").FillType.Solid)) return { rgb: null, alpha: 1, gradient: true };
        const c = fill.colour.rgba8;
        return { rgb: c.r << 16 | c.g << 8 | c.b, alpha: (c.alpha ?? 255) / 255 };
      } catch (e) {
        return null;
      }
    }
    function readNode(node, dpi, tolPx) {
      if (!node.isVectorNode) return null;
      const xf = safe(() => node.localToSpreadTransform, null);
      const polyCurve = node.curvesInterface.polyCurve;
      const curves = [];
      for (const c of polyCurve.curves) curves.push(readCurve(c, xf, tolPx));
      if (!curves.length) return null;
      let fill = null, stroke = null;
      if (safe(() => node.hasBrushFill, false)) fill = colourOf(node.brushFillDescriptor);
      if (safe(() => node.hasPenFill && node.isLineStyleVisible, false)) {
        stroke = colourOf(node.penFillDescriptor);
        if (stroke) stroke.weightPx = node.lineWeight;
      }
      return {
        nodeId: node.nodeId,
        name: safe(() => node.userDescription, "") || safe(() => node.description, ""),
        curves,
        fill,
        stroke,
        bbox: safe(() => {
          const r2 = node.getSpreadVisibleBox();
          return [r2.x, r2.y, r2.width, r2.height];
        }, null)
      };
    }
    function collect(nodes, out) {
      for (const n of nodes) {
        if (n.isVectorNode && !n.isTextNode) out.push(n);
        else if (n.isGroupNode || n.isContainerNode) collect(n.children.toArray(), out);
      }
    }
    function readSelection(tolPx) {
      const d = doc();
      if (!d) return [];
      const nodes = [];
      collect(d.selection.nodes.toArray(), nodes);
      return nodes.map((n) => readNode(n, d.dpi, tolPx)).filter(Boolean);
    }
    function readAll(tolPx) {
      const d = doc();
      if (!d) return [];
      const nodes = [];
      collect(d.currentSpread.children.toArray().filter((n) => safe(() => n.userDescription, "") !== PREVIEW_NAME), nodes);
      return nodes.map((n) => readNode(n, d.dpi, tolPx)).filter(Boolean);
    }
    function runDialog(title, fields, width = 440) {
      const dlg = Dialog.create(title);
      const col = dlg.addColumn();
      let group = null, groupName = null;
      const ctl = {};
      for (const f of fields) {
        if (!group || f.group !== groupName) {
          groupName = f.group;
          group = col.addGroup(f.group || "");
        }
        switch (f.type) {
          case "text":
            ctl[f.id] = group.addTextBox(f.label, String(f.value ?? ""));
            break;
          case "static":
            ctl[f.id] = group.addStaticText(f.label, String(f.value ?? ""));
            break;
          case "combo":
            ctl[f.id] = group.addComboBox(f.label, f.items, Math.max(0, f.items.indexOf(f.value)));
            break;
          case "buttons":
            ctl[f.id] = group.addButtonSet(f.label, f.items, Math.max(0, f.items.indexOf(f.value)));
            break;
          case "check":
            ctl[f.id] = group.addCheckBox(f.label, !!f.value);
            break;
          case "number": {
            const unit = f.unit === "mm" ? UnitType.Millimetre : f.unit === "deg" ? UnitType.Degree : UnitType.Number;
            ctl[f.id] = group.addUnitValueEditor(f.label, unit, unit, Number(f.value), f.min ?? null, f.max ?? null).setPrecision(f.precision ?? 2);
            break;
          }
          case "color":
            ctl[f.id] = group.addColourPicker(f.label, f.value ? Colour.createRGBA8({ r: f.value >> 16 & 255, g: f.value >> 8 & 255, b: f.value & 255, alpha: 255 }) : null);
            break;
          default:
            throw new Error("unknown field type " + f.type);
        }
      }
      for (const f of fields) {
        if (!f.enabledBy) continue;
        const master = ctl[f.enabledBy], slave = ctl[f.id];
        const upd = () => {
          slave.isEnabled = !!master.value;
        };
        master.onValueChangedHandler = upd;
        upd();
      }
      dlg.initialWidth = width;
      if (!isOk(dlg.runModal())) return null;
      const out = {};
      for (const f of fields) {
        const c = ctl[f.id];
        if (f.type === "combo" || f.type === "buttons") out[f.id] = f.items[c.selectedIndex];
        else if (f.type === "static") out[f.id] = f.value;
        else if (f.type === "color") {
          const v = c.value;
          out[f.id] = v ? v.rgba8.r << 16 | v.rgba8.g << 8 | v.rgba8.b : null;
        } else if (f.type === "text") out[f.id] = c.text;
        else out[f.id] = c.value;
      }
      return out;
    }
    var alertBox = (message, title = "Embroidery") => UiApi.alert(message, title);
    var confirmBox = (message, title = "Embroidery") => UiApi.confirm(message, title);
    var chooseFile = () => safe(() => UiApi.chooseFile(), "");
    var FS_HINT = ` - In Affinity: Settings > Scripting > enable "Access the file system" for new scripts, ADD the folder you are writing to under "File System access" (scripts cannot touch files outside those folders), and make sure this script's own Settings (cog icon on the Script Editor) have "Access the file system" ticked.`;
    function fsFail(action, path, e) {
      throw new Error(`Could not ${action} ${path}: ${e && e.message ? e.message : e}${FS_HINT}`);
    }
    function writeFileBytes(path, bytes) {
      let f;
      try {
        f = File.create(path, "wb");
      } catch (e) {
        fsFail("write", path, e);
      }
      try {
        const ab = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
        f.write(ab, bytes.byteLength);
        f.flush();
      } catch (e) {
        fsFail("write", path, e);
      } finally {
        try {
          f.close();
        } catch (e) {
        }
      }
    }
    function writeText(path, text) {
      writeFileBytes(path, utf8Encode2(text));
    }
    function fileExists(path) {
      return safe(() => FileSystemApi.exists(path), false);
    }
    function readText(path) {
      let f;
      try {
        f = File.create(path, "rb");
      } catch (e) {
        fsFail("read", path, e);
      }
      try {
        const len = f.length;
        const buf = new ArrayBuffer(len);
        f.read(buf, len);
        return utf8Decode2(new Uint8Array(buf));
      } finally {
        f.close();
      }
    }
    function makeDirs(path) {
      FileSystemApi.createDirectories(path);
    }
    function addPreview(lines) {
      const d = doc();
      if (!d) return;
      removePreview();
      const noFill = FillDescriptor.createNone();
      const compound = CompoundCommandBuilder.create();
      const layerBuilder = AddChildNodesCommandBuilder.create();
      const layerDef = ContainerNodeDefinition.create(PREVIEW_NAME);
      layerDef.userDescription = PREVIEW_NAME;
      layerBuilder.addNode(layerDef);
      compound.addCommand(layerBuilder.createCommand(true));
      const lineBuilder = AddChildNodesCommandBuilder.create();
      for (const ln of lines) {
        if (ln.pts.length < 2) continue;
        const curve = Curve.create();
        CurveApi.setPath(curve.handle, ln.pts.map(([x, y]) => ({ x, y })));
        const poly = PolyCurve.create();
        poly.addCurve(curve);
        const col = Colour.createRGBA8({ r: ln.rgb >> 16 & 255, g: ln.rgb >> 8 & 255, b: ln.rgb & 255, alpha: 255 });
        const def = PolyCurveNodeDefinition.create(poly, noFill, FillDescriptor.createSolid(col, BlendMode.Normal), LineStyleDescriptor.createDefault(ln.weightPx), noFill);
        def.userDescription = "stitches";
        lineBuilder.addNode(def);
      }
      compound.addCommand(lineBuilder.createCommand(false));
      d.executeCommand(compound.createCommand());
    }
    function removePreview() {
      const d = doc();
      if (!d) return 0;
      const found = d.currentSpread.children.toArray().filter((n) => safe(() => n.userDescription, "") === PREVIEW_NAME);
      if (!found.length) return 0;
      const sel = Selection.create(d, found);
      d.executeCommand(DocumentCommand.createDeleteSelection(sel, true));
      return found.length;
    }
    module3.exports = { getDocumentInfo, readSelection, readAll, runDialog, alertBox, confirmBox, chooseFile, writeFileBytes, writeText, readText, fileExists, makeDirs, addPreview, removePreview, PREVIEW_NAME };
  }
});

// src/stitch/params.js
function resolveParams(over = {}) {
  const p = { ...DEFAULTS };
  for (const [k, v] of Object.entries(over || {})) if (v !== void 0 && k in DEFAULTS) p[k] = v;
  return p;
}
var MM, DEFAULTS, du;
var init_params = __esm({
  "src/stitch/params.js"() {
    MM = 10;
    DEFAULTS = Object.freeze({
      type: "auto",
      // auto | running | fill | contour | satin | manual | none
      // thresholds for 'auto'
      satinMinWidth: 1.5,
      // strokes at least this wide become satin, thinner become running
      // running stitch
      stitchLength: 2.5,
      repeats: 1,
      // whole-path passes (forward, back, forward ...)
      bean: false,
      // bean (triple) stitch: every stitch is sewn forward-back-forward
      beanRepeats: 1,
      // extra back-and-forth per stitch when bean is on (1 = triple)
      runCornerAngle: 30,
      // degrees; vertices sharper than this always get a stitch
      tolerance: 0.2,
      // curve flattening tolerance (mm)
      // fill
      fillAngle: 0,
      rowSpacing: 0.25,
      maxStitchLength: 3,
      stagger: 4,
      // rows before the stitch pattern repeats (0/1 = no stagger)
      expand: 0,
      // grow (+) or shrink (-) the fill outline, mm (pull compensation for fills)
      fillStart: null,
      // [x,y] mm in document space, optional
      fillEnd: null,
      travelMax: 5,
      // max distance (mm) bridged with running travel stitches inside the shape
      fillUnderlay: true,
      fillUnderlayAngle: 90,
      // relative to fillAngle
      fillUnderlaySpacing: 1.5,
      fillUnderlayInset: 0.4,
      fillUnderlayMaxStitch: 3,
      // satin
      satinSpacing: 0.4,
      // distance between zig-zag lines (density = 1/spacing)
      satinPullComp: 0.2,
      // total extra width (mm), applied half per side
      satinMaxStitch: 12,
      // rungs longer than this are split
      satinCenterWalk: true,
      satinContour: false,
      satinZigzag: false,
      satinUnderlayInset: 0.4,
      // mm from each rail
      satinUnderlayStitch: 2,
      // running length of walk / contour underlay
      satinZigzagSpacing: 2,
      shortStitch: true,
      shortStitchDistance: 0.35,
      // mm: rail points closer than this trigger short stitches
      shortStitchInset: 0.2,
      // fraction of the rung that is cut off
      satinRails: null,
      // optional explicit [railA, railB] polylines (du), for two-rail columns
      // general
      threadColor: null
      // override colour (#rrggbb)
    });
    du = (mm) => mm * MM;
  }
});

// src/core/pattern.js
function makeThread(color = 0, name = "", brand = "", catalog = "") {
  return { color: color & 16777215, name, brand, catalog };
}
function hexToInt(hex) {
  return parseInt(String(hex).replace("#", ""), 16) & 16777215;
}
function intToHex(c) {
  return "#" + (c & 16777215).toString(16).padStart(6, "0");
}
function threadOrFiller(pattern, i) {
  return pattern.threads[i] ?? makeThread(FILLERS[i % FILLERS.length], "Filler " + (i + 1));
}
function fixThreadCount(pattern) {
  let blocks = 0, init = true;
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.STITCH) {
      if (init) {
        blocks++;
        init = false;
      }
    } else if (s.cmd === CMD.COLOR_CHANGE) init = true;
  }
  while (pattern.threads.length < blocks) pattern.threads.push(threadOrFiller(pattern, pattern.threads.length));
  return pattern;
}
var CMD, Pattern, FILLERS;
var init_pattern = __esm({
  "src/core/pattern.js"() {
    CMD = Object.freeze({
      STITCH: 0,
      JUMP: 1,
      TRIM: 2,
      COLOR_CHANGE: 3,
      STOP: 4,
      END: 5
    });
    Pattern = class _Pattern {
      constructor() {
        this.stitches = [];
        this.threads = [];
        this.meta = { name: "Untitled", author: "", comments: "" };
      }
      get lastX() {
        return this.stitches.length ? this.stitches[this.stitches.length - 1].x : 0;
      }
      get lastY() {
        return this.stitches.length ? this.stitches[this.stitches.length - 1].y : 0;
      }
      add(x, y, cmd) {
        this.stitches.push({ x, y, cmd });
        return this;
      }
      stitch(x, y) {
        return this.add(x, y, CMD.STITCH);
      }
      jump(x, y) {
        return this.add(x, y, CMD.JUMP);
      }
      trim() {
        return this.add(this.lastX, this.lastY, CMD.TRIM);
      }
      colorChange() {
        return this.add(this.lastX, this.lastY, CMD.COLOR_CHANGE);
      }
      stop() {
        return this.add(this.lastX, this.lastY, CMD.STOP);
      }
      end() {
        return this.add(this.lastX, this.lastY, CMD.END);
      }
      addThread(t) {
        this.threads.push(t);
        return this;
      }
      /** Bounds over every stitch position (any command), like pyembroidery. */
      bounds() {
        if (!this.stitches.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        for (const s of this.stitches) {
          if (s.x < minX) minX = s.x;
          if (s.x > maxX) maxX = s.x;
          if (s.y < minY) minY = s.y;
          if (s.y > maxY) maxY = s.y;
        }
        return { minX, minY, maxX, maxY };
      }
      count(cmd) {
        let n = 0;
        for (const s of this.stitches) if (s.cmd === cmd) n++;
        return n;
      }
      countColorChanges() {
        return this.count(CMD.COLOR_CHANGE);
      }
      /** Number of colour blocks that contain at least one stitch. */
      colorBlockCount() {
        return this.count(CMD.COLOR_CHANGE) + 1;
      }
      clone() {
        const p = new _Pattern();
        p.stitches = this.stitches.map((s) => ({ ...s }));
        p.threads = this.threads.map((t) => ({ ...t }));
        p.meta = { ...this.meta };
        return p;
      }
    };
    FILLERS = [16711680, 43520, 255, 16755200, 10027161, 43690, 7829367, 0];
  }
});

// vendor/clipper.js
var module2, clipper_default;
var init_clipper = __esm({
  "vendor/clipper.js"() {
    module2 = { exports: {} };
    (function() {
      "use strict";
      var ClipperLib = {};
      ClipperLib.version = "6.4.2.2";
      ClipperLib.use_lines = true;
      ClipperLib.use_xyz = false;
      var isNode = false;
      if (typeof module2 !== "undefined" && module2.exports) {
        module2.exports = ClipperLib;
        isNode = true;
      } else {
        if (typeof define === "function" && define.amd) {
          define(ClipperLib);
        }
        if (typeof document !== "undefined") window.ClipperLib = ClipperLib;
        else self["ClipperLib"] = ClipperLib;
      }
      var navigator_appName;
      if (!isNode) {
        var nav = navigator.userAgent.toString().toLowerCase();
        navigator_appName = navigator.appName;
      } else {
        var nav = "chrome";
        navigator_appName = "Netscape";
      }
      var browser = {};
      if (nav.indexOf("chrome") != -1 && nav.indexOf("chromium") == -1) browser.chrome = 1;
      else browser.chrome = 0;
      if (nav.indexOf("chromium") != -1) browser.chromium = 1;
      else browser.chromium = 0;
      if (nav.indexOf("safari") != -1 && nav.indexOf("chrome") == -1 && nav.indexOf("chromium") == -1) browser.safari = 1;
      else browser.safari = 0;
      if (nav.indexOf("firefox") != -1) browser.firefox = 1;
      else browser.firefox = 0;
      if (nav.indexOf("firefox/17") != -1) browser.firefox17 = 1;
      else browser.firefox17 = 0;
      if (nav.indexOf("firefox/15") != -1) browser.firefox15 = 1;
      else browser.firefox15 = 0;
      if (nav.indexOf("firefox/3") != -1) browser.firefox3 = 1;
      else browser.firefox3 = 0;
      if (nav.indexOf("opera") != -1) browser.opera = 1;
      else browser.opera = 0;
      if (nav.indexOf("msie 10") != -1) browser.msie10 = 1;
      else browser.msie10 = 0;
      if (nav.indexOf("msie 9") != -1) browser.msie9 = 1;
      else browser.msie9 = 0;
      if (nav.indexOf("msie 8") != -1) browser.msie8 = 1;
      else browser.msie8 = 0;
      if (nav.indexOf("msie 7") != -1) browser.msie7 = 1;
      else browser.msie7 = 0;
      if (nav.indexOf("msie ") != -1) browser.msie = 1;
      else browser.msie = 0;
      ClipperLib.biginteger_used = null;
      var dbits;
      var canary = 244837814094590;
      var j_lm = (canary & 16777215) == 15715070;
      function BigInteger(a, b2, c) {
        ClipperLib.biginteger_used = 1;
        if (a != null)
          if ("number" == typeof a && "undefined" == typeof b2) this.fromInt(a);
          else if ("number" == typeof a) this.fromNumber(a, b2, c);
          else if (b2 == null && "string" != typeof a) this.fromString(a, 256);
          else this.fromString(a, b2);
      }
      function nbi() {
        return new BigInteger(null, void 0, void 0);
      }
      function am1(i, x, w, j, c, n) {
        while (--n >= 0) {
          var v = x * this[i++] + w[j] + c;
          c = Math.floor(v / 67108864);
          w[j++] = v & 67108863;
        }
        return c;
      }
      function am2(i, x, w, j, c, n) {
        var xl = x & 32767, xh = x >> 15;
        while (--n >= 0) {
          var l = this[i] & 32767;
          var h = this[i++] >> 15;
          var m = xh * l + h * xl;
          l = xl * l + ((m & 32767) << 15) + w[j] + (c & 1073741823);
          c = (l >>> 30) + (m >>> 15) + xh * h + (c >>> 30);
          w[j++] = l & 1073741823;
        }
        return c;
      }
      function am3(i, x, w, j, c, n) {
        var xl = x & 16383, xh = x >> 14;
        while (--n >= 0) {
          var l = this[i] & 16383;
          var h = this[i++] >> 14;
          var m = xh * l + h * xl;
          l = xl * l + ((m & 16383) << 14) + w[j] + c;
          c = (l >> 28) + (m >> 14) + xh * h;
          w[j++] = l & 268435455;
        }
        return c;
      }
      if (j_lm && navigator_appName == "Microsoft Internet Explorer") {
        BigInteger.prototype.am = am2;
        dbits = 30;
      } else if (j_lm && navigator_appName != "Netscape") {
        BigInteger.prototype.am = am1;
        dbits = 26;
      } else {
        BigInteger.prototype.am = am3;
        dbits = 28;
      }
      BigInteger.prototype.DB = dbits;
      BigInteger.prototype.DM = (1 << dbits) - 1;
      BigInteger.prototype.DV = 1 << dbits;
      var BI_FP = 52;
      BigInteger.prototype.FV = Math.pow(2, BI_FP);
      BigInteger.prototype.F1 = BI_FP - dbits;
      BigInteger.prototype.F2 = 2 * dbits - BI_FP;
      var BI_RM = "0123456789abcdefghijklmnopqrstuvwxyz";
      var BI_RC = new Array();
      var rr, vv;
      rr = "0".charCodeAt(0);
      for (vv = 0; vv <= 9; ++vv) BI_RC[rr++] = vv;
      rr = "a".charCodeAt(0);
      for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
      rr = "A".charCodeAt(0);
      for (vv = 10; vv < 36; ++vv) BI_RC[rr++] = vv;
      function int2char(n) {
        return BI_RM.charAt(n);
      }
      function intAt(s, i) {
        var c = BI_RC[s.charCodeAt(i)];
        return c == null ? -1 : c;
      }
      function bnpCopyTo(r2) {
        for (var i = this.t - 1; i >= 0; --i) r2[i] = this[i];
        r2.t = this.t;
        r2.s = this.s;
      }
      function bnpFromInt(x) {
        this.t = 1;
        this.s = x < 0 ? -1 : 0;
        if (x > 0) this[0] = x;
        else if (x < -1) this[0] = x + this.DV;
        else this.t = 0;
      }
      function nbv(i) {
        var r2 = nbi();
        r2.fromInt(i);
        return r2;
      }
      function bnpFromString(s, b2) {
        var k;
        if (b2 == 16) k = 4;
        else if (b2 == 8) k = 3;
        else if (b2 == 256) k = 8;
        else if (b2 == 2) k = 1;
        else if (b2 == 32) k = 5;
        else if (b2 == 4) k = 2;
        else {
          this.fromRadix(s, b2);
          return;
        }
        this.t = 0;
        this.s = 0;
        var i = s.length, mi = false, sh = 0;
        while (--i >= 0) {
          var x = k == 8 ? s[i] & 255 : intAt(s, i);
          if (x < 0) {
            if (s.charAt(i) == "-") mi = true;
            continue;
          }
          mi = false;
          if (sh == 0)
            this[this.t++] = x;
          else if (sh + k > this.DB) {
            this[this.t - 1] |= (x & (1 << this.DB - sh) - 1) << sh;
            this[this.t++] = x >> this.DB - sh;
          } else
            this[this.t - 1] |= x << sh;
          sh += k;
          if (sh >= this.DB) sh -= this.DB;
        }
        if (k == 8 && (s[0] & 128) != 0) {
          this.s = -1;
          if (sh > 0) this[this.t - 1] |= (1 << this.DB - sh) - 1 << sh;
        }
        this.clamp();
        if (mi) BigInteger.ZERO.subTo(this, this);
      }
      function bnpClamp() {
        var c = this.s & this.DM;
        while (this.t > 0 && this[this.t - 1] == c) --this.t;
      }
      function bnToString(b2) {
        if (this.s < 0) return "-" + this.negate().toString(b2);
        var k;
        if (b2 == 16) k = 4;
        else if (b2 == 8) k = 3;
        else if (b2 == 2) k = 1;
        else if (b2 == 32) k = 5;
        else if (b2 == 4) k = 2;
        else return this.toRadix(b2);
        var km = (1 << k) - 1, d, m = false, r2 = "", i = this.t;
        var p = this.DB - i * this.DB % k;
        if (i-- > 0) {
          if (p < this.DB && (d = this[i] >> p) > 0) {
            m = true;
            r2 = int2char(d);
          }
          while (i >= 0) {
            if (p < k) {
              d = (this[i] & (1 << p) - 1) << k - p;
              d |= this[--i] >> (p += this.DB - k);
            } else {
              d = this[i] >> (p -= k) & km;
              if (p <= 0) {
                p += this.DB;
                --i;
              }
            }
            if (d > 0) m = true;
            if (m) r2 += int2char(d);
          }
        }
        return m ? r2 : "0";
      }
      function bnNegate() {
        var r2 = nbi();
        BigInteger.ZERO.subTo(this, r2);
        return r2;
      }
      function bnAbs() {
        return this.s < 0 ? this.negate() : this;
      }
      function bnCompareTo(a) {
        var r2 = this.s - a.s;
        if (r2 != 0) return r2;
        var i = this.t;
        r2 = i - a.t;
        if (r2 != 0) return this.s < 0 ? -r2 : r2;
        while (--i >= 0)
          if ((r2 = this[i] - a[i]) != 0) return r2;
        return 0;
      }
      function nbits(x) {
        var r2 = 1, t;
        if ((t = x >>> 16) != 0) {
          x = t;
          r2 += 16;
        }
        if ((t = x >> 8) != 0) {
          x = t;
          r2 += 8;
        }
        if ((t = x >> 4) != 0) {
          x = t;
          r2 += 4;
        }
        if ((t = x >> 2) != 0) {
          x = t;
          r2 += 2;
        }
        if ((t = x >> 1) != 0) {
          x = t;
          r2 += 1;
        }
        return r2;
      }
      function bnBitLength() {
        if (this.t <= 0) return 0;
        return this.DB * (this.t - 1) + nbits(this[this.t - 1] ^ this.s & this.DM);
      }
      function bnpDLShiftTo(n, r2) {
        var i;
        for (i = this.t - 1; i >= 0; --i) r2[i + n] = this[i];
        for (i = n - 1; i >= 0; --i) r2[i] = 0;
        r2.t = this.t + n;
        r2.s = this.s;
      }
      function bnpDRShiftTo(n, r2) {
        for (var i = n; i < this.t; ++i) r2[i - n] = this[i];
        r2.t = Math.max(this.t - n, 0);
        r2.s = this.s;
      }
      function bnpLShiftTo(n, r2) {
        var bs = n % this.DB;
        var cbs = this.DB - bs;
        var bm = (1 << cbs) - 1;
        var ds = Math.floor(n / this.DB), c = this.s << bs & this.DM, i;
        for (i = this.t - 1; i >= 0; --i) {
          r2[i + ds + 1] = this[i] >> cbs | c;
          c = (this[i] & bm) << bs;
        }
        for (i = ds - 1; i >= 0; --i) r2[i] = 0;
        r2[ds] = c;
        r2.t = this.t + ds + 1;
        r2.s = this.s;
        r2.clamp();
      }
      function bnpRShiftTo(n, r2) {
        r2.s = this.s;
        var ds = Math.floor(n / this.DB);
        if (ds >= this.t) {
          r2.t = 0;
          return;
        }
        var bs = n % this.DB;
        var cbs = this.DB - bs;
        var bm = (1 << bs) - 1;
        r2[0] = this[ds] >> bs;
        for (var i = ds + 1; i < this.t; ++i) {
          r2[i - ds - 1] |= (this[i] & bm) << cbs;
          r2[i - ds] = this[i] >> bs;
        }
        if (bs > 0) r2[this.t - ds - 1] |= (this.s & bm) << cbs;
        r2.t = this.t - ds;
        r2.clamp();
      }
      function bnpSubTo(a, r2) {
        var i = 0, c = 0, m = Math.min(a.t, this.t);
        while (i < m) {
          c += this[i] - a[i];
          r2[i++] = c & this.DM;
          c >>= this.DB;
        }
        if (a.t < this.t) {
          c -= a.s;
          while (i < this.t) {
            c += this[i];
            r2[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += this.s;
        } else {
          c += this.s;
          while (i < a.t) {
            c -= a[i];
            r2[i++] = c & this.DM;
            c >>= this.DB;
          }
          c -= a.s;
        }
        r2.s = c < 0 ? -1 : 0;
        if (c < -1) r2[i++] = this.DV + c;
        else if (c > 0) r2[i++] = c;
        r2.t = i;
        r2.clamp();
      }
      function bnpMultiplyTo(a, r2) {
        var x = this.abs(), y = a.abs();
        var i = x.t;
        r2.t = i + y.t;
        while (--i >= 0) r2[i] = 0;
        for (i = 0; i < y.t; ++i) r2[i + x.t] = x.am(0, y[i], r2, i, 0, x.t);
        r2.s = 0;
        r2.clamp();
        if (this.s != a.s) BigInteger.ZERO.subTo(r2, r2);
      }
      function bnpSquareTo(r2) {
        var x = this.abs();
        var i = r2.t = 2 * x.t;
        while (--i >= 0) r2[i] = 0;
        for (i = 0; i < x.t - 1; ++i) {
          var c = x.am(i, x[i], r2, 2 * i, 0, 1);
          if ((r2[i + x.t] += x.am(i + 1, 2 * x[i], r2, 2 * i + 1, c, x.t - i - 1)) >= x.DV) {
            r2[i + x.t] -= x.DV;
            r2[i + x.t + 1] = 1;
          }
        }
        if (r2.t > 0) r2[r2.t - 1] += x.am(i, x[i], r2, 2 * i, 0, 1);
        r2.s = 0;
        r2.clamp();
      }
      function bnpDivRemTo(m, q, r2) {
        var pm = m.abs();
        if (pm.t <= 0) return;
        var pt = this.abs();
        if (pt.t < pm.t) {
          if (q != null) q.fromInt(0);
          if (r2 != null) this.copyTo(r2);
          return;
        }
        if (r2 == null) r2 = nbi();
        var y = nbi(), ts = this.s, ms = m.s;
        var nsh = this.DB - nbits(pm[pm.t - 1]);
        if (nsh > 0) {
          pm.lShiftTo(nsh, y);
          pt.lShiftTo(nsh, r2);
        } else {
          pm.copyTo(y);
          pt.copyTo(r2);
        }
        var ys = y.t;
        var y0 = y[ys - 1];
        if (y0 == 0) return;
        var yt = y0 * (1 << this.F1) + (ys > 1 ? y[ys - 2] >> this.F2 : 0);
        var d1 = this.FV / yt, d2 = (1 << this.F1) / yt, e = 1 << this.F2;
        var i = r2.t, j = i - ys, t = q == null ? nbi() : q;
        y.dlShiftTo(j, t);
        if (r2.compareTo(t) >= 0) {
          r2[r2.t++] = 1;
          r2.subTo(t, r2);
        }
        BigInteger.ONE.dlShiftTo(ys, t);
        t.subTo(y, y);
        while (y.t < ys) y[y.t++] = 0;
        while (--j >= 0) {
          var qd = r2[--i] == y0 ? this.DM : Math.floor(r2[i] * d1 + (r2[i - 1] + e) * d2);
          if ((r2[i] += y.am(0, qd, r2, j, 0, ys)) < qd) {
            y.dlShiftTo(j, t);
            r2.subTo(t, r2);
            while (r2[i] < --qd) r2.subTo(t, r2);
          }
        }
        if (q != null) {
          r2.drShiftTo(ys, q);
          if (ts != ms) BigInteger.ZERO.subTo(q, q);
        }
        r2.t = ys;
        r2.clamp();
        if (nsh > 0) r2.rShiftTo(nsh, r2);
        if (ts < 0) BigInteger.ZERO.subTo(r2, r2);
      }
      function bnMod(a) {
        var r2 = nbi();
        this.abs().divRemTo(a, null, r2);
        if (this.s < 0 && r2.compareTo(BigInteger.ZERO) > 0) a.subTo(r2, r2);
        return r2;
      }
      function Classic(m) {
        this.m = m;
      }
      function cConvert(x) {
        if (x.s < 0 || x.compareTo(this.m) >= 0) return x.mod(this.m);
        else return x;
      }
      function cRevert(x) {
        return x;
      }
      function cReduce(x) {
        x.divRemTo(this.m, null, x);
      }
      function cMulTo(x, y, r2) {
        x.multiplyTo(y, r2);
        this.reduce(r2);
      }
      function cSqrTo(x, r2) {
        x.squareTo(r2);
        this.reduce(r2);
      }
      Classic.prototype.convert = cConvert;
      Classic.prototype.revert = cRevert;
      Classic.prototype.reduce = cReduce;
      Classic.prototype.mulTo = cMulTo;
      Classic.prototype.sqrTo = cSqrTo;
      function bnpInvDigit() {
        if (this.t < 1) return 0;
        var x = this[0];
        if ((x & 1) == 0) return 0;
        var y = x & 3;
        y = y * (2 - (x & 15) * y) & 15;
        y = y * (2 - (x & 255) * y) & 255;
        y = y * (2 - ((x & 65535) * y & 65535)) & 65535;
        y = y * (2 - x * y % this.DV) % this.DV;
        return y > 0 ? this.DV - y : -y;
      }
      function Montgomery(m) {
        this.m = m;
        this.mp = m.invDigit();
        this.mpl = this.mp & 32767;
        this.mph = this.mp >> 15;
        this.um = (1 << m.DB - 15) - 1;
        this.mt2 = 2 * m.t;
      }
      function montConvert(x) {
        var r2 = nbi();
        x.abs().dlShiftTo(this.m.t, r2);
        r2.divRemTo(this.m, null, r2);
        if (x.s < 0 && r2.compareTo(BigInteger.ZERO) > 0) this.m.subTo(r2, r2);
        return r2;
      }
      function montRevert(x) {
        var r2 = nbi();
        x.copyTo(r2);
        this.reduce(r2);
        return r2;
      }
      function montReduce(x) {
        while (x.t <= this.mt2)
          x[x.t++] = 0;
        for (var i = 0; i < this.m.t; ++i) {
          var j = x[i] & 32767;
          var u0 = j * this.mpl + ((j * this.mph + (x[i] >> 15) * this.mpl & this.um) << 15) & x.DM;
          j = i + this.m.t;
          x[j] += this.m.am(0, u0, x, i, 0, this.m.t);
          while (x[j] >= x.DV) {
            x[j] -= x.DV;
            x[++j]++;
          }
        }
        x.clamp();
        x.drShiftTo(this.m.t, x);
        if (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
      }
      function montSqrTo(x, r2) {
        x.squareTo(r2);
        this.reduce(r2);
      }
      function montMulTo(x, y, r2) {
        x.multiplyTo(y, r2);
        this.reduce(r2);
      }
      Montgomery.prototype.convert = montConvert;
      Montgomery.prototype.revert = montRevert;
      Montgomery.prototype.reduce = montReduce;
      Montgomery.prototype.mulTo = montMulTo;
      Montgomery.prototype.sqrTo = montSqrTo;
      function bnpIsEven() {
        return (this.t > 0 ? this[0] & 1 : this.s) == 0;
      }
      function bnpExp(e, z) {
        if (e > 4294967295 || e < 1) return BigInteger.ONE;
        var r2 = nbi(), r22 = nbi(), g2 = z.convert(this), i = nbits(e) - 1;
        g2.copyTo(r2);
        while (--i >= 0) {
          z.sqrTo(r2, r22);
          if ((e & 1 << i) > 0) z.mulTo(r22, g2, r2);
          else {
            var t = r2;
            r2 = r22;
            r22 = t;
          }
        }
        return z.revert(r2);
      }
      function bnModPowInt(e, m) {
        var z;
        if (e < 256 || m.isEven()) z = new Classic(m);
        else z = new Montgomery(m);
        return this.exp(e, z);
      }
      BigInteger.prototype.copyTo = bnpCopyTo;
      BigInteger.prototype.fromInt = bnpFromInt;
      BigInteger.prototype.fromString = bnpFromString;
      BigInteger.prototype.clamp = bnpClamp;
      BigInteger.prototype.dlShiftTo = bnpDLShiftTo;
      BigInteger.prototype.drShiftTo = bnpDRShiftTo;
      BigInteger.prototype.lShiftTo = bnpLShiftTo;
      BigInteger.prototype.rShiftTo = bnpRShiftTo;
      BigInteger.prototype.subTo = bnpSubTo;
      BigInteger.prototype.multiplyTo = bnpMultiplyTo;
      BigInteger.prototype.squareTo = bnpSquareTo;
      BigInteger.prototype.divRemTo = bnpDivRemTo;
      BigInteger.prototype.invDigit = bnpInvDigit;
      BigInteger.prototype.isEven = bnpIsEven;
      BigInteger.prototype.exp = bnpExp;
      BigInteger.prototype.toString = bnToString;
      BigInteger.prototype.negate = bnNegate;
      BigInteger.prototype.abs = bnAbs;
      BigInteger.prototype.compareTo = bnCompareTo;
      BigInteger.prototype.bitLength = bnBitLength;
      BigInteger.prototype.mod = bnMod;
      BigInteger.prototype.modPowInt = bnModPowInt;
      BigInteger.ZERO = nbv(0);
      BigInteger.ONE = nbv(1);
      function bnClone() {
        var r2 = nbi();
        this.copyTo(r2);
        return r2;
      }
      function bnIntValue() {
        if (this.s < 0) {
          if (this.t == 1) return this[0] - this.DV;
          else if (this.t == 0) return -1;
        } else if (this.t == 1) return this[0];
        else if (this.t == 0) return 0;
        return (this[1] & (1 << 32 - this.DB) - 1) << this.DB | this[0];
      }
      function bnByteValue() {
        return this.t == 0 ? this.s : this[0] << 24 >> 24;
      }
      function bnShortValue() {
        return this.t == 0 ? this.s : this[0] << 16 >> 16;
      }
      function bnpChunkSize(r2) {
        return Math.floor(Math.LN2 * this.DB / Math.log(r2));
      }
      function bnSigNum() {
        if (this.s < 0) return -1;
        else if (this.t <= 0 || this.t == 1 && this[0] <= 0) return 0;
        else return 1;
      }
      function bnpToRadix(b2) {
        if (b2 == null) b2 = 10;
        if (this.signum() == 0 || b2 < 2 || b2 > 36) return "0";
        var cs = this.chunkSize(b2);
        var a = Math.pow(b2, cs);
        var d = nbv(a), y = nbi(), z = nbi(), r2 = "";
        this.divRemTo(d, y, z);
        while (y.signum() > 0) {
          r2 = (a + z.intValue()).toString(b2).substr(1) + r2;
          y.divRemTo(d, y, z);
        }
        return z.intValue().toString(b2) + r2;
      }
      function bnpFromRadix(s, b2) {
        this.fromInt(0);
        if (b2 == null) b2 = 10;
        var cs = this.chunkSize(b2);
        var d = Math.pow(b2, cs), mi = false, j = 0, w = 0;
        for (var i = 0; i < s.length; ++i) {
          var x = intAt(s, i);
          if (x < 0) {
            if (s.charAt(i) == "-" && this.signum() == 0) mi = true;
            continue;
          }
          w = b2 * w + x;
          if (++j >= cs) {
            this.dMultiply(d);
            this.dAddOffset(w, 0);
            j = 0;
            w = 0;
          }
        }
        if (j > 0) {
          this.dMultiply(Math.pow(b2, j));
          this.dAddOffset(w, 0);
        }
        if (mi) BigInteger.ZERO.subTo(this, this);
      }
      function bnpFromNumber(a, b2, c) {
        if ("number" == typeof b2) {
          if (a < 2) this.fromInt(1);
          else {
            this.fromNumber(a, c);
            if (!this.testBit(a - 1))
              this.bitwiseTo(BigInteger.ONE.shiftLeft(a - 1), op_or, this);
            if (this.isEven()) this.dAddOffset(1, 0);
            while (!this.isProbablePrime(b2)) {
              this.dAddOffset(2, 0);
              if (this.bitLength() > a) this.subTo(BigInteger.ONE.shiftLeft(a - 1), this);
            }
          }
        } else {
          var x = new Array(), t = a & 7;
          x.length = (a >> 3) + 1;
          b2.nextBytes(x);
          if (t > 0) x[0] &= (1 << t) - 1;
          else x[0] = 0;
          this.fromString(x, 256);
        }
      }
      function bnToByteArray() {
        var i = this.t, r2 = new Array();
        r2[0] = this.s;
        var p = this.DB - i * this.DB % 8, d, k = 0;
        if (i-- > 0) {
          if (p < this.DB && (d = this[i] >> p) != (this.s & this.DM) >> p)
            r2[k++] = d | this.s << this.DB - p;
          while (i >= 0) {
            if (p < 8) {
              d = (this[i] & (1 << p) - 1) << 8 - p;
              d |= this[--i] >> (p += this.DB - 8);
            } else {
              d = this[i] >> (p -= 8) & 255;
              if (p <= 0) {
                p += this.DB;
                --i;
              }
            }
            if ((d & 128) != 0) d |= -256;
            if (k == 0 && (this.s & 128) != (d & 128)) ++k;
            if (k > 0 || d != this.s) r2[k++] = d;
          }
        }
        return r2;
      }
      function bnEquals(a) {
        return this.compareTo(a) == 0;
      }
      function bnMin(a) {
        return this.compareTo(a) < 0 ? this : a;
      }
      function bnMax(a) {
        return this.compareTo(a) > 0 ? this : a;
      }
      function bnpBitwiseTo(a, op, r2) {
        var i, f, m = Math.min(a.t, this.t);
        for (i = 0; i < m; ++i) r2[i] = op(this[i], a[i]);
        if (a.t < this.t) {
          f = a.s & this.DM;
          for (i = m; i < this.t; ++i) r2[i] = op(this[i], f);
          r2.t = this.t;
        } else {
          f = this.s & this.DM;
          for (i = m; i < a.t; ++i) r2[i] = op(f, a[i]);
          r2.t = a.t;
        }
        r2.s = op(this.s, a.s);
        r2.clamp();
      }
      function op_and(x, y) {
        return x & y;
      }
      function bnAnd(a) {
        var r2 = nbi();
        this.bitwiseTo(a, op_and, r2);
        return r2;
      }
      function op_or(x, y) {
        return x | y;
      }
      function bnOr(a) {
        var r2 = nbi();
        this.bitwiseTo(a, op_or, r2);
        return r2;
      }
      function op_xor(x, y) {
        return x ^ y;
      }
      function bnXor(a) {
        var r2 = nbi();
        this.bitwiseTo(a, op_xor, r2);
        return r2;
      }
      function op_andnot(x, y) {
        return x & ~y;
      }
      function bnAndNot(a) {
        var r2 = nbi();
        this.bitwiseTo(a, op_andnot, r2);
        return r2;
      }
      function bnNot() {
        var r2 = nbi();
        for (var i = 0; i < this.t; ++i) r2[i] = this.DM & ~this[i];
        r2.t = this.t;
        r2.s = ~this.s;
        return r2;
      }
      function bnShiftLeft(n) {
        var r2 = nbi();
        if (n < 0) this.rShiftTo(-n, r2);
        else this.lShiftTo(n, r2);
        return r2;
      }
      function bnShiftRight(n) {
        var r2 = nbi();
        if (n < 0) this.lShiftTo(-n, r2);
        else this.rShiftTo(n, r2);
        return r2;
      }
      function lbit(x) {
        if (x == 0) return -1;
        var r2 = 0;
        if ((x & 65535) == 0) {
          x >>= 16;
          r2 += 16;
        }
        if ((x & 255) == 0) {
          x >>= 8;
          r2 += 8;
        }
        if ((x & 15) == 0) {
          x >>= 4;
          r2 += 4;
        }
        if ((x & 3) == 0) {
          x >>= 2;
          r2 += 2;
        }
        if ((x & 1) == 0) ++r2;
        return r2;
      }
      function bnGetLowestSetBit() {
        for (var i = 0; i < this.t; ++i)
          if (this[i] != 0) return i * this.DB + lbit(this[i]);
        if (this.s < 0) return this.t * this.DB;
        return -1;
      }
      function cbit(x) {
        var r2 = 0;
        while (x != 0) {
          x &= x - 1;
          ++r2;
        }
        return r2;
      }
      function bnBitCount() {
        var r2 = 0, x = this.s & this.DM;
        for (var i = 0; i < this.t; ++i) r2 += cbit(this[i] ^ x);
        return r2;
      }
      function bnTestBit(n) {
        var j = Math.floor(n / this.DB);
        if (j >= this.t) return this.s != 0;
        return (this[j] & 1 << n % this.DB) != 0;
      }
      function bnpChangeBit(n, op) {
        var r2 = BigInteger.ONE.shiftLeft(n);
        this.bitwiseTo(r2, op, r2);
        return r2;
      }
      function bnSetBit(n) {
        return this.changeBit(n, op_or);
      }
      function bnClearBit(n) {
        return this.changeBit(n, op_andnot);
      }
      function bnFlipBit(n) {
        return this.changeBit(n, op_xor);
      }
      function bnpAddTo(a, r2) {
        var i = 0, c = 0, m = Math.min(a.t, this.t);
        while (i < m) {
          c += this[i] + a[i];
          r2[i++] = c & this.DM;
          c >>= this.DB;
        }
        if (a.t < this.t) {
          c += a.s;
          while (i < this.t) {
            c += this[i];
            r2[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += this.s;
        } else {
          c += this.s;
          while (i < a.t) {
            c += a[i];
            r2[i++] = c & this.DM;
            c >>= this.DB;
          }
          c += a.s;
        }
        r2.s = c < 0 ? -1 : 0;
        if (c > 0) r2[i++] = c;
        else if (c < -1) r2[i++] = this.DV + c;
        r2.t = i;
        r2.clamp();
      }
      function bnAdd(a) {
        var r2 = nbi();
        this.addTo(a, r2);
        return r2;
      }
      function bnSubtract(a) {
        var r2 = nbi();
        this.subTo(a, r2);
        return r2;
      }
      function bnMultiply(a) {
        var r2 = nbi();
        this.multiplyTo(a, r2);
        return r2;
      }
      function bnSquare() {
        var r2 = nbi();
        this.squareTo(r2);
        return r2;
      }
      function bnDivide(a) {
        var r2 = nbi();
        this.divRemTo(a, r2, null);
        return r2;
      }
      function bnRemainder(a) {
        var r2 = nbi();
        this.divRemTo(a, null, r2);
        return r2;
      }
      function bnDivideAndRemainder(a) {
        var q = nbi(), r2 = nbi();
        this.divRemTo(a, q, r2);
        return new Array(q, r2);
      }
      function bnpDMultiply(n) {
        this[this.t] = this.am(0, n - 1, this, 0, 0, this.t);
        ++this.t;
        this.clamp();
      }
      function bnpDAddOffset(n, w) {
        if (n == 0) return;
        while (this.t <= w) this[this.t++] = 0;
        this[w] += n;
        while (this[w] >= this.DV) {
          this[w] -= this.DV;
          if (++w >= this.t) this[this.t++] = 0;
          ++this[w];
        }
      }
      function NullExp() {
      }
      function nNop(x) {
        return x;
      }
      function nMulTo(x, y, r2) {
        x.multiplyTo(y, r2);
      }
      function nSqrTo(x, r2) {
        x.squareTo(r2);
      }
      NullExp.prototype.convert = nNop;
      NullExp.prototype.revert = nNop;
      NullExp.prototype.mulTo = nMulTo;
      NullExp.prototype.sqrTo = nSqrTo;
      function bnPow(e) {
        return this.exp(e, new NullExp());
      }
      function bnpMultiplyLowerTo(a, n, r2) {
        var i = Math.min(this.t + a.t, n);
        r2.s = 0;
        r2.t = i;
        while (i > 0) r2[--i] = 0;
        var j;
        for (j = r2.t - this.t; i < j; ++i) r2[i + this.t] = this.am(0, a[i], r2, i, 0, this.t);
        for (j = Math.min(a.t, n); i < j; ++i) this.am(0, a[i], r2, i, 0, n - i);
        r2.clamp();
      }
      function bnpMultiplyUpperTo(a, n, r2) {
        --n;
        var i = r2.t = this.t + a.t - n;
        r2.s = 0;
        while (--i >= 0) r2[i] = 0;
        for (i = Math.max(n - this.t, 0); i < a.t; ++i)
          r2[this.t + i - n] = this.am(n - i, a[i], r2, 0, 0, this.t + i - n);
        r2.clamp();
        r2.drShiftTo(1, r2);
      }
      function Barrett(m) {
        this.r2 = nbi();
        this.q3 = nbi();
        BigInteger.ONE.dlShiftTo(2 * m.t, this.r2);
        this.mu = this.r2.divide(m);
        this.m = m;
      }
      function barrettConvert(x) {
        if (x.s < 0 || x.t > 2 * this.m.t) return x.mod(this.m);
        else if (x.compareTo(this.m) < 0) return x;
        else {
          var r2 = nbi();
          x.copyTo(r2);
          this.reduce(r2);
          return r2;
        }
      }
      function barrettRevert(x) {
        return x;
      }
      function barrettReduce(x) {
        x.drShiftTo(this.m.t - 1, this.r2);
        if (x.t > this.m.t + 1) {
          x.t = this.m.t + 1;
          x.clamp();
        }
        this.mu.multiplyUpperTo(this.r2, this.m.t + 1, this.q3);
        this.m.multiplyLowerTo(this.q3, this.m.t + 1, this.r2);
        while (x.compareTo(this.r2) < 0) x.dAddOffset(1, this.m.t + 1);
        x.subTo(this.r2, x);
        while (x.compareTo(this.m) >= 0) x.subTo(this.m, x);
      }
      function barrettSqrTo(x, r2) {
        x.squareTo(r2);
        this.reduce(r2);
      }
      function barrettMulTo(x, y, r2) {
        x.multiplyTo(y, r2);
        this.reduce(r2);
      }
      Barrett.prototype.convert = barrettConvert;
      Barrett.prototype.revert = barrettRevert;
      Barrett.prototype.reduce = barrettReduce;
      Barrett.prototype.mulTo = barrettMulTo;
      Barrett.prototype.sqrTo = barrettSqrTo;
      function bnModPow(e, m) {
        var i = e.bitLength(), k, r2 = nbv(1), z;
        if (i <= 0) return r2;
        else if (i < 18) k = 1;
        else if (i < 48) k = 3;
        else if (i < 144) k = 4;
        else if (i < 768) k = 5;
        else k = 6;
        if (i < 8)
          z = new Classic(m);
        else if (m.isEven())
          z = new Barrett(m);
        else
          z = new Montgomery(m);
        var g2 = new Array(), n = 3, k1 = k - 1, km = (1 << k) - 1;
        g2[1] = z.convert(this);
        if (k > 1) {
          var g22 = nbi();
          z.sqrTo(g2[1], g22);
          while (n <= km) {
            g2[n] = nbi();
            z.mulTo(g22, g2[n - 2], g2[n]);
            n += 2;
          }
        }
        var j = e.t - 1, w, is1 = true, r22 = nbi(), t;
        i = nbits(e[j]) - 1;
        while (j >= 0) {
          if (i >= k1) w = e[j] >> i - k1 & km;
          else {
            w = (e[j] & (1 << i + 1) - 1) << k1 - i;
            if (j > 0) w |= e[j - 1] >> this.DB + i - k1;
          }
          n = k;
          while ((w & 1) == 0) {
            w >>= 1;
            --n;
          }
          if ((i -= n) < 0) {
            i += this.DB;
            --j;
          }
          if (is1) {
            g2[w].copyTo(r2);
            is1 = false;
          } else {
            while (n > 1) {
              z.sqrTo(r2, r22);
              z.sqrTo(r22, r2);
              n -= 2;
            }
            if (n > 0) z.sqrTo(r2, r22);
            else {
              t = r2;
              r2 = r22;
              r22 = t;
            }
            z.mulTo(r22, g2[w], r2);
          }
          while (j >= 0 && (e[j] & 1 << i) == 0) {
            z.sqrTo(r2, r22);
            t = r2;
            r2 = r22;
            r22 = t;
            if (--i < 0) {
              i = this.DB - 1;
              --j;
            }
          }
        }
        return z.revert(r2);
      }
      function bnGCD(a) {
        var x = this.s < 0 ? this.negate() : this.clone();
        var y = a.s < 0 ? a.negate() : a.clone();
        if (x.compareTo(y) < 0) {
          var t = x;
          x = y;
          y = t;
        }
        var i = x.getLowestSetBit(), g2 = y.getLowestSetBit();
        if (g2 < 0) return x;
        if (i < g2) g2 = i;
        if (g2 > 0) {
          x.rShiftTo(g2, x);
          y.rShiftTo(g2, y);
        }
        while (x.signum() > 0) {
          if ((i = x.getLowestSetBit()) > 0) x.rShiftTo(i, x);
          if ((i = y.getLowestSetBit()) > 0) y.rShiftTo(i, y);
          if (x.compareTo(y) >= 0) {
            x.subTo(y, x);
            x.rShiftTo(1, x);
          } else {
            y.subTo(x, y);
            y.rShiftTo(1, y);
          }
        }
        if (g2 > 0) y.lShiftTo(g2, y);
        return y;
      }
      function bnpModInt(n) {
        if (n <= 0) return 0;
        var d = this.DV % n, r2 = this.s < 0 ? n - 1 : 0;
        if (this.t > 0)
          if (d == 0) r2 = this[0] % n;
          else
            for (var i = this.t - 1; i >= 0; --i) r2 = (d * r2 + this[i]) % n;
        return r2;
      }
      function bnModInverse(m) {
        var ac = m.isEven();
        if (this.isEven() && ac || m.signum() == 0) return BigInteger.ZERO;
        var u = m.clone(), v = this.clone();
        var a = nbv(1), b2 = nbv(0), c = nbv(0), d = nbv(1);
        while (u.signum() != 0) {
          while (u.isEven()) {
            u.rShiftTo(1, u);
            if (ac) {
              if (!a.isEven() || !b2.isEven()) {
                a.addTo(this, a);
                b2.subTo(m, b2);
              }
              a.rShiftTo(1, a);
            } else if (!b2.isEven()) b2.subTo(m, b2);
            b2.rShiftTo(1, b2);
          }
          while (v.isEven()) {
            v.rShiftTo(1, v);
            if (ac) {
              if (!c.isEven() || !d.isEven()) {
                c.addTo(this, c);
                d.subTo(m, d);
              }
              c.rShiftTo(1, c);
            } else if (!d.isEven()) d.subTo(m, d);
            d.rShiftTo(1, d);
          }
          if (u.compareTo(v) >= 0) {
            u.subTo(v, u);
            if (ac) a.subTo(c, a);
            b2.subTo(d, b2);
          } else {
            v.subTo(u, v);
            if (ac) c.subTo(a, c);
            d.subTo(b2, d);
          }
        }
        if (v.compareTo(BigInteger.ONE) != 0) return BigInteger.ZERO;
        if (d.compareTo(m) >= 0) return d.subtract(m);
        if (d.signum() < 0) d.addTo(m, d);
        else return d;
        if (d.signum() < 0) return d.add(m);
        else return d;
      }
      var lowprimes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97, 101, 103, 107, 109, 113, 127, 131, 137, 139, 149, 151, 157, 163, 167, 173, 179, 181, 191, 193, 197, 199, 211, 223, 227, 229, 233, 239, 241, 251, 257, 263, 269, 271, 277, 281, 283, 293, 307, 311, 313, 317, 331, 337, 347, 349, 353, 359, 367, 373, 379, 383, 389, 397, 401, 409, 419, 421, 431, 433, 439, 443, 449, 457, 461, 463, 467, 479, 487, 491, 499, 503, 509, 521, 523, 541, 547, 557, 563, 569, 571, 577, 587, 593, 599, 601, 607, 613, 617, 619, 631, 641, 643, 647, 653, 659, 661, 673, 677, 683, 691, 701, 709, 719, 727, 733, 739, 743, 751, 757, 761, 769, 773, 787, 797, 809, 811, 821, 823, 827, 829, 839, 853, 857, 859, 863, 877, 881, 883, 887, 907, 911, 919, 929, 937, 941, 947, 953, 967, 971, 977, 983, 991, 997];
      var lplim = (1 << 26) / lowprimes[lowprimes.length - 1];
      function bnIsProbablePrime(t) {
        var i, x = this.abs();
        if (x.t == 1 && x[0] <= lowprimes[lowprimes.length - 1]) {
          for (i = 0; i < lowprimes.length; ++i)
            if (x[0] == lowprimes[i]) return true;
          return false;
        }
        if (x.isEven()) return false;
        i = 1;
        while (i < lowprimes.length) {
          var m = lowprimes[i], j = i + 1;
          while (j < lowprimes.length && m < lplim) m *= lowprimes[j++];
          m = x.modInt(m);
          while (i < j)
            if (m % lowprimes[i++] == 0) return false;
        }
        return x.millerRabin(t);
      }
      function bnpMillerRabin(t) {
        var n1 = this.subtract(BigInteger.ONE);
        var k = n1.getLowestSetBit();
        if (k <= 0) return false;
        var r2 = n1.shiftRight(k);
        t = t + 1 >> 1;
        if (t > lowprimes.length) t = lowprimes.length;
        var a = nbi();
        for (var i = 0; i < t; ++i) {
          a.fromInt(lowprimes[Math.floor(Math.random() * lowprimes.length)]);
          var y = a.modPow(r2, this);
          if (y.compareTo(BigInteger.ONE) != 0 && y.compareTo(n1) != 0) {
            var j = 1;
            while (j++ < k && y.compareTo(n1) != 0) {
              y = y.modPowInt(2, this);
              if (y.compareTo(BigInteger.ONE) == 0) return false;
            }
            if (y.compareTo(n1) != 0) return false;
          }
        }
        return true;
      }
      BigInteger.prototype.chunkSize = bnpChunkSize;
      BigInteger.prototype.toRadix = bnpToRadix;
      BigInteger.prototype.fromRadix = bnpFromRadix;
      BigInteger.prototype.fromNumber = bnpFromNumber;
      BigInteger.prototype.bitwiseTo = bnpBitwiseTo;
      BigInteger.prototype.changeBit = bnpChangeBit;
      BigInteger.prototype.addTo = bnpAddTo;
      BigInteger.prototype.dMultiply = bnpDMultiply;
      BigInteger.prototype.dAddOffset = bnpDAddOffset;
      BigInteger.prototype.multiplyLowerTo = bnpMultiplyLowerTo;
      BigInteger.prototype.multiplyUpperTo = bnpMultiplyUpperTo;
      BigInteger.prototype.modInt = bnpModInt;
      BigInteger.prototype.millerRabin = bnpMillerRabin;
      BigInteger.prototype.clone = bnClone;
      BigInteger.prototype.intValue = bnIntValue;
      BigInteger.prototype.byteValue = bnByteValue;
      BigInteger.prototype.shortValue = bnShortValue;
      BigInteger.prototype.signum = bnSigNum;
      BigInteger.prototype.toByteArray = bnToByteArray;
      BigInteger.prototype.equals = bnEquals;
      BigInteger.prototype.min = bnMin;
      BigInteger.prototype.max = bnMax;
      BigInteger.prototype.and = bnAnd;
      BigInteger.prototype.or = bnOr;
      BigInteger.prototype.xor = bnXor;
      BigInteger.prototype.andNot = bnAndNot;
      BigInteger.prototype.not = bnNot;
      BigInteger.prototype.shiftLeft = bnShiftLeft;
      BigInteger.prototype.shiftRight = bnShiftRight;
      BigInteger.prototype.getLowestSetBit = bnGetLowestSetBit;
      BigInteger.prototype.bitCount = bnBitCount;
      BigInteger.prototype.testBit = bnTestBit;
      BigInteger.prototype.setBit = bnSetBit;
      BigInteger.prototype.clearBit = bnClearBit;
      BigInteger.prototype.flipBit = bnFlipBit;
      BigInteger.prototype.add = bnAdd;
      BigInteger.prototype.subtract = bnSubtract;
      BigInteger.prototype.multiply = bnMultiply;
      BigInteger.prototype.divide = bnDivide;
      BigInteger.prototype.remainder = bnRemainder;
      BigInteger.prototype.divideAndRemainder = bnDivideAndRemainder;
      BigInteger.prototype.modPow = bnModPow;
      BigInteger.prototype.modInverse = bnModInverse;
      BigInteger.prototype.pow = bnPow;
      BigInteger.prototype.gcd = bnGCD;
      BigInteger.prototype.isProbablePrime = bnIsProbablePrime;
      BigInteger.prototype.square = bnSquare;
      var Int128 = BigInteger;
      Int128.prototype.IsNegative = function() {
        if (this.compareTo(Int128.ZERO) == -1) return true;
        else return false;
      };
      Int128.op_Equality = function(val1, val2) {
        if (val1.compareTo(val2) == 0) return true;
        else return false;
      };
      Int128.op_Inequality = function(val1, val2) {
        if (val1.compareTo(val2) != 0) return true;
        else return false;
      };
      Int128.op_GreaterThan = function(val1, val2) {
        if (val1.compareTo(val2) > 0) return true;
        else return false;
      };
      Int128.op_LessThan = function(val1, val2) {
        if (val1.compareTo(val2) < 0) return true;
        else return false;
      };
      Int128.op_Addition = function(lhs, rhs) {
        return new Int128(lhs, void 0, void 0).add(new Int128(rhs, void 0, void 0));
      };
      Int128.op_Subtraction = function(lhs, rhs) {
        return new Int128(lhs, void 0, void 0).subtract(new Int128(rhs, void 0, void 0));
      };
      Int128.Int128Mul = function(lhs, rhs) {
        return new Int128(lhs, void 0, void 0).multiply(new Int128(rhs, void 0, void 0));
      };
      Int128.op_Division = function(lhs, rhs) {
        return lhs.divide(rhs);
      };
      Int128.prototype.ToDouble = function() {
        return parseFloat(this.toString());
      };
      var Inherit = function(ce, ce2) {
        var p;
        if (typeof Object.getOwnPropertyNames === "undefined") {
          for (p in ce2.prototype)
            if (typeof ce.prototype[p] === "undefined" || ce.prototype[p] === Object.prototype[p]) ce.prototype[p] = ce2.prototype[p];
          for (p in ce2)
            if (typeof ce[p] === "undefined") ce[p] = ce2[p];
          ce.$baseCtor = ce2;
        } else {
          var props = Object.getOwnPropertyNames(ce2.prototype);
          for (var i = 0; i < props.length; i++)
            if (typeof Object.getOwnPropertyDescriptor(ce.prototype, props[i]) === "undefined") Object.defineProperty(ce.prototype, props[i], Object.getOwnPropertyDescriptor(ce2.prototype, props[i]));
          for (p in ce2)
            if (typeof ce[p] === "undefined") ce[p] = ce2[p];
          ce.$baseCtor = ce2;
        }
      };
      ClipperLib.Path = function() {
        return [];
      };
      ClipperLib.Path.prototype.push = Array.prototype.push;
      ClipperLib.Paths = function() {
        return [];
      };
      ClipperLib.Paths.prototype.push = Array.prototype.push;
      ClipperLib.DoublePoint = function() {
        var a = arguments;
        this.X = 0;
        this.Y = 0;
        if (a.length === 1) {
          this.X = a[0].X;
          this.Y = a[0].Y;
        } else if (a.length === 2) {
          this.X = a[0];
          this.Y = a[1];
        }
      };
      ClipperLib.DoublePoint0 = function() {
        this.X = 0;
        this.Y = 0;
      };
      ClipperLib.DoublePoint0.prototype = ClipperLib.DoublePoint.prototype;
      ClipperLib.DoublePoint1 = function(dp) {
        this.X = dp.X;
        this.Y = dp.Y;
      };
      ClipperLib.DoublePoint1.prototype = ClipperLib.DoublePoint.prototype;
      ClipperLib.DoublePoint2 = function(x, y) {
        this.X = x;
        this.Y = y;
      };
      ClipperLib.DoublePoint2.prototype = ClipperLib.DoublePoint.prototype;
      ClipperLib.PolyNode = function() {
        this.m_Parent = null;
        this.m_polygon = new ClipperLib.Path();
        this.m_Index = 0;
        this.m_jointype = 0;
        this.m_endtype = 0;
        this.m_Childs = [];
        this.IsOpen = false;
      };
      ClipperLib.PolyNode.prototype.IsHoleNode = function() {
        var result = true;
        var node = this.m_Parent;
        while (node !== null) {
          result = !result;
          node = node.m_Parent;
        }
        return result;
      };
      ClipperLib.PolyNode.prototype.ChildCount = function() {
        return this.m_Childs.length;
      };
      ClipperLib.PolyNode.prototype.Contour = function() {
        return this.m_polygon;
      };
      ClipperLib.PolyNode.prototype.AddChild = function(Child) {
        var cnt = this.m_Childs.length;
        this.m_Childs.push(Child);
        Child.m_Parent = this;
        Child.m_Index = cnt;
      };
      ClipperLib.PolyNode.prototype.GetNext = function() {
        if (this.m_Childs.length > 0)
          return this.m_Childs[0];
        else
          return this.GetNextSiblingUp();
      };
      ClipperLib.PolyNode.prototype.GetNextSiblingUp = function() {
        if (this.m_Parent === null)
          return null;
        else if (this.m_Index === this.m_Parent.m_Childs.length - 1)
          return this.m_Parent.GetNextSiblingUp();
        else
          return this.m_Parent.m_Childs[this.m_Index + 1];
      };
      ClipperLib.PolyNode.prototype.Childs = function() {
        return this.m_Childs;
      };
      ClipperLib.PolyNode.prototype.Parent = function() {
        return this.m_Parent;
      };
      ClipperLib.PolyNode.prototype.IsHole = function() {
        return this.IsHoleNode();
      };
      ClipperLib.PolyTree = function() {
        this.m_AllPolys = [];
        ClipperLib.PolyNode.call(this);
      };
      ClipperLib.PolyTree.prototype.Clear = function() {
        for (var i = 0, ilen = this.m_AllPolys.length; i < ilen; i++)
          this.m_AllPolys[i] = null;
        this.m_AllPolys.length = 0;
        this.m_Childs.length = 0;
      };
      ClipperLib.PolyTree.prototype.GetFirst = function() {
        if (this.m_Childs.length > 0)
          return this.m_Childs[0];
        else
          return null;
      };
      ClipperLib.PolyTree.prototype.Total = function() {
        var result = this.m_AllPolys.length;
        if (result > 0 && this.m_Childs[0] !== this.m_AllPolys[0]) result--;
        return result;
      };
      Inherit(ClipperLib.PolyTree, ClipperLib.PolyNode);
      ClipperLib.Math_Abs_Int64 = ClipperLib.Math_Abs_Int32 = ClipperLib.Math_Abs_Double = function(a) {
        return Math.abs(a);
      };
      ClipperLib.Math_Max_Int32_Int32 = function(a, b2) {
        return Math.max(a, b2);
      };
      if (browser.msie || browser.opera || browser.safari) ClipperLib.Cast_Int32 = function(a) {
        return a | 0;
      };
      else ClipperLib.Cast_Int32 = function(a) {
        return ~~a;
      };
      if (typeof Number.toInteger === "undefined")
        Number.toInteger = null;
      if (browser.chrome) ClipperLib.Cast_Int64 = function(a) {
        if (a < -2147483648 || a > 2147483647)
          return a < 0 ? Math.ceil(a) : Math.floor(a);
        else return ~~a;
      };
      else if (browser.firefox && typeof Number.toInteger === "function") ClipperLib.Cast_Int64 = function(a) {
        return Number.toInteger(a);
      };
      else if (browser.msie7 || browser.msie8) ClipperLib.Cast_Int64 = function(a) {
        return parseInt(a, 10);
      };
      else if (browser.msie) ClipperLib.Cast_Int64 = function(a) {
        if (a < -2147483648 || a > 2147483647)
          return a < 0 ? Math.ceil(a) : Math.floor(a);
        return a | 0;
      };
      else ClipperLib.Cast_Int64 = function(a) {
        return a < 0 ? Math.ceil(a) : Math.floor(a);
      };
      ClipperLib.Clear = function(a) {
        a.length = 0;
      };
      ClipperLib.PI = 3.141592653589793;
      ClipperLib.PI2 = 2 * 3.141592653589793;
      ClipperLib.IntPoint = function() {
        var a = arguments, alen = a.length;
        this.X = 0;
        this.Y = 0;
        if (ClipperLib.use_xyz) {
          this.Z = 0;
          if (alen === 3) {
            this.X = a[0];
            this.Y = a[1];
            this.Z = a[2];
          } else if (alen === 2) {
            this.X = a[0];
            this.Y = a[1];
            this.Z = 0;
          } else if (alen === 1) {
            if (a[0] instanceof ClipperLib.DoublePoint) {
              var dp = a[0];
              this.X = ClipperLib.Clipper.Round(dp.X);
              this.Y = ClipperLib.Clipper.Round(dp.Y);
              this.Z = 0;
            } else {
              var pt = a[0];
              if (typeof pt.Z === "undefined") pt.Z = 0;
              this.X = pt.X;
              this.Y = pt.Y;
              this.Z = pt.Z;
            }
          } else {
            this.X = 0;
            this.Y = 0;
            this.Z = 0;
          }
        } else {
          if (alen === 2) {
            this.X = a[0];
            this.Y = a[1];
          } else if (alen === 1) {
            if (a[0] instanceof ClipperLib.DoublePoint) {
              var dp = a[0];
              this.X = ClipperLib.Clipper.Round(dp.X);
              this.Y = ClipperLib.Clipper.Round(dp.Y);
            } else {
              var pt = a[0];
              this.X = pt.X;
              this.Y = pt.Y;
            }
          } else {
            this.X = 0;
            this.Y = 0;
          }
        }
      };
      ClipperLib.IntPoint.op_Equality = function(a, b2) {
        return a.X === b2.X && a.Y === b2.Y;
      };
      ClipperLib.IntPoint.op_Inequality = function(a, b2) {
        return a.X !== b2.X || a.Y !== b2.Y;
      };
      ClipperLib.IntPoint0 = function() {
        this.X = 0;
        this.Y = 0;
        if (ClipperLib.use_xyz)
          this.Z = 0;
      };
      ClipperLib.IntPoint0.prototype = ClipperLib.IntPoint.prototype;
      ClipperLib.IntPoint1 = function(pt) {
        this.X = pt.X;
        this.Y = pt.Y;
        if (ClipperLib.use_xyz) {
          if (typeof pt.Z === "undefined") this.Z = 0;
          else this.Z = pt.Z;
        }
      };
      ClipperLib.IntPoint1.prototype = ClipperLib.IntPoint.prototype;
      ClipperLib.IntPoint1dp = function(dp) {
        this.X = ClipperLib.Clipper.Round(dp.X);
        this.Y = ClipperLib.Clipper.Round(dp.Y);
        if (ClipperLib.use_xyz)
          this.Z = 0;
      };
      ClipperLib.IntPoint1dp.prototype = ClipperLib.IntPoint.prototype;
      ClipperLib.IntPoint2 = function(x, y, z) {
        this.X = x;
        this.Y = y;
        if (ClipperLib.use_xyz) {
          if (typeof z === "undefined") this.Z = 0;
          else this.Z = z;
        }
      };
      ClipperLib.IntPoint2.prototype = ClipperLib.IntPoint.prototype;
      ClipperLib.IntRect = function() {
        var a = arguments, alen = a.length;
        if (alen === 4) {
          this.left = a[0];
          this.top = a[1];
          this.right = a[2];
          this.bottom = a[3];
        } else if (alen === 1) {
          var ir = a[0];
          this.left = ir.left;
          this.top = ir.top;
          this.right = ir.right;
          this.bottom = ir.bottom;
        } else {
          this.left = 0;
          this.top = 0;
          this.right = 0;
          this.bottom = 0;
        }
      };
      ClipperLib.IntRect0 = function() {
        this.left = 0;
        this.top = 0;
        this.right = 0;
        this.bottom = 0;
      };
      ClipperLib.IntRect0.prototype = ClipperLib.IntRect.prototype;
      ClipperLib.IntRect1 = function(ir) {
        this.left = ir.left;
        this.top = ir.top;
        this.right = ir.right;
        this.bottom = ir.bottom;
      };
      ClipperLib.IntRect1.prototype = ClipperLib.IntRect.prototype;
      ClipperLib.IntRect4 = function(l, t, r2, b2) {
        this.left = l;
        this.top = t;
        this.right = r2;
        this.bottom = b2;
      };
      ClipperLib.IntRect4.prototype = ClipperLib.IntRect.prototype;
      ClipperLib.ClipType = {
        ctIntersection: 0,
        ctUnion: 1,
        ctDifference: 2,
        ctXor: 3
      };
      ClipperLib.PolyType = {
        ptSubject: 0,
        ptClip: 1
      };
      ClipperLib.PolyFillType = {
        pftEvenOdd: 0,
        pftNonZero: 1,
        pftPositive: 2,
        pftNegative: 3
      };
      ClipperLib.JoinType = {
        jtSquare: 0,
        jtRound: 1,
        jtMiter: 2
      };
      ClipperLib.EndType = {
        etOpenSquare: 0,
        etOpenRound: 1,
        etOpenButt: 2,
        etClosedLine: 3,
        etClosedPolygon: 4
      };
      ClipperLib.EdgeSide = {
        esLeft: 0,
        esRight: 1
      };
      ClipperLib.Direction = {
        dRightToLeft: 0,
        dLeftToRight: 1
      };
      ClipperLib.TEdge = function() {
        this.Bot = new ClipperLib.IntPoint0();
        this.Curr = new ClipperLib.IntPoint0();
        this.Top = new ClipperLib.IntPoint0();
        this.Delta = new ClipperLib.IntPoint0();
        this.Dx = 0;
        this.PolyTyp = ClipperLib.PolyType.ptSubject;
        this.Side = ClipperLib.EdgeSide.esLeft;
        this.WindDelta = 0;
        this.WindCnt = 0;
        this.WindCnt2 = 0;
        this.OutIdx = 0;
        this.Next = null;
        this.Prev = null;
        this.NextInLML = null;
        this.NextInAEL = null;
        this.PrevInAEL = null;
        this.NextInSEL = null;
        this.PrevInSEL = null;
      };
      ClipperLib.IntersectNode = function() {
        this.Edge1 = null;
        this.Edge2 = null;
        this.Pt = new ClipperLib.IntPoint0();
      };
      ClipperLib.MyIntersectNodeSort = function() {
      };
      ClipperLib.MyIntersectNodeSort.Compare = function(node1, node2) {
        var i = node2.Pt.Y - node1.Pt.Y;
        if (i > 0) return 1;
        else if (i < 0) return -1;
        else return 0;
      };
      ClipperLib.LocalMinima = function() {
        this.Y = 0;
        this.LeftBound = null;
        this.RightBound = null;
        this.Next = null;
      };
      ClipperLib.Scanbeam = function() {
        this.Y = 0;
        this.Next = null;
      };
      ClipperLib.Maxima = function() {
        this.X = 0;
        this.Next = null;
        this.Prev = null;
      };
      ClipperLib.OutRec = function() {
        this.Idx = 0;
        this.IsHole = false;
        this.IsOpen = false;
        this.FirstLeft = null;
        this.Pts = null;
        this.BottomPt = null;
        this.PolyNode = null;
      };
      ClipperLib.OutPt = function() {
        this.Idx = 0;
        this.Pt = new ClipperLib.IntPoint0();
        this.Next = null;
        this.Prev = null;
      };
      ClipperLib.Join = function() {
        this.OutPt1 = null;
        this.OutPt2 = null;
        this.OffPt = new ClipperLib.IntPoint0();
      };
      ClipperLib.ClipperBase = function() {
        this.m_MinimaList = null;
        this.m_CurrentLM = null;
        this.m_edges = new Array();
        this.m_UseFullRange = false;
        this.m_HasOpenPaths = false;
        this.PreserveCollinear = false;
        this.m_Scanbeam = null;
        this.m_PolyOuts = null;
        this.m_ActiveEdges = null;
      };
      ClipperLib.ClipperBase.horizontal = -9007199254740992;
      ClipperLib.ClipperBase.Skip = -2;
      ClipperLib.ClipperBase.Unassigned = -1;
      ClipperLib.ClipperBase.tolerance = 1e-20;
      ClipperLib.ClipperBase.loRange = 47453132;
      ClipperLib.ClipperBase.hiRange = 4503599627370495;
      ClipperLib.ClipperBase.near_zero = function(val) {
        return val > -ClipperLib.ClipperBase.tolerance && val < ClipperLib.ClipperBase.tolerance;
      };
      ClipperLib.ClipperBase.IsHorizontal = function(e) {
        return e.Delta.Y === 0;
      };
      ClipperLib.ClipperBase.prototype.PointIsVertex = function(pt, pp) {
        var pp2 = pp;
        do {
          if (ClipperLib.IntPoint.op_Equality(pp2.Pt, pt))
            return true;
          pp2 = pp2.Next;
        } while (pp2 !== pp);
        return false;
      };
      ClipperLib.ClipperBase.prototype.PointOnLineSegment = function(pt, linePt1, linePt2, UseFullRange) {
        if (UseFullRange)
          return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && Int128.op_Equality(
            Int128.Int128Mul(pt.X - linePt1.X, linePt2.Y - linePt1.Y),
            Int128.Int128Mul(linePt2.X - linePt1.X, pt.Y - linePt1.Y)
          );
        else
          return pt.X === linePt1.X && pt.Y === linePt1.Y || pt.X === linePt2.X && pt.Y === linePt2.Y || pt.X > linePt1.X === pt.X < linePt2.X && pt.Y > linePt1.Y === pt.Y < linePt2.Y && (pt.X - linePt1.X) * (linePt2.Y - linePt1.Y) === (linePt2.X - linePt1.X) * (pt.Y - linePt1.Y);
      };
      ClipperLib.ClipperBase.prototype.PointOnPolygon = function(pt, pp, UseFullRange) {
        var pp2 = pp;
        while (true) {
          if (this.PointOnLineSegment(pt, pp2.Pt, pp2.Next.Pt, UseFullRange))
            return true;
          pp2 = pp2.Next;
          if (pp2 === pp)
            break;
        }
        return false;
      };
      ClipperLib.ClipperBase.prototype.SlopesEqual = ClipperLib.ClipperBase.SlopesEqual = function() {
        var a = arguments, alen = a.length;
        var e1, e2, pt1, pt2, pt3, pt4, UseFullRange;
        if (alen === 3) {
          e1 = a[0];
          e2 = a[1];
          UseFullRange = a[2];
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
          else
            return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
        } else if (alen === 4) {
          pt1 = a[0];
          pt2 = a[1];
          pt3 = a[2];
          UseFullRange = a[3];
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
          else
            return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
        } else {
          pt1 = a[0];
          pt2 = a[1];
          pt3 = a[2];
          pt4 = a[3];
          UseFullRange = a[4];
          if (UseFullRange)
            return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
          else
            return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
        }
      };
      ClipperLib.ClipperBase.SlopesEqual3 = function(e1, e2, UseFullRange) {
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(e1.Delta.Y, e2.Delta.X), Int128.Int128Mul(e1.Delta.X, e2.Delta.Y));
        else
          return ClipperLib.Cast_Int64(e1.Delta.Y * e2.Delta.X) === ClipperLib.Cast_Int64(e1.Delta.X * e2.Delta.Y);
      };
      ClipperLib.ClipperBase.SlopesEqual4 = function(pt1, pt2, pt3, UseFullRange) {
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt2.X - pt3.X), Int128.Int128Mul(pt1.X - pt2.X, pt2.Y - pt3.Y));
        else
          return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt2.X - pt3.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt2.Y - pt3.Y)) === 0;
      };
      ClipperLib.ClipperBase.SlopesEqual5 = function(pt1, pt2, pt3, pt4, UseFullRange) {
        if (UseFullRange)
          return Int128.op_Equality(Int128.Int128Mul(pt1.Y - pt2.Y, pt3.X - pt4.X), Int128.Int128Mul(pt1.X - pt2.X, pt3.Y - pt4.Y));
        else
          return ClipperLib.Cast_Int64((pt1.Y - pt2.Y) * (pt3.X - pt4.X)) - ClipperLib.Cast_Int64((pt1.X - pt2.X) * (pt3.Y - pt4.Y)) === 0;
      };
      ClipperLib.ClipperBase.prototype.Clear = function() {
        this.DisposeLocalMinimaList();
        for (var i = 0, ilen = this.m_edges.length; i < ilen; ++i) {
          for (var j = 0, jlen = this.m_edges[i].length; j < jlen; ++j)
            this.m_edges[i][j] = null;
          ClipperLib.Clear(this.m_edges[i]);
        }
        ClipperLib.Clear(this.m_edges);
        this.m_UseFullRange = false;
        this.m_HasOpenPaths = false;
      };
      ClipperLib.ClipperBase.prototype.DisposeLocalMinimaList = function() {
        while (this.m_MinimaList !== null) {
          var tmpLm = this.m_MinimaList.Next;
          this.m_MinimaList = null;
          this.m_MinimaList = tmpLm;
        }
        this.m_CurrentLM = null;
      };
      ClipperLib.ClipperBase.prototype.RangeTest = function(Pt, useFullRange) {
        if (useFullRange.Value) {
          if (Pt.X > ClipperLib.ClipperBase.hiRange || Pt.Y > ClipperLib.ClipperBase.hiRange || -Pt.X > ClipperLib.ClipperBase.hiRange || -Pt.Y > ClipperLib.ClipperBase.hiRange)
            ClipperLib.Error("Coordinate outside allowed range in RangeTest().");
        } else if (Pt.X > ClipperLib.ClipperBase.loRange || Pt.Y > ClipperLib.ClipperBase.loRange || -Pt.X > ClipperLib.ClipperBase.loRange || -Pt.Y > ClipperLib.ClipperBase.loRange) {
          useFullRange.Value = true;
          this.RangeTest(Pt, useFullRange);
        }
      };
      ClipperLib.ClipperBase.prototype.InitEdge = function(e, eNext, ePrev, pt) {
        e.Next = eNext;
        e.Prev = ePrev;
        e.Curr.X = pt.X;
        e.Curr.Y = pt.Y;
        if (ClipperLib.use_xyz) e.Curr.Z = pt.Z;
        e.OutIdx = -1;
      };
      ClipperLib.ClipperBase.prototype.InitEdge2 = function(e, polyType) {
        if (e.Curr.Y >= e.Next.Curr.Y) {
          e.Bot.X = e.Curr.X;
          e.Bot.Y = e.Curr.Y;
          if (ClipperLib.use_xyz) e.Bot.Z = e.Curr.Z;
          e.Top.X = e.Next.Curr.X;
          e.Top.Y = e.Next.Curr.Y;
          if (ClipperLib.use_xyz) e.Top.Z = e.Next.Curr.Z;
        } else {
          e.Top.X = e.Curr.X;
          e.Top.Y = e.Curr.Y;
          if (ClipperLib.use_xyz) e.Top.Z = e.Curr.Z;
          e.Bot.X = e.Next.Curr.X;
          e.Bot.Y = e.Next.Curr.Y;
          if (ClipperLib.use_xyz) e.Bot.Z = e.Next.Curr.Z;
        }
        this.SetDx(e);
        e.PolyTyp = polyType;
      };
      ClipperLib.ClipperBase.prototype.FindNextLocMin = function(E) {
        var E2;
        for (; ; ) {
          while (ClipperLib.IntPoint.op_Inequality(E.Bot, E.Prev.Bot) || ClipperLib.IntPoint.op_Equality(E.Curr, E.Top))
            E = E.Next;
          if (E.Dx !== ClipperLib.ClipperBase.horizontal && E.Prev.Dx !== ClipperLib.ClipperBase.horizontal)
            break;
          while (E.Prev.Dx === ClipperLib.ClipperBase.horizontal)
            E = E.Prev;
          E2 = E;
          while (E.Dx === ClipperLib.ClipperBase.horizontal)
            E = E.Next;
          if (E.Top.Y === E.Prev.Bot.Y)
            continue;
          if (E2.Prev.Bot.X < E.Bot.X)
            E = E2;
          break;
        }
        return E;
      };
      ClipperLib.ClipperBase.prototype.ProcessBound = function(E, LeftBoundIsForward) {
        var EStart;
        var Result = E;
        var Horz;
        if (Result.OutIdx === ClipperLib.ClipperBase.Skip) {
          E = Result;
          if (LeftBoundIsForward) {
            while (E.Top.Y === E.Next.Bot.Y) E = E.Next;
            while (E !== Result && E.Dx === ClipperLib.ClipperBase.horizontal) E = E.Prev;
          } else {
            while (E.Top.Y === E.Prev.Bot.Y) E = E.Prev;
            while (E !== Result && E.Dx === ClipperLib.ClipperBase.horizontal) E = E.Next;
          }
          if (E === Result) {
            if (LeftBoundIsForward) Result = E.Next;
            else Result = E.Prev;
          } else {
            if (LeftBoundIsForward)
              E = Result.Next;
            else
              E = Result.Prev;
            var locMin = new ClipperLib.LocalMinima();
            locMin.Next = null;
            locMin.Y = E.Bot.Y;
            locMin.LeftBound = null;
            locMin.RightBound = E;
            E.WindDelta = 0;
            Result = this.ProcessBound(E, LeftBoundIsForward);
            this.InsertLocalMinima(locMin);
          }
          return Result;
        }
        if (E.Dx === ClipperLib.ClipperBase.horizontal) {
          if (LeftBoundIsForward) EStart = E.Prev;
          else EStart = E.Next;
          if (EStart.Dx === ClipperLib.ClipperBase.horizontal) {
            if (EStart.Bot.X !== E.Bot.X && EStart.Top.X !== E.Bot.X)
              this.ReverseHorizontal(E);
          } else if (EStart.Bot.X !== E.Bot.X)
            this.ReverseHorizontal(E);
        }
        EStart = E;
        if (LeftBoundIsForward) {
          while (Result.Top.Y === Result.Next.Bot.Y && Result.Next.OutIdx !== ClipperLib.ClipperBase.Skip)
            Result = Result.Next;
          if (Result.Dx === ClipperLib.ClipperBase.horizontal && Result.Next.OutIdx !== ClipperLib.ClipperBase.Skip) {
            Horz = Result;
            while (Horz.Prev.Dx === ClipperLib.ClipperBase.horizontal)
              Horz = Horz.Prev;
            if (Horz.Prev.Top.X > Result.Next.Top.X)
              Result = Horz.Prev;
          }
          while (E !== Result) {
            E.NextInLML = E.Next;
            if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
              this.ReverseHorizontal(E);
            E = E.Next;
          }
          if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Prev.Top.X)
            this.ReverseHorizontal(E);
          Result = Result.Next;
        } else {
          while (Result.Top.Y === Result.Prev.Bot.Y && Result.Prev.OutIdx !== ClipperLib.ClipperBase.Skip)
            Result = Result.Prev;
          if (Result.Dx === ClipperLib.ClipperBase.horizontal && Result.Prev.OutIdx !== ClipperLib.ClipperBase.Skip) {
            Horz = Result;
            while (Horz.Next.Dx === ClipperLib.ClipperBase.horizontal)
              Horz = Horz.Next;
            if (Horz.Next.Top.X === Result.Prev.Top.X || Horz.Next.Top.X > Result.Prev.Top.X) {
              Result = Horz.Next;
            }
          }
          while (E !== Result) {
            E.NextInLML = E.Prev;
            if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
              this.ReverseHorizontal(E);
            E = E.Prev;
          }
          if (E.Dx === ClipperLib.ClipperBase.horizontal && E !== EStart && E.Bot.X !== E.Next.Top.X)
            this.ReverseHorizontal(E);
          Result = Result.Prev;
        }
        return Result;
      };
      ClipperLib.ClipperBase.prototype.AddPath = function(pg, polyType, Closed) {
        if (ClipperLib.use_lines) {
          if (!Closed && polyType === ClipperLib.PolyType.ptClip)
            ClipperLib.Error("AddPath: Open paths must be subject.");
        } else {
          if (!Closed)
            ClipperLib.Error("AddPath: Open paths have been disabled.");
        }
        var highI = pg.length - 1;
        if (Closed)
          while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[0]))
            --highI;
        while (highI > 0 && ClipperLib.IntPoint.op_Equality(pg[highI], pg[highI - 1]))
          --highI;
        if (Closed && highI < 2 || !Closed && highI < 1)
          return false;
        var edges = new Array();
        for (var i = 0; i <= highI; i++)
          edges.push(new ClipperLib.TEdge());
        var IsFlat = true;
        edges[1].Curr.X = pg[1].X;
        edges[1].Curr.Y = pg[1].Y;
        if (ClipperLib.use_xyz) edges[1].Curr.Z = pg[1].Z;
        var $1 = {
          Value: this.m_UseFullRange
        };
        this.RangeTest(pg[0], $1);
        this.m_UseFullRange = $1.Value;
        $1.Value = this.m_UseFullRange;
        this.RangeTest(pg[highI], $1);
        this.m_UseFullRange = $1.Value;
        this.InitEdge(edges[0], edges[1], edges[highI], pg[0]);
        this.InitEdge(edges[highI], edges[0], edges[highI - 1], pg[highI]);
        for (var i = highI - 1; i >= 1; --i) {
          $1.Value = this.m_UseFullRange;
          this.RangeTest(pg[i], $1);
          this.m_UseFullRange = $1.Value;
          this.InitEdge(edges[i], edges[i + 1], edges[i - 1], pg[i]);
        }
        var eStart = edges[0];
        var E = eStart, eLoopStop = eStart;
        for (; ; ) {
          if (E.Curr === E.Next.Curr && (Closed || E.Next !== eStart)) {
            if (E === E.Next)
              break;
            if (E === eStart)
              eStart = E.Next;
            E = this.RemoveEdge(E);
            eLoopStop = E;
            continue;
          }
          if (E.Prev === E.Next)
            break;
          else if (Closed && ClipperLib.ClipperBase.SlopesEqual4(E.Prev.Curr, E.Curr, E.Next.Curr, this.m_UseFullRange) && (!this.PreserveCollinear || !this.Pt2IsBetweenPt1AndPt3(E.Prev.Curr, E.Curr, E.Next.Curr))) {
            if (E === eStart)
              eStart = E.Next;
            E = this.RemoveEdge(E);
            E = E.Prev;
            eLoopStop = E;
            continue;
          }
          E = E.Next;
          if (E === eLoopStop || !Closed && E.Next === eStart) break;
        }
        if (!Closed && E === E.Next || Closed && E.Prev === E.Next)
          return false;
        if (!Closed) {
          this.m_HasOpenPaths = true;
          eStart.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
        }
        E = eStart;
        do {
          this.InitEdge2(E, polyType);
          E = E.Next;
          if (IsFlat && E.Curr.Y !== eStart.Curr.Y)
            IsFlat = false;
        } while (E !== eStart);
        if (IsFlat) {
          if (Closed)
            return false;
          E.Prev.OutIdx = ClipperLib.ClipperBase.Skip;
          var locMin = new ClipperLib.LocalMinima();
          locMin.Next = null;
          locMin.Y = E.Bot.Y;
          locMin.LeftBound = null;
          locMin.RightBound = E;
          locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
          locMin.RightBound.WindDelta = 0;
          for (; ; ) {
            if (E.Bot.X !== E.Prev.Top.X) this.ReverseHorizontal(E);
            if (E.Next.OutIdx === ClipperLib.ClipperBase.Skip) break;
            E.NextInLML = E.Next;
            E = E.Next;
          }
          this.InsertLocalMinima(locMin);
          this.m_edges.push(edges);
          return true;
        }
        this.m_edges.push(edges);
        var leftBoundIsForward;
        var EMin = null;
        if (ClipperLib.IntPoint.op_Equality(E.Prev.Bot, E.Prev.Top))
          E = E.Next;
        for (; ; ) {
          E = this.FindNextLocMin(E);
          if (E === EMin)
            break;
          else if (EMin === null)
            EMin = E;
          var locMin = new ClipperLib.LocalMinima();
          locMin.Next = null;
          locMin.Y = E.Bot.Y;
          if (E.Dx < E.Prev.Dx) {
            locMin.LeftBound = E.Prev;
            locMin.RightBound = E;
            leftBoundIsForward = false;
          } else {
            locMin.LeftBound = E;
            locMin.RightBound = E.Prev;
            leftBoundIsForward = true;
          }
          locMin.LeftBound.Side = ClipperLib.EdgeSide.esLeft;
          locMin.RightBound.Side = ClipperLib.EdgeSide.esRight;
          if (!Closed)
            locMin.LeftBound.WindDelta = 0;
          else if (locMin.LeftBound.Next === locMin.RightBound)
            locMin.LeftBound.WindDelta = -1;
          else
            locMin.LeftBound.WindDelta = 1;
          locMin.RightBound.WindDelta = -locMin.LeftBound.WindDelta;
          E = this.ProcessBound(locMin.LeftBound, leftBoundIsForward);
          if (E.OutIdx === ClipperLib.ClipperBase.Skip)
            E = this.ProcessBound(E, leftBoundIsForward);
          var E2 = this.ProcessBound(locMin.RightBound, !leftBoundIsForward);
          if (E2.OutIdx === ClipperLib.ClipperBase.Skip) E2 = this.ProcessBound(E2, !leftBoundIsForward);
          if (locMin.LeftBound.OutIdx === ClipperLib.ClipperBase.Skip)
            locMin.LeftBound = null;
          else if (locMin.RightBound.OutIdx === ClipperLib.ClipperBase.Skip)
            locMin.RightBound = null;
          this.InsertLocalMinima(locMin);
          if (!leftBoundIsForward)
            E = E2;
        }
        return true;
      };
      ClipperLib.ClipperBase.prototype.AddPaths = function(ppg, polyType, closed) {
        var result = false;
        for (var i = 0, ilen = ppg.length; i < ilen; ++i)
          if (this.AddPath(ppg[i], polyType, closed))
            result = true;
        return result;
      };
      ClipperLib.ClipperBase.prototype.Pt2IsBetweenPt1AndPt3 = function(pt1, pt2, pt3) {
        if (ClipperLib.IntPoint.op_Equality(pt1, pt3) || ClipperLib.IntPoint.op_Equality(pt1, pt2) || ClipperLib.IntPoint.op_Equality(pt3, pt2))
          return false;
        else if (pt1.X !== pt3.X)
          return pt2.X > pt1.X === pt2.X < pt3.X;
        else
          return pt2.Y > pt1.Y === pt2.Y < pt3.Y;
      };
      ClipperLib.ClipperBase.prototype.RemoveEdge = function(e) {
        e.Prev.Next = e.Next;
        e.Next.Prev = e.Prev;
        var result = e.Next;
        e.Prev = null;
        return result;
      };
      ClipperLib.ClipperBase.prototype.SetDx = function(e) {
        e.Delta.X = e.Top.X - e.Bot.X;
        e.Delta.Y = e.Top.Y - e.Bot.Y;
        if (e.Delta.Y === 0) e.Dx = ClipperLib.ClipperBase.horizontal;
        else e.Dx = e.Delta.X / e.Delta.Y;
      };
      ClipperLib.ClipperBase.prototype.InsertLocalMinima = function(newLm) {
        if (this.m_MinimaList === null) {
          this.m_MinimaList = newLm;
        } else if (newLm.Y >= this.m_MinimaList.Y) {
          newLm.Next = this.m_MinimaList;
          this.m_MinimaList = newLm;
        } else {
          var tmpLm = this.m_MinimaList;
          while (tmpLm.Next !== null && newLm.Y < tmpLm.Next.Y)
            tmpLm = tmpLm.Next;
          newLm.Next = tmpLm.Next;
          tmpLm.Next = newLm;
        }
      };
      ClipperLib.ClipperBase.prototype.PopLocalMinima = function(Y, current) {
        current.v = this.m_CurrentLM;
        if (this.m_CurrentLM !== null && this.m_CurrentLM.Y === Y) {
          this.m_CurrentLM = this.m_CurrentLM.Next;
          return true;
        }
        return false;
      };
      ClipperLib.ClipperBase.prototype.ReverseHorizontal = function(e) {
        var tmp = e.Top.X;
        e.Top.X = e.Bot.X;
        e.Bot.X = tmp;
        if (ClipperLib.use_xyz) {
          tmp = e.Top.Z;
          e.Top.Z = e.Bot.Z;
          e.Bot.Z = tmp;
        }
      };
      ClipperLib.ClipperBase.prototype.Reset = function() {
        this.m_CurrentLM = this.m_MinimaList;
        if (this.m_CurrentLM === null)
          return;
        this.m_Scanbeam = null;
        var lm = this.m_MinimaList;
        while (lm !== null) {
          this.InsertScanbeam(lm.Y);
          var e = lm.LeftBound;
          if (e !== null) {
            e.Curr.X = e.Bot.X;
            e.Curr.Y = e.Bot.Y;
            if (ClipperLib.use_xyz) e.Curr.Z = e.Bot.Z;
            e.OutIdx = ClipperLib.ClipperBase.Unassigned;
          }
          e = lm.RightBound;
          if (e !== null) {
            e.Curr.X = e.Bot.X;
            e.Curr.Y = e.Bot.Y;
            if (ClipperLib.use_xyz) e.Curr.Z = e.Bot.Z;
            e.OutIdx = ClipperLib.ClipperBase.Unassigned;
          }
          lm = lm.Next;
        }
        this.m_ActiveEdges = null;
      };
      ClipperLib.ClipperBase.prototype.InsertScanbeam = function(Y) {
        if (this.m_Scanbeam === null) {
          this.m_Scanbeam = new ClipperLib.Scanbeam();
          this.m_Scanbeam.Next = null;
          this.m_Scanbeam.Y = Y;
        } else if (Y > this.m_Scanbeam.Y) {
          var newSb = new ClipperLib.Scanbeam();
          newSb.Y = Y;
          newSb.Next = this.m_Scanbeam;
          this.m_Scanbeam = newSb;
        } else {
          var sb2 = this.m_Scanbeam;
          while (sb2.Next !== null && Y <= sb2.Next.Y) {
            sb2 = sb2.Next;
          }
          if (Y === sb2.Y) {
            return;
          }
          var newSb1 = new ClipperLib.Scanbeam();
          newSb1.Y = Y;
          newSb1.Next = sb2.Next;
          sb2.Next = newSb1;
        }
      };
      ClipperLib.ClipperBase.prototype.PopScanbeam = function(Y) {
        if (this.m_Scanbeam === null) {
          Y.v = 0;
          return false;
        }
        Y.v = this.m_Scanbeam.Y;
        this.m_Scanbeam = this.m_Scanbeam.Next;
        return true;
      };
      ClipperLib.ClipperBase.prototype.LocalMinimaPending = function() {
        return this.m_CurrentLM !== null;
      };
      ClipperLib.ClipperBase.prototype.CreateOutRec = function() {
        var result = new ClipperLib.OutRec();
        result.Idx = ClipperLib.ClipperBase.Unassigned;
        result.IsHole = false;
        result.IsOpen = false;
        result.FirstLeft = null;
        result.Pts = null;
        result.BottomPt = null;
        result.PolyNode = null;
        this.m_PolyOuts.push(result);
        result.Idx = this.m_PolyOuts.length - 1;
        return result;
      };
      ClipperLib.ClipperBase.prototype.DisposeOutRec = function(index) {
        var outRec = this.m_PolyOuts[index];
        outRec.Pts = null;
        outRec = null;
        this.m_PolyOuts[index] = null;
      };
      ClipperLib.ClipperBase.prototype.UpdateEdgeIntoAEL = function(e) {
        if (e.NextInLML === null) {
          ClipperLib.Error("UpdateEdgeIntoAEL: invalid call");
        }
        var AelPrev = e.PrevInAEL;
        var AelNext = e.NextInAEL;
        e.NextInLML.OutIdx = e.OutIdx;
        if (AelPrev !== null) {
          AelPrev.NextInAEL = e.NextInLML;
        } else {
          this.m_ActiveEdges = e.NextInLML;
        }
        if (AelNext !== null) {
          AelNext.PrevInAEL = e.NextInLML;
        }
        e.NextInLML.Side = e.Side;
        e.NextInLML.WindDelta = e.WindDelta;
        e.NextInLML.WindCnt = e.WindCnt;
        e.NextInLML.WindCnt2 = e.WindCnt2;
        e = e.NextInLML;
        e.Curr.X = e.Bot.X;
        e.Curr.Y = e.Bot.Y;
        e.PrevInAEL = AelPrev;
        e.NextInAEL = AelNext;
        if (!ClipperLib.ClipperBase.IsHorizontal(e)) {
          this.InsertScanbeam(e.Top.Y);
        }
        return e;
      };
      ClipperLib.ClipperBase.prototype.SwapPositionsInAEL = function(edge1, edge2) {
        if (edge1.NextInAEL === edge1.PrevInAEL || edge2.NextInAEL === edge2.PrevInAEL) {
          return;
        }
        if (edge1.NextInAEL === edge2) {
          var next = edge2.NextInAEL;
          if (next !== null) {
            next.PrevInAEL = edge1;
          }
          var prev = edge1.PrevInAEL;
          if (prev !== null) {
            prev.NextInAEL = edge2;
          }
          edge2.PrevInAEL = prev;
          edge2.NextInAEL = edge1;
          edge1.PrevInAEL = edge2;
          edge1.NextInAEL = next;
        } else if (edge2.NextInAEL === edge1) {
          var next1 = edge1.NextInAEL;
          if (next1 !== null) {
            next1.PrevInAEL = edge2;
          }
          var prev1 = edge2.PrevInAEL;
          if (prev1 !== null) {
            prev1.NextInAEL = edge1;
          }
          edge1.PrevInAEL = prev1;
          edge1.NextInAEL = edge2;
          edge2.PrevInAEL = edge1;
          edge2.NextInAEL = next1;
        } else {
          var next2 = edge1.NextInAEL;
          var prev2 = edge1.PrevInAEL;
          edge1.NextInAEL = edge2.NextInAEL;
          if (edge1.NextInAEL !== null) {
            edge1.NextInAEL.PrevInAEL = edge1;
          }
          edge1.PrevInAEL = edge2.PrevInAEL;
          if (edge1.PrevInAEL !== null) {
            edge1.PrevInAEL.NextInAEL = edge1;
          }
          edge2.NextInAEL = next2;
          if (edge2.NextInAEL !== null) {
            edge2.NextInAEL.PrevInAEL = edge2;
          }
          edge2.PrevInAEL = prev2;
          if (edge2.PrevInAEL !== null) {
            edge2.PrevInAEL.NextInAEL = edge2;
          }
        }
        if (edge1.PrevInAEL === null) {
          this.m_ActiveEdges = edge1;
        } else {
          if (edge2.PrevInAEL === null) {
            this.m_ActiveEdges = edge2;
          }
        }
      };
      ClipperLib.ClipperBase.prototype.DeleteFromAEL = function(e) {
        var AelPrev = e.PrevInAEL;
        var AelNext = e.NextInAEL;
        if (AelPrev === null && AelNext === null && e !== this.m_ActiveEdges) {
          return;
        }
        if (AelPrev !== null) {
          AelPrev.NextInAEL = AelNext;
        } else {
          this.m_ActiveEdges = AelNext;
        }
        if (AelNext !== null) {
          AelNext.PrevInAEL = AelPrev;
        }
        e.NextInAEL = null;
        e.PrevInAEL = null;
      };
      ClipperLib.Clipper = function(InitOptions) {
        if (typeof InitOptions === "undefined") InitOptions = 0;
        this.m_PolyOuts = null;
        this.m_ClipType = ClipperLib.ClipType.ctIntersection;
        this.m_Scanbeam = null;
        this.m_Maxima = null;
        this.m_ActiveEdges = null;
        this.m_SortedEdges = null;
        this.m_IntersectList = null;
        this.m_IntersectNodeComparer = null;
        this.m_ExecuteLocked = false;
        this.m_ClipFillType = ClipperLib.PolyFillType.pftEvenOdd;
        this.m_SubjFillType = ClipperLib.PolyFillType.pftEvenOdd;
        this.m_Joins = null;
        this.m_GhostJoins = null;
        this.m_UsingPolyTree = false;
        this.ReverseSolution = false;
        this.StrictlySimple = false;
        ClipperLib.ClipperBase.call(this);
        this.m_Scanbeam = null;
        this.m_Maxima = null;
        this.m_ActiveEdges = null;
        this.m_SortedEdges = null;
        this.m_IntersectList = new Array();
        this.m_IntersectNodeComparer = ClipperLib.MyIntersectNodeSort.Compare;
        this.m_ExecuteLocked = false;
        this.m_UsingPolyTree = false;
        this.m_PolyOuts = new Array();
        this.m_Joins = new Array();
        this.m_GhostJoins = new Array();
        this.ReverseSolution = (1 & InitOptions) !== 0;
        this.StrictlySimple = (2 & InitOptions) !== 0;
        this.PreserveCollinear = (4 & InitOptions) !== 0;
        if (ClipperLib.use_xyz) {
          this.ZFillFunction = null;
        }
      };
      ClipperLib.Clipper.ioReverseSolution = 1;
      ClipperLib.Clipper.ioStrictlySimple = 2;
      ClipperLib.Clipper.ioPreserveCollinear = 4;
      ClipperLib.Clipper.prototype.Clear = function() {
        if (this.m_edges.length === 0)
          return;
        this.DisposeAllPolyPts();
        ClipperLib.ClipperBase.prototype.Clear.call(this);
      };
      ClipperLib.Clipper.prototype.InsertMaxima = function(X) {
        var newMax = new ClipperLib.Maxima();
        newMax.X = X;
        if (this.m_Maxima === null) {
          this.m_Maxima = newMax;
          this.m_Maxima.Next = null;
          this.m_Maxima.Prev = null;
        } else if (X < this.m_Maxima.X) {
          newMax.Next = this.m_Maxima;
          newMax.Prev = null;
          this.m_Maxima = newMax;
        } else {
          var m = this.m_Maxima;
          while (m.Next !== null && X >= m.Next.X) {
            m = m.Next;
          }
          if (X === m.X) {
            return;
          }
          newMax.Next = m.Next;
          newMax.Prev = m;
          if (m.Next !== null) {
            m.Next.Prev = newMax;
          }
          m.Next = newMax;
        }
      };
      ClipperLib.Clipper.prototype.Execute = function() {
        var a = arguments, alen = a.length, ispolytree = a[1] instanceof ClipperLib.PolyTree;
        if (alen === 4 && !ispolytree) {
          var clipType = a[0], solution = a[1], subjFillType = a[2], clipFillType = a[3];
          if (this.m_ExecuteLocked)
            return false;
          if (this.m_HasOpenPaths)
            ClipperLib.Error("Error: PolyTree struct is needed for open path clipping.");
          this.m_ExecuteLocked = true;
          ClipperLib.Clear(solution);
          this.m_SubjFillType = subjFillType;
          this.m_ClipFillType = clipFillType;
          this.m_ClipType = clipType;
          this.m_UsingPolyTree = false;
          try {
            var succeeded = this.ExecuteInternal();
            if (succeeded) this.BuildResult(solution);
          } finally {
            this.DisposeAllPolyPts();
            this.m_ExecuteLocked = false;
          }
          return succeeded;
        } else if (alen === 4 && ispolytree) {
          var clipType = a[0], polytree = a[1], subjFillType = a[2], clipFillType = a[3];
          if (this.m_ExecuteLocked)
            return false;
          this.m_ExecuteLocked = true;
          this.m_SubjFillType = subjFillType;
          this.m_ClipFillType = clipFillType;
          this.m_ClipType = clipType;
          this.m_UsingPolyTree = true;
          try {
            var succeeded = this.ExecuteInternal();
            if (succeeded) this.BuildResult2(polytree);
          } finally {
            this.DisposeAllPolyPts();
            this.m_ExecuteLocked = false;
          }
          return succeeded;
        } else if (alen === 2 && !ispolytree) {
          var clipType = a[0], solution = a[1];
          return this.Execute(clipType, solution, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        } else if (alen === 2 && ispolytree) {
          var clipType = a[0], polytree = a[1];
          return this.Execute(clipType, polytree, ClipperLib.PolyFillType.pftEvenOdd, ClipperLib.PolyFillType.pftEvenOdd);
        }
      };
      ClipperLib.Clipper.prototype.FixHoleLinkage = function(outRec) {
        if (outRec.FirstLeft === null || outRec.IsHole !== outRec.FirstLeft.IsHole && outRec.FirstLeft.Pts !== null)
          return;
        var orfl = outRec.FirstLeft;
        while (orfl !== null && (orfl.IsHole === outRec.IsHole || orfl.Pts === null))
          orfl = orfl.FirstLeft;
        outRec.FirstLeft = orfl;
      };
      ClipperLib.Clipper.prototype.ExecuteInternal = function() {
        try {
          this.Reset();
          this.m_SortedEdges = null;
          this.m_Maxima = null;
          var botY = {}, topY = {};
          if (!this.PopScanbeam(botY)) {
            return false;
          }
          this.InsertLocalMinimaIntoAEL(botY.v);
          while (this.PopScanbeam(topY) || this.LocalMinimaPending()) {
            this.ProcessHorizontals();
            this.m_GhostJoins.length = 0;
            if (!this.ProcessIntersections(topY.v)) {
              return false;
            }
            this.ProcessEdgesAtTopOfScanbeam(topY.v);
            botY.v = topY.v;
            this.InsertLocalMinimaIntoAEL(botY.v);
          }
          var outRec, i, ilen;
          for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            outRec = this.m_PolyOuts[i];
            if (outRec.Pts === null || outRec.IsOpen) continue;
            if ((outRec.IsHole ^ this.ReverseSolution) == this.Area$1(outRec) > 0)
              this.ReversePolyPtLinks(outRec.Pts);
          }
          this.JoinCommonEdges();
          for (i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
            outRec = this.m_PolyOuts[i];
            if (outRec.Pts === null)
              continue;
            else if (outRec.IsOpen)
              this.FixupOutPolyline(outRec);
            else
              this.FixupOutPolygon(outRec);
          }
          if (this.StrictlySimple) this.DoSimplePolygons();
          return true;
        } finally {
          this.m_Joins.length = 0;
          this.m_GhostJoins.length = 0;
        }
      };
      ClipperLib.Clipper.prototype.DisposeAllPolyPts = function() {
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; ++i)
          this.DisposeOutRec(i);
        ClipperLib.Clear(this.m_PolyOuts);
      };
      ClipperLib.Clipper.prototype.AddJoin = function(Op1, Op2, OffPt) {
        var j = new ClipperLib.Join();
        j.OutPt1 = Op1;
        j.OutPt2 = Op2;
        j.OffPt.X = OffPt.X;
        j.OffPt.Y = OffPt.Y;
        if (ClipperLib.use_xyz) j.OffPt.Z = OffPt.Z;
        this.m_Joins.push(j);
      };
      ClipperLib.Clipper.prototype.AddGhostJoin = function(Op, OffPt) {
        var j = new ClipperLib.Join();
        j.OutPt1 = Op;
        j.OffPt.X = OffPt.X;
        j.OffPt.Y = OffPt.Y;
        if (ClipperLib.use_xyz) j.OffPt.Z = OffPt.Z;
        this.m_GhostJoins.push(j);
      };
      ClipperLib.Clipper.prototype.SetZ = function(pt, e1, e2) {
        if (this.ZFillFunction !== null) {
          if (pt.Z !== 0 || this.ZFillFunction === null) return;
          else if (ClipperLib.IntPoint.op_Equality(pt, e1.Bot)) pt.Z = e1.Bot.Z;
          else if (ClipperLib.IntPoint.op_Equality(pt, e1.Top)) pt.Z = e1.Top.Z;
          else if (ClipperLib.IntPoint.op_Equality(pt, e2.Bot)) pt.Z = e2.Bot.Z;
          else if (ClipperLib.IntPoint.op_Equality(pt, e2.Top)) pt.Z = e2.Top.Z;
          else this.ZFillFunction(e1.Bot, e1.Top, e2.Bot, e2.Top, pt);
        }
      };
      ClipperLib.Clipper.prototype.InsertLocalMinimaIntoAEL = function(botY) {
        var lm = {};
        var lb;
        var rb;
        while (this.PopLocalMinima(botY, lm)) {
          lb = lm.v.LeftBound;
          rb = lm.v.RightBound;
          var Op1 = null;
          if (lb === null) {
            this.InsertEdgeIntoAEL(rb, null);
            this.SetWindingCount(rb);
            if (this.IsContributing(rb))
              Op1 = this.AddOutPt(rb, rb.Bot);
          } else if (rb === null) {
            this.InsertEdgeIntoAEL(lb, null);
            this.SetWindingCount(lb);
            if (this.IsContributing(lb))
              Op1 = this.AddOutPt(lb, lb.Bot);
            this.InsertScanbeam(lb.Top.Y);
          } else {
            this.InsertEdgeIntoAEL(lb, null);
            this.InsertEdgeIntoAEL(rb, lb);
            this.SetWindingCount(lb);
            rb.WindCnt = lb.WindCnt;
            rb.WindCnt2 = lb.WindCnt2;
            if (this.IsContributing(lb))
              Op1 = this.AddLocalMinPoly(lb, rb, lb.Bot);
            this.InsertScanbeam(lb.Top.Y);
          }
          if (rb !== null) {
            if (ClipperLib.ClipperBase.IsHorizontal(rb)) {
              if (rb.NextInLML !== null) {
                this.InsertScanbeam(rb.NextInLML.Top.Y);
              }
              this.AddEdgeToSEL(rb);
            } else {
              this.InsertScanbeam(rb.Top.Y);
            }
          }
          if (lb === null || rb === null) continue;
          if (Op1 !== null && ClipperLib.ClipperBase.IsHorizontal(rb) && this.m_GhostJoins.length > 0 && rb.WindDelta !== 0) {
            for (var i = 0, ilen = this.m_GhostJoins.length; i < ilen; i++) {
              var j = this.m_GhostJoins[i];
              if (this.HorzSegmentsOverlap(j.OutPt1.Pt.X, j.OffPt.X, rb.Bot.X, rb.Top.X))
                this.AddJoin(j.OutPt1, Op1, j.OffPt);
            }
          }
          if (lb.OutIdx >= 0 && lb.PrevInAEL !== null && lb.PrevInAEL.Curr.X === lb.Bot.X && lb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(lb.PrevInAEL.Curr, lb.PrevInAEL.Top, lb.Curr, lb.Top, this.m_UseFullRange) && lb.WindDelta !== 0 && lb.PrevInAEL.WindDelta !== 0) {
            var Op2 = this.AddOutPt(lb.PrevInAEL, lb.Bot);
            this.AddJoin(Op1, Op2, lb.Top);
          }
          if (lb.NextInAEL !== rb) {
            if (rb.OutIdx >= 0 && rb.PrevInAEL.OutIdx >= 0 && ClipperLib.ClipperBase.SlopesEqual5(rb.PrevInAEL.Curr, rb.PrevInAEL.Top, rb.Curr, rb.Top, this.m_UseFullRange) && rb.WindDelta !== 0 && rb.PrevInAEL.WindDelta !== 0) {
              var Op2 = this.AddOutPt(rb.PrevInAEL, rb.Bot);
              this.AddJoin(Op1, Op2, rb.Top);
            }
            var e = lb.NextInAEL;
            if (e !== null)
              while (e !== rb) {
                this.IntersectEdges(rb, e, lb.Curr);
                e = e.NextInAEL;
              }
          }
        }
      };
      ClipperLib.Clipper.prototype.InsertEdgeIntoAEL = function(edge, startEdge) {
        if (this.m_ActiveEdges === null) {
          edge.PrevInAEL = null;
          edge.NextInAEL = null;
          this.m_ActiveEdges = edge;
        } else if (startEdge === null && this.E2InsertsBeforeE1(this.m_ActiveEdges, edge)) {
          edge.PrevInAEL = null;
          edge.NextInAEL = this.m_ActiveEdges;
          this.m_ActiveEdges.PrevInAEL = edge;
          this.m_ActiveEdges = edge;
        } else {
          if (startEdge === null)
            startEdge = this.m_ActiveEdges;
          while (startEdge.NextInAEL !== null && !this.E2InsertsBeforeE1(startEdge.NextInAEL, edge))
            startEdge = startEdge.NextInAEL;
          edge.NextInAEL = startEdge.NextInAEL;
          if (startEdge.NextInAEL !== null)
            startEdge.NextInAEL.PrevInAEL = edge;
          edge.PrevInAEL = startEdge;
          startEdge.NextInAEL = edge;
        }
      };
      ClipperLib.Clipper.prototype.E2InsertsBeforeE1 = function(e1, e2) {
        if (e2.Curr.X === e1.Curr.X) {
          if (e2.Top.Y > e1.Top.Y)
            return e2.Top.X < ClipperLib.Clipper.TopX(e1, e2.Top.Y);
          else
            return e1.Top.X > ClipperLib.Clipper.TopX(e2, e1.Top.Y);
        } else
          return e2.Curr.X < e1.Curr.X;
      };
      ClipperLib.Clipper.prototype.IsEvenOddFillType = function(edge) {
        if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
          return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
        else
          return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
      };
      ClipperLib.Clipper.prototype.IsEvenOddAltFillType = function(edge) {
        if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
          return this.m_ClipFillType === ClipperLib.PolyFillType.pftEvenOdd;
        else
          return this.m_SubjFillType === ClipperLib.PolyFillType.pftEvenOdd;
      };
      ClipperLib.Clipper.prototype.IsContributing = function(edge) {
        var pft, pft2;
        if (edge.PolyTyp === ClipperLib.PolyType.ptSubject) {
          pft = this.m_SubjFillType;
          pft2 = this.m_ClipFillType;
        } else {
          pft = this.m_ClipFillType;
          pft2 = this.m_SubjFillType;
        }
        switch (pft) {
          case ClipperLib.PolyFillType.pftEvenOdd:
            if (edge.WindDelta === 0 && edge.WindCnt !== 1)
              return false;
            break;
          case ClipperLib.PolyFillType.pftNonZero:
            if (Math.abs(edge.WindCnt) !== 1)
              return false;
            break;
          case ClipperLib.PolyFillType.pftPositive:
            if (edge.WindCnt !== 1)
              return false;
            break;
          default:
            if (edge.WindCnt !== -1)
              return false;
            break;
        }
        switch (this.m_ClipType) {
          case ClipperLib.ClipType.ctIntersection:
            switch (pft2) {
              case ClipperLib.PolyFillType.pftEvenOdd:
              case ClipperLib.PolyFillType.pftNonZero:
                return edge.WindCnt2 !== 0;
              case ClipperLib.PolyFillType.pftPositive:
                return edge.WindCnt2 > 0;
              default:
                return edge.WindCnt2 < 0;
            }
          case ClipperLib.ClipType.ctUnion:
            switch (pft2) {
              case ClipperLib.PolyFillType.pftEvenOdd:
              case ClipperLib.PolyFillType.pftNonZero:
                return edge.WindCnt2 === 0;
              case ClipperLib.PolyFillType.pftPositive:
                return edge.WindCnt2 <= 0;
              default:
                return edge.WindCnt2 >= 0;
            }
          case ClipperLib.ClipType.ctDifference:
            if (edge.PolyTyp === ClipperLib.PolyType.ptSubject)
              switch (pft2) {
                case ClipperLib.PolyFillType.pftEvenOdd:
                case ClipperLib.PolyFillType.pftNonZero:
                  return edge.WindCnt2 === 0;
                case ClipperLib.PolyFillType.pftPositive:
                  return edge.WindCnt2 <= 0;
                default:
                  return edge.WindCnt2 >= 0;
              }
            else
              switch (pft2) {
                case ClipperLib.PolyFillType.pftEvenOdd:
                case ClipperLib.PolyFillType.pftNonZero:
                  return edge.WindCnt2 !== 0;
                case ClipperLib.PolyFillType.pftPositive:
                  return edge.WindCnt2 > 0;
                default:
                  return edge.WindCnt2 < 0;
              }
          case ClipperLib.ClipType.ctXor:
            if (edge.WindDelta === 0)
              switch (pft2) {
                case ClipperLib.PolyFillType.pftEvenOdd:
                case ClipperLib.PolyFillType.pftNonZero:
                  return edge.WindCnt2 === 0;
                case ClipperLib.PolyFillType.pftPositive:
                  return edge.WindCnt2 <= 0;
                default:
                  return edge.WindCnt2 >= 0;
              }
            else
              return true;
        }
        return true;
      };
      ClipperLib.Clipper.prototype.SetWindingCount = function(edge) {
        var e = edge.PrevInAEL;
        while (e !== null && (e.PolyTyp !== edge.PolyTyp || e.WindDelta === 0))
          e = e.PrevInAEL;
        if (e === null) {
          var pft = edge.PolyTyp === ClipperLib.PolyType.ptSubject ? this.m_SubjFillType : this.m_ClipFillType;
          if (edge.WindDelta === 0) {
            edge.WindCnt = pft === ClipperLib.PolyFillType.pftNegative ? -1 : 1;
          } else {
            edge.WindCnt = edge.WindDelta;
          }
          edge.WindCnt2 = 0;
          e = this.m_ActiveEdges;
        } else if (edge.WindDelta === 0 && this.m_ClipType !== ClipperLib.ClipType.ctUnion) {
          edge.WindCnt = 1;
          edge.WindCnt2 = e.WindCnt2;
          e = e.NextInAEL;
        } else if (this.IsEvenOddFillType(edge)) {
          if (edge.WindDelta === 0) {
            var Inside = true;
            var e2 = e.PrevInAEL;
            while (e2 !== null) {
              if (e2.PolyTyp === e.PolyTyp && e2.WindDelta !== 0)
                Inside = !Inside;
              e2 = e2.PrevInAEL;
            }
            edge.WindCnt = Inside ? 0 : 1;
          } else {
            edge.WindCnt = edge.WindDelta;
          }
          edge.WindCnt2 = e.WindCnt2;
          e = e.NextInAEL;
        } else {
          if (e.WindCnt * e.WindDelta < 0) {
            if (Math.abs(e.WindCnt) > 1) {
              if (e.WindDelta * edge.WindDelta < 0)
                edge.WindCnt = e.WindCnt;
              else
                edge.WindCnt = e.WindCnt + edge.WindDelta;
            } else
              edge.WindCnt = edge.WindDelta === 0 ? 1 : edge.WindDelta;
          } else {
            if (edge.WindDelta === 0)
              edge.WindCnt = e.WindCnt < 0 ? e.WindCnt - 1 : e.WindCnt + 1;
            else if (e.WindDelta * edge.WindDelta < 0)
              edge.WindCnt = e.WindCnt;
            else
              edge.WindCnt = e.WindCnt + edge.WindDelta;
          }
          edge.WindCnt2 = e.WindCnt2;
          e = e.NextInAEL;
        }
        if (this.IsEvenOddAltFillType(edge)) {
          while (e !== edge) {
            if (e.WindDelta !== 0)
              edge.WindCnt2 = edge.WindCnt2 === 0 ? 1 : 0;
            e = e.NextInAEL;
          }
        } else {
          while (e !== edge) {
            edge.WindCnt2 += e.WindDelta;
            e = e.NextInAEL;
          }
        }
      };
      ClipperLib.Clipper.prototype.AddEdgeToSEL = function(edge) {
        if (this.m_SortedEdges === null) {
          this.m_SortedEdges = edge;
          edge.PrevInSEL = null;
          edge.NextInSEL = null;
        } else {
          edge.NextInSEL = this.m_SortedEdges;
          edge.PrevInSEL = null;
          this.m_SortedEdges.PrevInSEL = edge;
          this.m_SortedEdges = edge;
        }
      };
      ClipperLib.Clipper.prototype.PopEdgeFromSEL = function(e) {
        e.v = this.m_SortedEdges;
        if (e.v === null) {
          return false;
        }
        var oldE = e.v;
        this.m_SortedEdges = e.v.NextInSEL;
        if (this.m_SortedEdges !== null) {
          this.m_SortedEdges.PrevInSEL = null;
        }
        oldE.NextInSEL = null;
        oldE.PrevInSEL = null;
        return true;
      };
      ClipperLib.Clipper.prototype.CopyAELToSEL = function() {
        var e = this.m_ActiveEdges;
        this.m_SortedEdges = e;
        while (e !== null) {
          e.PrevInSEL = e.PrevInAEL;
          e.NextInSEL = e.NextInAEL;
          e = e.NextInAEL;
        }
      };
      ClipperLib.Clipper.prototype.SwapPositionsInSEL = function(edge1, edge2) {
        if (edge1.NextInSEL === null && edge1.PrevInSEL === null)
          return;
        if (edge2.NextInSEL === null && edge2.PrevInSEL === null)
          return;
        if (edge1.NextInSEL === edge2) {
          var next = edge2.NextInSEL;
          if (next !== null)
            next.PrevInSEL = edge1;
          var prev = edge1.PrevInSEL;
          if (prev !== null)
            prev.NextInSEL = edge2;
          edge2.PrevInSEL = prev;
          edge2.NextInSEL = edge1;
          edge1.PrevInSEL = edge2;
          edge1.NextInSEL = next;
        } else if (edge2.NextInSEL === edge1) {
          var next = edge1.NextInSEL;
          if (next !== null)
            next.PrevInSEL = edge2;
          var prev = edge2.PrevInSEL;
          if (prev !== null)
            prev.NextInSEL = edge1;
          edge1.PrevInSEL = prev;
          edge1.NextInSEL = edge2;
          edge2.PrevInSEL = edge1;
          edge2.NextInSEL = next;
        } else {
          var next = edge1.NextInSEL;
          var prev = edge1.PrevInSEL;
          edge1.NextInSEL = edge2.NextInSEL;
          if (edge1.NextInSEL !== null)
            edge1.NextInSEL.PrevInSEL = edge1;
          edge1.PrevInSEL = edge2.PrevInSEL;
          if (edge1.PrevInSEL !== null)
            edge1.PrevInSEL.NextInSEL = edge1;
          edge2.NextInSEL = next;
          if (edge2.NextInSEL !== null)
            edge2.NextInSEL.PrevInSEL = edge2;
          edge2.PrevInSEL = prev;
          if (edge2.PrevInSEL !== null)
            edge2.PrevInSEL.NextInSEL = edge2;
        }
        if (edge1.PrevInSEL === null)
          this.m_SortedEdges = edge1;
        else if (edge2.PrevInSEL === null)
          this.m_SortedEdges = edge2;
      };
      ClipperLib.Clipper.prototype.AddLocalMaxPoly = function(e1, e2, pt) {
        this.AddOutPt(e1, pt);
        if (e2.WindDelta === 0) this.AddOutPt(e2, pt);
        if (e1.OutIdx === e2.OutIdx) {
          e1.OutIdx = -1;
          e2.OutIdx = -1;
        } else if (e1.OutIdx < e2.OutIdx)
          this.AppendPolygon(e1, e2);
        else
          this.AppendPolygon(e2, e1);
      };
      ClipperLib.Clipper.prototype.AddLocalMinPoly = function(e1, e2, pt) {
        var result;
        var e, prevE;
        if (ClipperLib.ClipperBase.IsHorizontal(e2) || e1.Dx > e2.Dx) {
          result = this.AddOutPt(e1, pt);
          e2.OutIdx = e1.OutIdx;
          e1.Side = ClipperLib.EdgeSide.esLeft;
          e2.Side = ClipperLib.EdgeSide.esRight;
          e = e1;
          if (e.PrevInAEL === e2)
            prevE = e2.PrevInAEL;
          else
            prevE = e.PrevInAEL;
        } else {
          result = this.AddOutPt(e2, pt);
          e1.OutIdx = e2.OutIdx;
          e1.Side = ClipperLib.EdgeSide.esRight;
          e2.Side = ClipperLib.EdgeSide.esLeft;
          e = e2;
          if (e.PrevInAEL === e1)
            prevE = e1.PrevInAEL;
          else
            prevE = e.PrevInAEL;
        }
        if (prevE !== null && prevE.OutIdx >= 0 && prevE.Top.Y < pt.Y && e.Top.Y < pt.Y) {
          var xPrev = ClipperLib.Clipper.TopX(prevE, pt.Y);
          var xE = ClipperLib.Clipper.TopX(e, pt.Y);
          if (xPrev === xE && e.WindDelta !== 0 && prevE.WindDelta !== 0 && ClipperLib.ClipperBase.SlopesEqual5(new ClipperLib.IntPoint2(xPrev, pt.Y), prevE.Top, new ClipperLib.IntPoint2(xE, pt.Y), e.Top, this.m_UseFullRange)) {
            var outPt = this.AddOutPt(prevE, pt);
            this.AddJoin(result, outPt, e.Top);
          }
        }
        return result;
      };
      ClipperLib.Clipper.prototype.AddOutPt = function(e, pt) {
        if (e.OutIdx < 0) {
          var outRec = this.CreateOutRec();
          outRec.IsOpen = e.WindDelta === 0;
          var newOp = new ClipperLib.OutPt();
          outRec.Pts = newOp;
          newOp.Idx = outRec.Idx;
          newOp.Pt.X = pt.X;
          newOp.Pt.Y = pt.Y;
          if (ClipperLib.use_xyz) newOp.Pt.Z = pt.Z;
          newOp.Next = newOp;
          newOp.Prev = newOp;
          if (!outRec.IsOpen)
            this.SetHoleState(e, outRec);
          e.OutIdx = outRec.Idx;
          return newOp;
        } else {
          var outRec = this.m_PolyOuts[e.OutIdx];
          var op = outRec.Pts;
          var ToFront = e.Side === ClipperLib.EdgeSide.esLeft;
          if (ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Pt))
            return op;
          else if (!ToFront && ClipperLib.IntPoint.op_Equality(pt, op.Prev.Pt))
            return op.Prev;
          var newOp = new ClipperLib.OutPt();
          newOp.Idx = outRec.Idx;
          newOp.Pt.X = pt.X;
          newOp.Pt.Y = pt.Y;
          if (ClipperLib.use_xyz) newOp.Pt.Z = pt.Z;
          newOp.Next = op;
          newOp.Prev = op.Prev;
          newOp.Prev.Next = newOp;
          op.Prev = newOp;
          if (ToFront)
            outRec.Pts = newOp;
          return newOp;
        }
      };
      ClipperLib.Clipper.prototype.GetLastOutPt = function(e) {
        var outRec = this.m_PolyOuts[e.OutIdx];
        if (e.Side === ClipperLib.EdgeSide.esLeft) {
          return outRec.Pts;
        } else {
          return outRec.Pts.Prev;
        }
      };
      ClipperLib.Clipper.prototype.SwapPoints = function(pt1, pt2) {
        var tmp = new ClipperLib.IntPoint1(pt1.Value);
        pt1.Value.X = pt2.Value.X;
        pt1.Value.Y = pt2.Value.Y;
        if (ClipperLib.use_xyz) pt1.Value.Z = pt2.Value.Z;
        pt2.Value.X = tmp.X;
        pt2.Value.Y = tmp.Y;
        if (ClipperLib.use_xyz) pt2.Value.Z = tmp.Z;
      };
      ClipperLib.Clipper.prototype.HorzSegmentsOverlap = function(seg1a, seg1b, seg2a, seg2b) {
        var tmp;
        if (seg1a > seg1b) {
          tmp = seg1a;
          seg1a = seg1b;
          seg1b = tmp;
        }
        if (seg2a > seg2b) {
          tmp = seg2a;
          seg2a = seg2b;
          seg2b = tmp;
        }
        return seg1a < seg2b && seg2a < seg1b;
      };
      ClipperLib.Clipper.prototype.SetHoleState = function(e, outRec) {
        var e2 = e.PrevInAEL;
        var eTmp = null;
        while (e2 !== null) {
          if (e2.OutIdx >= 0 && e2.WindDelta !== 0) {
            if (eTmp === null)
              eTmp = e2;
            else if (eTmp.OutIdx === e2.OutIdx)
              eTmp = null;
          }
          e2 = e2.PrevInAEL;
        }
        if (eTmp === null) {
          outRec.FirstLeft = null;
          outRec.IsHole = false;
        } else {
          outRec.FirstLeft = this.m_PolyOuts[eTmp.OutIdx];
          outRec.IsHole = !outRec.FirstLeft.IsHole;
        }
      };
      ClipperLib.Clipper.prototype.GetDx = function(pt1, pt2) {
        if (pt1.Y === pt2.Y)
          return ClipperLib.ClipperBase.horizontal;
        else
          return (pt2.X - pt1.X) / (pt2.Y - pt1.Y);
      };
      ClipperLib.Clipper.prototype.FirstIsBottomPt = function(btmPt1, btmPt2) {
        var p = btmPt1.Prev;
        while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
          p = p.Prev;
        var dx1p = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
        p = btmPt1.Next;
        while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt1.Pt) && p !== btmPt1)
          p = p.Next;
        var dx1n = Math.abs(this.GetDx(btmPt1.Pt, p.Pt));
        p = btmPt2.Prev;
        while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
          p = p.Prev;
        var dx2p = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
        p = btmPt2.Next;
        while (ClipperLib.IntPoint.op_Equality(p.Pt, btmPt2.Pt) && p !== btmPt2)
          p = p.Next;
        var dx2n = Math.abs(this.GetDx(btmPt2.Pt, p.Pt));
        if (Math.max(dx1p, dx1n) === Math.max(dx2p, dx2n) && Math.min(dx1p, dx1n) === Math.min(dx2p, dx2n)) {
          return this.Area(btmPt1) > 0;
        } else {
          return dx1p >= dx2p && dx1p >= dx2n || dx1n >= dx2p && dx1n >= dx2n;
        }
      };
      ClipperLib.Clipper.prototype.GetBottomPt = function(pp) {
        var dups = null;
        var p = pp.Next;
        while (p !== pp) {
          if (p.Pt.Y > pp.Pt.Y) {
            pp = p;
            dups = null;
          } else if (p.Pt.Y === pp.Pt.Y && p.Pt.X <= pp.Pt.X) {
            if (p.Pt.X < pp.Pt.X) {
              dups = null;
              pp = p;
            } else {
              if (p.Next !== pp && p.Prev !== pp)
                dups = p;
            }
          }
          p = p.Next;
        }
        if (dups !== null) {
          while (dups !== p) {
            if (!this.FirstIsBottomPt(p, dups))
              pp = dups;
            dups = dups.Next;
            while (ClipperLib.IntPoint.op_Inequality(dups.Pt, pp.Pt))
              dups = dups.Next;
          }
        }
        return pp;
      };
      ClipperLib.Clipper.prototype.GetLowermostRec = function(outRec1, outRec2) {
        if (outRec1.BottomPt === null)
          outRec1.BottomPt = this.GetBottomPt(outRec1.Pts);
        if (outRec2.BottomPt === null)
          outRec2.BottomPt = this.GetBottomPt(outRec2.Pts);
        var bPt1 = outRec1.BottomPt;
        var bPt2 = outRec2.BottomPt;
        if (bPt1.Pt.Y > bPt2.Pt.Y)
          return outRec1;
        else if (bPt1.Pt.Y < bPt2.Pt.Y)
          return outRec2;
        else if (bPt1.Pt.X < bPt2.Pt.X)
          return outRec1;
        else if (bPt1.Pt.X > bPt2.Pt.X)
          return outRec2;
        else if (bPt1.Next === bPt1)
          return outRec2;
        else if (bPt2.Next === bPt2)
          return outRec1;
        else if (this.FirstIsBottomPt(bPt1, bPt2))
          return outRec1;
        else
          return outRec2;
      };
      ClipperLib.Clipper.prototype.OutRec1RightOfOutRec2 = function(outRec1, outRec2) {
        do {
          outRec1 = outRec1.FirstLeft;
          if (outRec1 === outRec2)
            return true;
        } while (outRec1 !== null);
        return false;
      };
      ClipperLib.Clipper.prototype.GetOutRec = function(idx) {
        var outrec = this.m_PolyOuts[idx];
        while (outrec !== this.m_PolyOuts[outrec.Idx])
          outrec = this.m_PolyOuts[outrec.Idx];
        return outrec;
      };
      ClipperLib.Clipper.prototype.AppendPolygon = function(e1, e2) {
        var outRec1 = this.m_PolyOuts[e1.OutIdx];
        var outRec2 = this.m_PolyOuts[e2.OutIdx];
        var holeStateRec;
        if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
          holeStateRec = outRec2;
        else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
          holeStateRec = outRec1;
        else
          holeStateRec = this.GetLowermostRec(outRec1, outRec2);
        var p1_lft = outRec1.Pts;
        var p1_rt = p1_lft.Prev;
        var p2_lft = outRec2.Pts;
        var p2_rt = p2_lft.Prev;
        if (e1.Side === ClipperLib.EdgeSide.esLeft) {
          if (e2.Side === ClipperLib.EdgeSide.esLeft) {
            this.ReversePolyPtLinks(p2_lft);
            p2_lft.Next = p1_lft;
            p1_lft.Prev = p2_lft;
            p1_rt.Next = p2_rt;
            p2_rt.Prev = p1_rt;
            outRec1.Pts = p2_rt;
          } else {
            p2_rt.Next = p1_lft;
            p1_lft.Prev = p2_rt;
            p2_lft.Prev = p1_rt;
            p1_rt.Next = p2_lft;
            outRec1.Pts = p2_lft;
          }
        } else {
          if (e2.Side === ClipperLib.EdgeSide.esRight) {
            this.ReversePolyPtLinks(p2_lft);
            p1_rt.Next = p2_rt;
            p2_rt.Prev = p1_rt;
            p2_lft.Next = p1_lft;
            p1_lft.Prev = p2_lft;
          } else {
            p1_rt.Next = p2_lft;
            p2_lft.Prev = p1_rt;
            p1_lft.Prev = p2_rt;
            p2_rt.Next = p1_lft;
          }
        }
        outRec1.BottomPt = null;
        if (holeStateRec === outRec2) {
          if (outRec2.FirstLeft !== outRec1)
            outRec1.FirstLeft = outRec2.FirstLeft;
          outRec1.IsHole = outRec2.IsHole;
        }
        outRec2.Pts = null;
        outRec2.BottomPt = null;
        outRec2.FirstLeft = outRec1;
        var OKIdx = e1.OutIdx;
        var ObsoleteIdx = e2.OutIdx;
        e1.OutIdx = -1;
        e2.OutIdx = -1;
        var e = this.m_ActiveEdges;
        while (e !== null) {
          if (e.OutIdx === ObsoleteIdx) {
            e.OutIdx = OKIdx;
            e.Side = e1.Side;
            break;
          }
          e = e.NextInAEL;
        }
        outRec2.Idx = outRec1.Idx;
      };
      ClipperLib.Clipper.prototype.ReversePolyPtLinks = function(pp) {
        if (pp === null)
          return;
        var pp1;
        var pp2;
        pp1 = pp;
        do {
          pp2 = pp1.Next;
          pp1.Next = pp1.Prev;
          pp1.Prev = pp2;
          pp1 = pp2;
        } while (pp1 !== pp);
      };
      ClipperLib.Clipper.SwapSides = function(edge1, edge2) {
        var side = edge1.Side;
        edge1.Side = edge2.Side;
        edge2.Side = side;
      };
      ClipperLib.Clipper.SwapPolyIndexes = function(edge1, edge2) {
        var outIdx = edge1.OutIdx;
        edge1.OutIdx = edge2.OutIdx;
        edge2.OutIdx = outIdx;
      };
      ClipperLib.Clipper.prototype.IntersectEdges = function(e1, e2, pt) {
        var e1Contributing = e1.OutIdx >= 0;
        var e2Contributing = e2.OutIdx >= 0;
        if (ClipperLib.use_xyz)
          this.SetZ(pt, e1, e2);
        if (ClipperLib.use_lines) {
          if (e1.WindDelta === 0 || e2.WindDelta === 0) {
            if (e1.WindDelta === 0 && e2.WindDelta === 0) return;
            else if (e1.PolyTyp === e2.PolyTyp && e1.WindDelta !== e2.WindDelta && this.m_ClipType === ClipperLib.ClipType.ctUnion) {
              if (e1.WindDelta === 0) {
                if (e2Contributing) {
                  this.AddOutPt(e1, pt);
                  if (e1Contributing)
                    e1.OutIdx = -1;
                }
              } else {
                if (e1Contributing) {
                  this.AddOutPt(e2, pt);
                  if (e2Contributing)
                    e2.OutIdx = -1;
                }
              }
            } else if (e1.PolyTyp !== e2.PolyTyp) {
              if (e1.WindDelta === 0 && Math.abs(e2.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e2.WindCnt2 === 0)) {
                this.AddOutPt(e1, pt);
                if (e1Contributing)
                  e1.OutIdx = -1;
              } else if (e2.WindDelta === 0 && Math.abs(e1.WindCnt) === 1 && (this.m_ClipType !== ClipperLib.ClipType.ctUnion || e1.WindCnt2 === 0)) {
                this.AddOutPt(e2, pt);
                if (e2Contributing)
                  e2.OutIdx = -1;
              }
            }
            return;
          }
        }
        if (e1.PolyTyp === e2.PolyTyp) {
          if (this.IsEvenOddFillType(e1)) {
            var oldE1WindCnt = e1.WindCnt;
            e1.WindCnt = e2.WindCnt;
            e2.WindCnt = oldE1WindCnt;
          } else {
            if (e1.WindCnt + e2.WindDelta === 0)
              e1.WindCnt = -e1.WindCnt;
            else
              e1.WindCnt += e2.WindDelta;
            if (e2.WindCnt - e1.WindDelta === 0)
              e2.WindCnt = -e2.WindCnt;
            else
              e2.WindCnt -= e1.WindDelta;
          }
        } else {
          if (!this.IsEvenOddFillType(e2))
            e1.WindCnt2 += e2.WindDelta;
          else
            e1.WindCnt2 = e1.WindCnt2 === 0 ? 1 : 0;
          if (!this.IsEvenOddFillType(e1))
            e2.WindCnt2 -= e1.WindDelta;
          else
            e2.WindCnt2 = e2.WindCnt2 === 0 ? 1 : 0;
        }
        var e1FillType, e2FillType, e1FillType2, e2FillType2;
        if (e1.PolyTyp === ClipperLib.PolyType.ptSubject) {
          e1FillType = this.m_SubjFillType;
          e1FillType2 = this.m_ClipFillType;
        } else {
          e1FillType = this.m_ClipFillType;
          e1FillType2 = this.m_SubjFillType;
        }
        if (e2.PolyTyp === ClipperLib.PolyType.ptSubject) {
          e2FillType = this.m_SubjFillType;
          e2FillType2 = this.m_ClipFillType;
        } else {
          e2FillType = this.m_ClipFillType;
          e2FillType2 = this.m_SubjFillType;
        }
        var e1Wc, e2Wc;
        switch (e1FillType) {
          case ClipperLib.PolyFillType.pftPositive:
            e1Wc = e1.WindCnt;
            break;
          case ClipperLib.PolyFillType.pftNegative:
            e1Wc = -e1.WindCnt;
            break;
          default:
            e1Wc = Math.abs(e1.WindCnt);
            break;
        }
        switch (e2FillType) {
          case ClipperLib.PolyFillType.pftPositive:
            e2Wc = e2.WindCnt;
            break;
          case ClipperLib.PolyFillType.pftNegative:
            e2Wc = -e2.WindCnt;
            break;
          default:
            e2Wc = Math.abs(e2.WindCnt);
            break;
        }
        if (e1Contributing && e2Contributing) {
          if (e1Wc !== 0 && e1Wc !== 1 || e2Wc !== 0 && e2Wc !== 1 || e1.PolyTyp !== e2.PolyTyp && this.m_ClipType !== ClipperLib.ClipType.ctXor) {
            this.AddLocalMaxPoly(e1, e2, pt);
          } else {
            this.AddOutPt(e1, pt);
            this.AddOutPt(e2, pt);
            ClipperLib.Clipper.SwapSides(e1, e2);
            ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
          }
        } else if (e1Contributing) {
          if (e2Wc === 0 || e2Wc === 1) {
            this.AddOutPt(e1, pt);
            ClipperLib.Clipper.SwapSides(e1, e2);
            ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
          }
        } else if (e2Contributing) {
          if (e1Wc === 0 || e1Wc === 1) {
            this.AddOutPt(e2, pt);
            ClipperLib.Clipper.SwapSides(e1, e2);
            ClipperLib.Clipper.SwapPolyIndexes(e1, e2);
          }
        } else if ((e1Wc === 0 || e1Wc === 1) && (e2Wc === 0 || e2Wc === 1)) {
          var e1Wc2, e2Wc2;
          switch (e1FillType2) {
            case ClipperLib.PolyFillType.pftPositive:
              e1Wc2 = e1.WindCnt2;
              break;
            case ClipperLib.PolyFillType.pftNegative:
              e1Wc2 = -e1.WindCnt2;
              break;
            default:
              e1Wc2 = Math.abs(e1.WindCnt2);
              break;
          }
          switch (e2FillType2) {
            case ClipperLib.PolyFillType.pftPositive:
              e2Wc2 = e2.WindCnt2;
              break;
            case ClipperLib.PolyFillType.pftNegative:
              e2Wc2 = -e2.WindCnt2;
              break;
            default:
              e2Wc2 = Math.abs(e2.WindCnt2);
              break;
          }
          if (e1.PolyTyp !== e2.PolyTyp) {
            this.AddLocalMinPoly(e1, e2, pt);
          } else if (e1Wc === 1 && e2Wc === 1)
            switch (this.m_ClipType) {
              case ClipperLib.ClipType.ctIntersection:
                if (e1Wc2 > 0 && e2Wc2 > 0)
                  this.AddLocalMinPoly(e1, e2, pt);
                break;
              case ClipperLib.ClipType.ctUnion:
                if (e1Wc2 <= 0 && e2Wc2 <= 0)
                  this.AddLocalMinPoly(e1, e2, pt);
                break;
              case ClipperLib.ClipType.ctDifference:
                if (e1.PolyTyp === ClipperLib.PolyType.ptClip && e1Wc2 > 0 && e2Wc2 > 0 || e1.PolyTyp === ClipperLib.PolyType.ptSubject && e1Wc2 <= 0 && e2Wc2 <= 0)
                  this.AddLocalMinPoly(e1, e2, pt);
                break;
              case ClipperLib.ClipType.ctXor:
                this.AddLocalMinPoly(e1, e2, pt);
                break;
            }
          else
            ClipperLib.Clipper.SwapSides(e1, e2);
        }
      };
      ClipperLib.Clipper.prototype.DeleteFromSEL = function(e) {
        var SelPrev = e.PrevInSEL;
        var SelNext = e.NextInSEL;
        if (SelPrev === null && SelNext === null && e !== this.m_SortedEdges)
          return;
        if (SelPrev !== null)
          SelPrev.NextInSEL = SelNext;
        else
          this.m_SortedEdges = SelNext;
        if (SelNext !== null)
          SelNext.PrevInSEL = SelPrev;
        e.NextInSEL = null;
        e.PrevInSEL = null;
      };
      ClipperLib.Clipper.prototype.ProcessHorizontals = function() {
        var horzEdge = {};
        while (this.PopEdgeFromSEL(horzEdge)) {
          this.ProcessHorizontal(horzEdge.v);
        }
      };
      ClipperLib.Clipper.prototype.GetHorzDirection = function(HorzEdge, $var) {
        if (HorzEdge.Bot.X < HorzEdge.Top.X) {
          $var.Left = HorzEdge.Bot.X;
          $var.Right = HorzEdge.Top.X;
          $var.Dir = ClipperLib.Direction.dLeftToRight;
        } else {
          $var.Left = HorzEdge.Top.X;
          $var.Right = HorzEdge.Bot.X;
          $var.Dir = ClipperLib.Direction.dRightToLeft;
        }
      };
      ClipperLib.Clipper.prototype.ProcessHorizontal = function(horzEdge) {
        var $var = {
          Dir: null,
          Left: null,
          Right: null
        };
        this.GetHorzDirection(horzEdge, $var);
        var dir = $var.Dir;
        var horzLeft = $var.Left;
        var horzRight = $var.Right;
        var IsOpen = horzEdge.WindDelta === 0;
        var eLastHorz = horzEdge, eMaxPair = null;
        while (eLastHorz.NextInLML !== null && ClipperLib.ClipperBase.IsHorizontal(eLastHorz.NextInLML))
          eLastHorz = eLastHorz.NextInLML;
        if (eLastHorz.NextInLML === null)
          eMaxPair = this.GetMaximaPair(eLastHorz);
        var currMax = this.m_Maxima;
        if (currMax !== null) {
          if (dir === ClipperLib.Direction.dLeftToRight) {
            while (currMax !== null && currMax.X <= horzEdge.Bot.X) {
              currMax = currMax.Next;
            }
            if (currMax !== null && currMax.X >= eLastHorz.Top.X) {
              currMax = null;
            }
          } else {
            while (currMax.Next !== null && currMax.Next.X < horzEdge.Bot.X) {
              currMax = currMax.Next;
            }
            if (currMax.X <= eLastHorz.Top.X) {
              currMax = null;
            }
          }
        }
        var op1 = null;
        for (; ; ) {
          var IsLastHorz = horzEdge === eLastHorz;
          var e = this.GetNextInAEL(horzEdge, dir);
          while (e !== null) {
            if (currMax !== null) {
              if (dir === ClipperLib.Direction.dLeftToRight) {
                while (currMax !== null && currMax.X < e.Curr.X) {
                  if (horzEdge.OutIdx >= 0 && !IsOpen) {
                    this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
                  }
                  currMax = currMax.Next;
                }
              } else {
                while (currMax !== null && currMax.X > e.Curr.X) {
                  if (horzEdge.OutIdx >= 0 && !IsOpen) {
                    this.AddOutPt(horzEdge, new ClipperLib.IntPoint2(currMax.X, horzEdge.Bot.Y));
                  }
                  currMax = currMax.Prev;
                }
              }
            }
            if (dir === ClipperLib.Direction.dLeftToRight && e.Curr.X > horzRight || dir === ClipperLib.Direction.dRightToLeft && e.Curr.X < horzLeft) {
              break;
            }
            if (e.Curr.X === horzEdge.Top.X && horzEdge.NextInLML !== null && e.Dx < horzEdge.NextInLML.Dx)
              break;
            if (horzEdge.OutIdx >= 0 && !IsOpen) {
              if (ClipperLib.use_xyz) {
                if (dir === ClipperLib.Direction.dLeftToRight)
                  this.SetZ(e.Curr, horzEdge, e);
                else this.SetZ(e.Curr, e, horzEdge);
              }
              op1 = this.AddOutPt(horzEdge, e.Curr);
              var eNextHorz = this.m_SortedEdges;
              while (eNextHorz !== null) {
                if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
                  var op2 = this.GetLastOutPt(eNextHorz);
                  this.AddJoin(op2, op1, eNextHorz.Top);
                }
                eNextHorz = eNextHorz.NextInSEL;
              }
              this.AddGhostJoin(op1, horzEdge.Bot);
            }
            if (e === eMaxPair && IsLastHorz) {
              if (horzEdge.OutIdx >= 0) {
                this.AddLocalMaxPoly(horzEdge, eMaxPair, horzEdge.Top);
              }
              this.DeleteFromAEL(horzEdge);
              this.DeleteFromAEL(eMaxPair);
              return;
            }
            if (dir === ClipperLib.Direction.dLeftToRight) {
              var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
              this.IntersectEdges(horzEdge, e, Pt);
            } else {
              var Pt = new ClipperLib.IntPoint2(e.Curr.X, horzEdge.Curr.Y);
              this.IntersectEdges(e, horzEdge, Pt);
            }
            var eNext = this.GetNextInAEL(e, dir);
            this.SwapPositionsInAEL(horzEdge, e);
            e = eNext;
          }
          if (horzEdge.NextInLML === null || !ClipperLib.ClipperBase.IsHorizontal(horzEdge.NextInLML)) {
            break;
          }
          horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
          if (horzEdge.OutIdx >= 0) {
            this.AddOutPt(horzEdge, horzEdge.Bot);
          }
          $var = {
            Dir: dir,
            Left: horzLeft,
            Right: horzRight
          };
          this.GetHorzDirection(horzEdge, $var);
          dir = $var.Dir;
          horzLeft = $var.Left;
          horzRight = $var.Right;
        }
        if (horzEdge.OutIdx >= 0 && op1 === null) {
          op1 = this.GetLastOutPt(horzEdge);
          var eNextHorz = this.m_SortedEdges;
          while (eNextHorz !== null) {
            if (eNextHorz.OutIdx >= 0 && this.HorzSegmentsOverlap(horzEdge.Bot.X, horzEdge.Top.X, eNextHorz.Bot.X, eNextHorz.Top.X)) {
              var op2 = this.GetLastOutPt(eNextHorz);
              this.AddJoin(op2, op1, eNextHorz.Top);
            }
            eNextHorz = eNextHorz.NextInSEL;
          }
          this.AddGhostJoin(op1, horzEdge.Top);
        }
        if (horzEdge.NextInLML !== null) {
          if (horzEdge.OutIdx >= 0) {
            op1 = this.AddOutPt(horzEdge, horzEdge.Top);
            horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
            if (horzEdge.WindDelta === 0) {
              return;
            }
            var ePrev = horzEdge.PrevInAEL;
            var eNext = horzEdge.NextInAEL;
            if (ePrev !== null && ePrev.Curr.X === horzEdge.Bot.X && ePrev.Curr.Y === horzEdge.Bot.Y && ePrev.WindDelta === 0 && (ePrev.OutIdx >= 0 && ePrev.Curr.Y > ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, ePrev, this.m_UseFullRange))) {
              var op2 = this.AddOutPt(ePrev, horzEdge.Bot);
              this.AddJoin(op1, op2, horzEdge.Top);
            } else if (eNext !== null && eNext.Curr.X === horzEdge.Bot.X && eNext.Curr.Y === horzEdge.Bot.Y && eNext.WindDelta !== 0 && eNext.OutIdx >= 0 && eNext.Curr.Y > eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual3(horzEdge, eNext, this.m_UseFullRange)) {
              var op2 = this.AddOutPt(eNext, horzEdge.Bot);
              this.AddJoin(op1, op2, horzEdge.Top);
            }
          } else {
            horzEdge = this.UpdateEdgeIntoAEL(horzEdge);
          }
        } else {
          if (horzEdge.OutIdx >= 0) {
            this.AddOutPt(horzEdge, horzEdge.Top);
          }
          this.DeleteFromAEL(horzEdge);
        }
      };
      ClipperLib.Clipper.prototype.GetNextInAEL = function(e, Direction) {
        return Direction === ClipperLib.Direction.dLeftToRight ? e.NextInAEL : e.PrevInAEL;
      };
      ClipperLib.Clipper.prototype.IsMinima = function(e) {
        return e !== null && e.Prev.NextInLML !== e && e.Next.NextInLML !== e;
      };
      ClipperLib.Clipper.prototype.IsMaxima = function(e, Y) {
        return e !== null && e.Top.Y === Y && e.NextInLML === null;
      };
      ClipperLib.Clipper.prototype.IsIntermediate = function(e, Y) {
        return e.Top.Y === Y && e.NextInLML !== null;
      };
      ClipperLib.Clipper.prototype.GetMaximaPair = function(e) {
        if (ClipperLib.IntPoint.op_Equality(e.Next.Top, e.Top) && e.Next.NextInLML === null) {
          return e.Next;
        } else {
          if (ClipperLib.IntPoint.op_Equality(e.Prev.Top, e.Top) && e.Prev.NextInLML === null) {
            return e.Prev;
          } else {
            return null;
          }
        }
      };
      ClipperLib.Clipper.prototype.GetMaximaPairEx = function(e) {
        var result = this.GetMaximaPair(e);
        if (result === null || result.OutIdx === ClipperLib.ClipperBase.Skip || result.NextInAEL === result.PrevInAEL && !ClipperLib.ClipperBase.IsHorizontal(result)) {
          return null;
        }
        return result;
      };
      ClipperLib.Clipper.prototype.ProcessIntersections = function(topY) {
        if (this.m_ActiveEdges === null)
          return true;
        try {
          this.BuildIntersectList(topY);
          if (this.m_IntersectList.length === 0)
            return true;
          if (this.m_IntersectList.length === 1 || this.FixupIntersectionOrder())
            this.ProcessIntersectList();
          else
            return false;
        } catch ($$e2) {
          this.m_SortedEdges = null;
          this.m_IntersectList.length = 0;
          ClipperLib.Error("ProcessIntersections error");
        }
        this.m_SortedEdges = null;
        return true;
      };
      ClipperLib.Clipper.prototype.BuildIntersectList = function(topY) {
        if (this.m_ActiveEdges === null)
          return;
        var e = this.m_ActiveEdges;
        this.m_SortedEdges = e;
        while (e !== null) {
          e.PrevInSEL = e.PrevInAEL;
          e.NextInSEL = e.NextInAEL;
          e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
          e = e.NextInAEL;
        }
        var isModified = true;
        while (isModified && this.m_SortedEdges !== null) {
          isModified = false;
          e = this.m_SortedEdges;
          while (e.NextInSEL !== null) {
            var eNext = e.NextInSEL;
            var pt = new ClipperLib.IntPoint0();
            if (e.Curr.X > eNext.Curr.X) {
              this.IntersectPoint(e, eNext, pt);
              if (pt.Y < topY) {
                pt = new ClipperLib.IntPoint2(ClipperLib.Clipper.TopX(e, topY), topY);
              }
              var newNode = new ClipperLib.IntersectNode();
              newNode.Edge1 = e;
              newNode.Edge2 = eNext;
              newNode.Pt.X = pt.X;
              newNode.Pt.Y = pt.Y;
              if (ClipperLib.use_xyz) newNode.Pt.Z = pt.Z;
              this.m_IntersectList.push(newNode);
              this.SwapPositionsInSEL(e, eNext);
              isModified = true;
            } else
              e = eNext;
          }
          if (e.PrevInSEL !== null)
            e.PrevInSEL.NextInSEL = null;
          else
            break;
        }
        this.m_SortedEdges = null;
      };
      ClipperLib.Clipper.prototype.EdgesAdjacent = function(inode) {
        return inode.Edge1.NextInSEL === inode.Edge2 || inode.Edge1.PrevInSEL === inode.Edge2;
      };
      ClipperLib.Clipper.IntersectNodeSort = function(node1, node2) {
        return node2.Pt.Y - node1.Pt.Y;
      };
      ClipperLib.Clipper.prototype.FixupIntersectionOrder = function() {
        this.m_IntersectList.sort(this.m_IntersectNodeComparer);
        this.CopyAELToSEL();
        var cnt = this.m_IntersectList.length;
        for (var i = 0; i < cnt; i++) {
          if (!this.EdgesAdjacent(this.m_IntersectList[i])) {
            var j = i + 1;
            while (j < cnt && !this.EdgesAdjacent(this.m_IntersectList[j]))
              j++;
            if (j === cnt)
              return false;
            var tmp = this.m_IntersectList[i];
            this.m_IntersectList[i] = this.m_IntersectList[j];
            this.m_IntersectList[j] = tmp;
          }
          this.SwapPositionsInSEL(this.m_IntersectList[i].Edge1, this.m_IntersectList[i].Edge2);
        }
        return true;
      };
      ClipperLib.Clipper.prototype.ProcessIntersectList = function() {
        for (var i = 0, ilen = this.m_IntersectList.length; i < ilen; i++) {
          var iNode = this.m_IntersectList[i];
          this.IntersectEdges(iNode.Edge1, iNode.Edge2, iNode.Pt);
          this.SwapPositionsInAEL(iNode.Edge1, iNode.Edge2);
        }
        this.m_IntersectList.length = 0;
      };
      var R1 = function(a) {
        return a < 0 ? Math.ceil(a - 0.5) : Math.round(a);
      };
      var R2 = function(a) {
        return a < 0 ? Math.ceil(a - 0.5) : Math.floor(a + 0.5);
      };
      var R3 = function(a) {
        return a < 0 ? -Math.round(Math.abs(a)) : Math.round(a);
      };
      var R4 = function(a) {
        if (a < 0) {
          a -= 0.5;
          return a < -2147483648 ? Math.ceil(a) : a | 0;
        } else {
          a += 0.5;
          return a > 2147483647 ? Math.floor(a) : a | 0;
        }
      };
      if (browser.msie) ClipperLib.Clipper.Round = R1;
      else if (browser.chromium) ClipperLib.Clipper.Round = R3;
      else if (browser.safari) ClipperLib.Clipper.Round = R4;
      else ClipperLib.Clipper.Round = R2;
      ClipperLib.Clipper.TopX = function(edge, currentY) {
        if (currentY === edge.Top.Y)
          return edge.Top.X;
        return edge.Bot.X + ClipperLib.Clipper.Round(edge.Dx * (currentY - edge.Bot.Y));
      };
      ClipperLib.Clipper.prototype.IntersectPoint = function(edge1, edge2, ip) {
        ip.X = 0;
        ip.Y = 0;
        var b1, b2;
        if (edge1.Dx === edge2.Dx) {
          ip.Y = edge1.Curr.Y;
          ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
          return;
        }
        if (edge1.Delta.X === 0) {
          ip.X = edge1.Bot.X;
          if (ClipperLib.ClipperBase.IsHorizontal(edge2)) {
            ip.Y = edge2.Bot.Y;
          } else {
            b2 = edge2.Bot.Y - edge2.Bot.X / edge2.Dx;
            ip.Y = ClipperLib.Clipper.Round(ip.X / edge2.Dx + b2);
          }
        } else if (edge2.Delta.X === 0) {
          ip.X = edge2.Bot.X;
          if (ClipperLib.ClipperBase.IsHorizontal(edge1)) {
            ip.Y = edge1.Bot.Y;
          } else {
            b1 = edge1.Bot.Y - edge1.Bot.X / edge1.Dx;
            ip.Y = ClipperLib.Clipper.Round(ip.X / edge1.Dx + b1);
          }
        } else {
          b1 = edge1.Bot.X - edge1.Bot.Y * edge1.Dx;
          b2 = edge2.Bot.X - edge2.Bot.Y * edge2.Dx;
          var q = (b2 - b1) / (edge1.Dx - edge2.Dx);
          ip.Y = ClipperLib.Clipper.Round(q);
          if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
            ip.X = ClipperLib.Clipper.Round(edge1.Dx * q + b1);
          else
            ip.X = ClipperLib.Clipper.Round(edge2.Dx * q + b2);
        }
        if (ip.Y < edge1.Top.Y || ip.Y < edge2.Top.Y) {
          if (edge1.Top.Y > edge2.Top.Y) {
            ip.Y = edge1.Top.Y;
            ip.X = ClipperLib.Clipper.TopX(edge2, edge1.Top.Y);
            return ip.X < edge1.Top.X;
          } else
            ip.Y = edge2.Top.Y;
          if (Math.abs(edge1.Dx) < Math.abs(edge2.Dx))
            ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
          else
            ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
        }
        if (ip.Y > edge1.Curr.Y) {
          ip.Y = edge1.Curr.Y;
          if (Math.abs(edge1.Dx) > Math.abs(edge2.Dx))
            ip.X = ClipperLib.Clipper.TopX(edge2, ip.Y);
          else
            ip.X = ClipperLib.Clipper.TopX(edge1, ip.Y);
        }
      };
      ClipperLib.Clipper.prototype.ProcessEdgesAtTopOfScanbeam = function(topY) {
        var e = this.m_ActiveEdges;
        while (e !== null) {
          var IsMaximaEdge = this.IsMaxima(e, topY);
          if (IsMaximaEdge) {
            var eMaxPair = this.GetMaximaPairEx(e);
            IsMaximaEdge = eMaxPair === null || !ClipperLib.ClipperBase.IsHorizontal(eMaxPair);
          }
          if (IsMaximaEdge) {
            if (this.StrictlySimple) {
              this.InsertMaxima(e.Top.X);
            }
            var ePrev = e.PrevInAEL;
            this.DoMaxima(e);
            if (ePrev === null)
              e = this.m_ActiveEdges;
            else
              e = ePrev.NextInAEL;
          } else {
            if (this.IsIntermediate(e, topY) && ClipperLib.ClipperBase.IsHorizontal(e.NextInLML)) {
              e = this.UpdateEdgeIntoAEL(e);
              if (e.OutIdx >= 0)
                this.AddOutPt(e, e.Bot);
              this.AddEdgeToSEL(e);
            } else {
              e.Curr.X = ClipperLib.Clipper.TopX(e, topY);
              e.Curr.Y = topY;
            }
            if (ClipperLib.use_xyz) {
              if (e.Top.Y === topY) e.Curr.Z = e.Top.Z;
              else if (e.Bot.Y === topY) e.Curr.Z = e.Bot.Z;
              else e.Curr.Z = 0;
            }
            if (this.StrictlySimple) {
              var ePrev = e.PrevInAEL;
              if (e.OutIdx >= 0 && e.WindDelta !== 0 && ePrev !== null && ePrev.OutIdx >= 0 && ePrev.Curr.X === e.Curr.X && ePrev.WindDelta !== 0) {
                var ip = new ClipperLib.IntPoint1(e.Curr);
                if (ClipperLib.use_xyz) {
                  this.SetZ(ip, ePrev, e);
                }
                var op = this.AddOutPt(ePrev, ip);
                var op2 = this.AddOutPt(e, ip);
                this.AddJoin(op, op2, ip);
              }
            }
            e = e.NextInAEL;
          }
        }
        this.ProcessHorizontals();
        this.m_Maxima = null;
        e = this.m_ActiveEdges;
        while (e !== null) {
          if (this.IsIntermediate(e, topY)) {
            var op = null;
            if (e.OutIdx >= 0)
              op = this.AddOutPt(e, e.Top);
            e = this.UpdateEdgeIntoAEL(e);
            var ePrev = e.PrevInAEL;
            var eNext = e.NextInAEL;
            if (ePrev !== null && ePrev.Curr.X === e.Bot.X && ePrev.Curr.Y === e.Bot.Y && op !== null && ePrev.OutIdx >= 0 && ePrev.Curr.Y === ePrev.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, ePrev.Curr, ePrev.Top, this.m_UseFullRange) && e.WindDelta !== 0 && ePrev.WindDelta !== 0) {
              var op2 = this.AddOutPt(ePrev2, e.Bot);
              this.AddJoin(op, op2, e.Top);
            } else if (eNext !== null && eNext.Curr.X === e.Bot.X && eNext.Curr.Y === e.Bot.Y && op !== null && eNext.OutIdx >= 0 && eNext.Curr.Y === eNext.Top.Y && ClipperLib.ClipperBase.SlopesEqual5(e.Curr, e.Top, eNext.Curr, eNext.Top, this.m_UseFullRange) && e.WindDelta !== 0 && eNext.WindDelta !== 0) {
              var op2 = this.AddOutPt(eNext, e.Bot);
              this.AddJoin(op, op2, e.Top);
            }
          }
          e = e.NextInAEL;
        }
      };
      ClipperLib.Clipper.prototype.DoMaxima = function(e) {
        var eMaxPair = this.GetMaximaPairEx(e);
        if (eMaxPair === null) {
          if (e.OutIdx >= 0)
            this.AddOutPt(e, e.Top);
          this.DeleteFromAEL(e);
          return;
        }
        var eNext = e.NextInAEL;
        while (eNext !== null && eNext !== eMaxPair) {
          this.IntersectEdges(e, eNext, e.Top);
          this.SwapPositionsInAEL(e, eNext);
          eNext = e.NextInAEL;
        }
        if (e.OutIdx === -1 && eMaxPair.OutIdx === -1) {
          this.DeleteFromAEL(e);
          this.DeleteFromAEL(eMaxPair);
        } else if (e.OutIdx >= 0 && eMaxPair.OutIdx >= 0) {
          if (e.OutIdx >= 0) this.AddLocalMaxPoly(e, eMaxPair, e.Top);
          this.DeleteFromAEL(e);
          this.DeleteFromAEL(eMaxPair);
        } else if (ClipperLib.use_lines && e.WindDelta === 0) {
          if (e.OutIdx >= 0) {
            this.AddOutPt(e, e.Top);
            e.OutIdx = ClipperLib.ClipperBase.Unassigned;
          }
          this.DeleteFromAEL(e);
          if (eMaxPair.OutIdx >= 0) {
            this.AddOutPt(eMaxPair, e.Top);
            eMaxPair.OutIdx = ClipperLib.ClipperBase.Unassigned;
          }
          this.DeleteFromAEL(eMaxPair);
        } else
          ClipperLib.Error("DoMaxima error");
      };
      ClipperLib.Clipper.ReversePaths = function(polys) {
        for (var i = 0, len = polys.length; i < len; i++)
          polys[i].reverse();
      };
      ClipperLib.Clipper.Orientation = function(poly) {
        return ClipperLib.Clipper.Area(poly) >= 0;
      };
      ClipperLib.Clipper.prototype.PointCount = function(pts) {
        if (pts === null)
          return 0;
        var result = 0;
        var p = pts;
        do {
          result++;
          p = p.Next;
        } while (p !== pts);
        return result;
      };
      ClipperLib.Clipper.prototype.BuildResult = function(polyg) {
        ClipperLib.Clear(polyg);
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          var outRec = this.m_PolyOuts[i];
          if (outRec.Pts === null)
            continue;
          var p = outRec.Pts.Prev;
          var cnt = this.PointCount(p);
          if (cnt < 2)
            continue;
          var pg = new Array(cnt);
          for (var j = 0; j < cnt; j++) {
            pg[j] = p.Pt;
            p = p.Prev;
          }
          polyg.push(pg);
        }
      };
      ClipperLib.Clipper.prototype.BuildResult2 = function(polytree) {
        polytree.Clear();
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          var outRec = this.m_PolyOuts[i];
          var cnt = this.PointCount(outRec.Pts);
          if (outRec.IsOpen && cnt < 2 || !outRec.IsOpen && cnt < 3)
            continue;
          this.FixHoleLinkage(outRec);
          var pn = new ClipperLib.PolyNode();
          polytree.m_AllPolys.push(pn);
          outRec.PolyNode = pn;
          pn.m_polygon.length = cnt;
          var op = outRec.Pts.Prev;
          for (var j = 0; j < cnt; j++) {
            pn.m_polygon[j] = op.Pt;
            op = op.Prev;
          }
        }
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          var outRec = this.m_PolyOuts[i];
          if (outRec.PolyNode === null)
            continue;
          else if (outRec.IsOpen) {
            outRec.PolyNode.IsOpen = true;
            polytree.AddChild(outRec.PolyNode);
          } else if (outRec.FirstLeft !== null && outRec.FirstLeft.PolyNode !== null)
            outRec.FirstLeft.PolyNode.AddChild(outRec.PolyNode);
          else
            polytree.AddChild(outRec.PolyNode);
        }
      };
      ClipperLib.Clipper.prototype.FixupOutPolyline = function(outRec) {
        var pp = outRec.Pts;
        var lastPP = pp.Prev;
        while (pp !== lastPP) {
          pp = pp.Next;
          if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt)) {
            if (pp === lastPP) {
              lastPP = pp.Prev;
            }
            var tmpPP = pp.Prev;
            tmpPP.Next = pp.Next;
            pp.Next.Prev = tmpPP;
            pp = tmpPP;
          }
        }
        if (pp === pp.Prev) {
          outRec.Pts = null;
        }
      };
      ClipperLib.Clipper.prototype.FixupOutPolygon = function(outRec) {
        var lastOK = null;
        outRec.BottomPt = null;
        var pp = outRec.Pts;
        var preserveCol = this.PreserveCollinear || this.StrictlySimple;
        for (; ; ) {
          if (pp.Prev === pp || pp.Prev === pp.Next) {
            outRec.Pts = null;
            return;
          }
          if (ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Next.Pt) || ClipperLib.IntPoint.op_Equality(pp.Pt, pp.Prev.Pt) || ClipperLib.ClipperBase.SlopesEqual4(pp.Prev.Pt, pp.Pt, pp.Next.Pt, this.m_UseFullRange) && (!preserveCol || !this.Pt2IsBetweenPt1AndPt3(pp.Prev.Pt, pp.Pt, pp.Next.Pt))) {
            lastOK = null;
            pp.Prev.Next = pp.Next;
            pp.Next.Prev = pp.Prev;
            pp = pp.Prev;
          } else if (pp === lastOK)
            break;
          else {
            if (lastOK === null)
              lastOK = pp;
            pp = pp.Next;
          }
        }
        outRec.Pts = pp;
      };
      ClipperLib.Clipper.prototype.DupOutPt = function(outPt, InsertAfter) {
        var result = new ClipperLib.OutPt();
        result.Pt.X = outPt.Pt.X;
        result.Pt.Y = outPt.Pt.Y;
        if (ClipperLib.use_xyz) result.Pt.Z = outPt.Pt.Z;
        result.Idx = outPt.Idx;
        if (InsertAfter) {
          result.Next = outPt.Next;
          result.Prev = outPt;
          outPt.Next.Prev = result;
          outPt.Next = result;
        } else {
          result.Prev = outPt.Prev;
          result.Next = outPt;
          outPt.Prev.Next = result;
          outPt.Prev = result;
        }
        return result;
      };
      ClipperLib.Clipper.prototype.GetOverlap = function(a1, a2, b1, b2, $val) {
        if (a1 < a2) {
          if (b1 < b2) {
            $val.Left = Math.max(a1, b1);
            $val.Right = Math.min(a2, b2);
          } else {
            $val.Left = Math.max(a1, b2);
            $val.Right = Math.min(a2, b1);
          }
        } else {
          if (b1 < b2) {
            $val.Left = Math.max(a2, b1);
            $val.Right = Math.min(a1, b2);
          } else {
            $val.Left = Math.max(a2, b2);
            $val.Right = Math.min(a1, b1);
          }
        }
        return $val.Left < $val.Right;
      };
      ClipperLib.Clipper.prototype.JoinHorz = function(op1, op1b, op2, op2b, Pt, DiscardLeft) {
        var Dir1 = op1.Pt.X > op1b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
        var Dir2 = op2.Pt.X > op2b.Pt.X ? ClipperLib.Direction.dRightToLeft : ClipperLib.Direction.dLeftToRight;
        if (Dir1 === Dir2)
          return false;
        if (Dir1 === ClipperLib.Direction.dLeftToRight) {
          while (op1.Next.Pt.X <= Pt.X && op1.Next.Pt.X >= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
            op1 = op1.Next;
          if (DiscardLeft && op1.Pt.X !== Pt.X)
            op1 = op1.Next;
          op1b = this.DupOutPt(op1, !DiscardLeft);
          if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
            op1 = op1b;
            op1.Pt.X = Pt.X;
            op1.Pt.Y = Pt.Y;
            if (ClipperLib.use_xyz) op1.Pt.Z = Pt.Z;
            op1b = this.DupOutPt(op1, !DiscardLeft);
          }
        } else {
          while (op1.Next.Pt.X >= Pt.X && op1.Next.Pt.X <= op1.Pt.X && op1.Next.Pt.Y === Pt.Y)
            op1 = op1.Next;
          if (!DiscardLeft && op1.Pt.X !== Pt.X)
            op1 = op1.Next;
          op1b = this.DupOutPt(op1, DiscardLeft);
          if (ClipperLib.IntPoint.op_Inequality(op1b.Pt, Pt)) {
            op1 = op1b;
            op1.Pt.X = Pt.X;
            op1.Pt.Y = Pt.Y;
            if (ClipperLib.use_xyz) op1.Pt.Z = Pt.Z;
            op1b = this.DupOutPt(op1, DiscardLeft);
          }
        }
        if (Dir2 === ClipperLib.Direction.dLeftToRight) {
          while (op2.Next.Pt.X <= Pt.X && op2.Next.Pt.X >= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
            op2 = op2.Next;
          if (DiscardLeft && op2.Pt.X !== Pt.X)
            op2 = op2.Next;
          op2b = this.DupOutPt(op2, !DiscardLeft);
          if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
            op2 = op2b;
            op2.Pt.X = Pt.X;
            op2.Pt.Y = Pt.Y;
            if (ClipperLib.use_xyz) op2.Pt.Z = Pt.Z;
            op2b = this.DupOutPt(op2, !DiscardLeft);
          }
        } else {
          while (op2.Next.Pt.X >= Pt.X && op2.Next.Pt.X <= op2.Pt.X && op2.Next.Pt.Y === Pt.Y)
            op2 = op2.Next;
          if (!DiscardLeft && op2.Pt.X !== Pt.X)
            op2 = op2.Next;
          op2b = this.DupOutPt(op2, DiscardLeft);
          if (ClipperLib.IntPoint.op_Inequality(op2b.Pt, Pt)) {
            op2 = op2b;
            op2.Pt.X = Pt.X;
            op2.Pt.Y = Pt.Y;
            if (ClipperLib.use_xyz) op2.Pt.Z = Pt.Z;
            op2b = this.DupOutPt(op2, DiscardLeft);
          }
        }
        if (Dir1 === ClipperLib.Direction.dLeftToRight === DiscardLeft) {
          op1.Prev = op2;
          op2.Next = op1;
          op1b.Next = op2b;
          op2b.Prev = op1b;
        } else {
          op1.Next = op2;
          op2.Prev = op1;
          op1b.Prev = op2b;
          op2b.Next = op1b;
        }
        return true;
      };
      ClipperLib.Clipper.prototype.JoinPoints = function(j, outRec1, outRec2) {
        var op1 = j.OutPt1, op1b = new ClipperLib.OutPt();
        var op2 = j.OutPt2, op2b = new ClipperLib.OutPt();
        var isHorizontal = j.OutPt1.Pt.Y === j.OffPt.Y;
        if (isHorizontal && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt1.Pt) && ClipperLib.IntPoint.op_Equality(j.OffPt, j.OutPt2.Pt)) {
          if (outRec1 !== outRec2) return false;
          op1b = j.OutPt1.Next;
          while (op1b !== op1 && ClipperLib.IntPoint.op_Equality(op1b.Pt, j.OffPt))
            op1b = op1b.Next;
          var reverse1 = op1b.Pt.Y > j.OffPt.Y;
          op2b = j.OutPt2.Next;
          while (op2b !== op2 && ClipperLib.IntPoint.op_Equality(op2b.Pt, j.OffPt))
            op2b = op2b.Next;
          var reverse2 = op2b.Pt.Y > j.OffPt.Y;
          if (reverse1 === reverse2)
            return false;
          if (reverse1) {
            op1b = this.DupOutPt(op1, false);
            op2b = this.DupOutPt(op2, true);
            op1.Prev = op2;
            op2.Next = op1;
            op1b.Next = op2b;
            op2b.Prev = op1b;
            j.OutPt1 = op1;
            j.OutPt2 = op1b;
            return true;
          } else {
            op1b = this.DupOutPt(op1, true);
            op2b = this.DupOutPt(op2, false);
            op1.Next = op2;
            op2.Prev = op1;
            op1b.Prev = op2b;
            op2b.Next = op1b;
            j.OutPt1 = op1;
            j.OutPt2 = op1b;
            return true;
          }
        } else if (isHorizontal) {
          op1b = op1;
          while (op1.Prev.Pt.Y === op1.Pt.Y && op1.Prev !== op1b && op1.Prev !== op2)
            op1 = op1.Prev;
          while (op1b.Next.Pt.Y === op1b.Pt.Y && op1b.Next !== op1 && op1b.Next !== op2)
            op1b = op1b.Next;
          if (op1b.Next === op1 || op1b.Next === op2)
            return false;
          op2b = op2;
          while (op2.Prev.Pt.Y === op2.Pt.Y && op2.Prev !== op2b && op2.Prev !== op1b)
            op2 = op2.Prev;
          while (op2b.Next.Pt.Y === op2b.Pt.Y && op2b.Next !== op2 && op2b.Next !== op1)
            op2b = op2b.Next;
          if (op2b.Next === op2 || op2b.Next === op1)
            return false;
          var $val = {
            Left: null,
            Right: null
          };
          if (!this.GetOverlap(op1.Pt.X, op1b.Pt.X, op2.Pt.X, op2b.Pt.X, $val))
            return false;
          var Left = $val.Left;
          var Right = $val.Right;
          var Pt = new ClipperLib.IntPoint0();
          var DiscardLeftSide;
          if (op1.Pt.X >= Left && op1.Pt.X <= Right) {
            Pt.X = op1.Pt.X;
            Pt.Y = op1.Pt.Y;
            if (ClipperLib.use_xyz) Pt.Z = op1.Pt.Z;
            DiscardLeftSide = op1.Pt.X > op1b.Pt.X;
          } else if (op2.Pt.X >= Left && op2.Pt.X <= Right) {
            Pt.X = op2.Pt.X;
            Pt.Y = op2.Pt.Y;
            if (ClipperLib.use_xyz) Pt.Z = op2.Pt.Z;
            DiscardLeftSide = op2.Pt.X > op2b.Pt.X;
          } else if (op1b.Pt.X >= Left && op1b.Pt.X <= Right) {
            Pt.X = op1b.Pt.X;
            Pt.Y = op1b.Pt.Y;
            if (ClipperLib.use_xyz) Pt.Z = op1b.Pt.Z;
            DiscardLeftSide = op1b.Pt.X > op1.Pt.X;
          } else {
            Pt.X = op2b.Pt.X;
            Pt.Y = op2b.Pt.Y;
            if (ClipperLib.use_xyz) Pt.Z = op2b.Pt.Z;
            DiscardLeftSide = op2b.Pt.X > op2.Pt.X;
          }
          j.OutPt1 = op1;
          j.OutPt2 = op2;
          return this.JoinHorz(op1, op1b, op2, op2b, Pt, DiscardLeftSide);
        } else {
          op1b = op1.Next;
          while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
            op1b = op1b.Next;
          var Reverse1 = op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange);
          if (Reverse1) {
            op1b = op1.Prev;
            while (ClipperLib.IntPoint.op_Equality(op1b.Pt, op1.Pt) && op1b !== op1)
              op1b = op1b.Prev;
            if (op1b.Pt.Y > op1.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op1.Pt, op1b.Pt, j.OffPt, this.m_UseFullRange))
              return false;
          }
          op2b = op2.Next;
          while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
            op2b = op2b.Next;
          var Reverse2 = op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange);
          if (Reverse2) {
            op2b = op2.Prev;
            while (ClipperLib.IntPoint.op_Equality(op2b.Pt, op2.Pt) && op2b !== op2)
              op2b = op2b.Prev;
            if (op2b.Pt.Y > op2.Pt.Y || !ClipperLib.ClipperBase.SlopesEqual4(op2.Pt, op2b.Pt, j.OffPt, this.m_UseFullRange))
              return false;
          }
          if (op1b === op1 || op2b === op2 || op1b === op2b || outRec1 === outRec2 && Reverse1 === Reverse2)
            return false;
          if (Reverse1) {
            op1b = this.DupOutPt(op1, false);
            op2b = this.DupOutPt(op2, true);
            op1.Prev = op2;
            op2.Next = op1;
            op1b.Next = op2b;
            op2b.Prev = op1b;
            j.OutPt1 = op1;
            j.OutPt2 = op1b;
            return true;
          } else {
            op1b = this.DupOutPt(op1, true);
            op2b = this.DupOutPt(op2, false);
            op1.Next = op2;
            op2.Prev = op1;
            op1b.Prev = op2b;
            op2b.Next = op1b;
            j.OutPt1 = op1;
            j.OutPt2 = op1b;
            return true;
          }
        }
      };
      ClipperLib.Clipper.GetBounds = function(paths) {
        var i = 0, cnt = paths.length;
        while (i < cnt && paths[i].length === 0) i++;
        if (i === cnt) return new ClipperLib.IntRect(0, 0, 0, 0);
        var result = new ClipperLib.IntRect();
        result.left = paths[i][0].X;
        result.right = result.left;
        result.top = paths[i][0].Y;
        result.bottom = result.top;
        for (; i < cnt; i++)
          for (var j = 0, jlen = paths[i].length; j < jlen; j++) {
            if (paths[i][j].X < result.left) result.left = paths[i][j].X;
            else if (paths[i][j].X > result.right) result.right = paths[i][j].X;
            if (paths[i][j].Y < result.top) result.top = paths[i][j].Y;
            else if (paths[i][j].Y > result.bottom) result.bottom = paths[i][j].Y;
          }
        return result;
      };
      ClipperLib.Clipper.prototype.GetBounds2 = function(ops) {
        var opStart = ops;
        var result = new ClipperLib.IntRect();
        result.left = ops.Pt.X;
        result.right = ops.Pt.X;
        result.top = ops.Pt.Y;
        result.bottom = ops.Pt.Y;
        ops = ops.Next;
        while (ops !== opStart) {
          if (ops.Pt.X < result.left)
            result.left = ops.Pt.X;
          if (ops.Pt.X > result.right)
            result.right = ops.Pt.X;
          if (ops.Pt.Y < result.top)
            result.top = ops.Pt.Y;
          if (ops.Pt.Y > result.bottom)
            result.bottom = ops.Pt.Y;
          ops = ops.Next;
        }
        return result;
      };
      ClipperLib.Clipper.PointInPolygon = function(pt, path) {
        var result = 0, cnt = path.length;
        if (cnt < 3)
          return 0;
        var ip = path[0];
        for (var i = 1; i <= cnt; ++i) {
          var ipNext = i === cnt ? path[0] : path[i];
          if (ipNext.Y === pt.Y) {
            if (ipNext.X === pt.X || ip.Y === pt.Y && ipNext.X > pt.X === ip.X < pt.X)
              return -1;
          }
          if (ip.Y < pt.Y !== ipNext.Y < pt.Y) {
            if (ip.X >= pt.X) {
              if (ipNext.X > pt.X)
                result = 1 - result;
              else {
                var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
                if (d === 0)
                  return -1;
                else if (d > 0 === ipNext.Y > ip.Y)
                  result = 1 - result;
              }
            } else {
              if (ipNext.X > pt.X) {
                var d = (ip.X - pt.X) * (ipNext.Y - pt.Y) - (ipNext.X - pt.X) * (ip.Y - pt.Y);
                if (d === 0)
                  return -1;
                else if (d > 0 === ipNext.Y > ip.Y)
                  result = 1 - result;
              }
            }
          }
          ip = ipNext;
        }
        return result;
      };
      ClipperLib.Clipper.prototype.PointInPolygon = function(pt, op) {
        var result = 0;
        var startOp = op;
        var ptx = pt.X, pty = pt.Y;
        var poly0x = op.Pt.X, poly0y = op.Pt.Y;
        do {
          op = op.Next;
          var poly1x = op.Pt.X, poly1y = op.Pt.Y;
          if (poly1y === pty) {
            if (poly1x === ptx || poly0y === pty && poly1x > ptx === poly0x < ptx)
              return -1;
          }
          if (poly0y < pty !== poly1y < pty) {
            if (poly0x >= ptx) {
              if (poly1x > ptx)
                result = 1 - result;
              else {
                var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
                if (d === 0)
                  return -1;
                if (d > 0 === poly1y > poly0y)
                  result = 1 - result;
              }
            } else {
              if (poly1x > ptx) {
                var d = (poly0x - ptx) * (poly1y - pty) - (poly1x - ptx) * (poly0y - pty);
                if (d === 0)
                  return -1;
                if (d > 0 === poly1y > poly0y)
                  result = 1 - result;
              }
            }
          }
          poly0x = poly1x;
          poly0y = poly1y;
        } while (startOp !== op);
        return result;
      };
      ClipperLib.Clipper.prototype.Poly2ContainsPoly1 = function(outPt1, outPt2) {
        var op = outPt1;
        do {
          var res = this.PointInPolygon(op.Pt, outPt2);
          if (res >= 0)
            return res > 0;
          op = op.Next;
        } while (op !== outPt1);
        return true;
      };
      ClipperLib.Clipper.prototype.FixupFirstLefts1 = function(OldOutRec, NewOutRec) {
        var outRec, firstLeft;
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          outRec = this.m_PolyOuts[i];
          firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
          if (outRec.Pts !== null && firstLeft === OldOutRec) {
            if (this.Poly2ContainsPoly1(outRec.Pts, NewOutRec.Pts))
              outRec.FirstLeft = NewOutRec;
          }
        }
      };
      ClipperLib.Clipper.prototype.FixupFirstLefts2 = function(innerOutRec, outerOutRec) {
        var orfl = outerOutRec.FirstLeft;
        var outRec, firstLeft;
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          outRec = this.m_PolyOuts[i];
          if (outRec.Pts === null || outRec === outerOutRec || outRec === innerOutRec)
            continue;
          firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
          if (firstLeft !== orfl && firstLeft !== innerOutRec && firstLeft !== outerOutRec)
            continue;
          if (this.Poly2ContainsPoly1(outRec.Pts, innerOutRec.Pts))
            outRec.FirstLeft = innerOutRec;
          else if (this.Poly2ContainsPoly1(outRec.Pts, outerOutRec.Pts))
            outRec.FirstLeft = outerOutRec;
          else if (outRec.FirstLeft === innerOutRec || outRec.FirstLeft === outerOutRec)
            outRec.FirstLeft = orfl;
        }
      };
      ClipperLib.Clipper.prototype.FixupFirstLefts3 = function(OldOutRec, NewOutRec) {
        var outRec;
        var firstLeft;
        for (var i = 0, ilen = this.m_PolyOuts.length; i < ilen; i++) {
          outRec = this.m_PolyOuts[i];
          firstLeft = ClipperLib.Clipper.ParseFirstLeft(outRec.FirstLeft);
          if (outRec.Pts !== null && firstLeft === OldOutRec)
            outRec.FirstLeft = NewOutRec;
        }
      };
      ClipperLib.Clipper.ParseFirstLeft = function(FirstLeft) {
        while (FirstLeft !== null && FirstLeft.Pts === null)
          FirstLeft = FirstLeft.FirstLeft;
        return FirstLeft;
      };
      ClipperLib.Clipper.prototype.JoinCommonEdges = function() {
        for (var i = 0, ilen = this.m_Joins.length; i < ilen; i++) {
          var join = this.m_Joins[i];
          var outRec1 = this.GetOutRec(join.OutPt1.Idx);
          var outRec2 = this.GetOutRec(join.OutPt2.Idx);
          if (outRec1.Pts === null || outRec2.Pts === null)
            continue;
          if (outRec1.IsOpen || outRec2.IsOpen) {
            continue;
          }
          var holeStateRec;
          if (outRec1 === outRec2)
            holeStateRec = outRec1;
          else if (this.OutRec1RightOfOutRec2(outRec1, outRec2))
            holeStateRec = outRec2;
          else if (this.OutRec1RightOfOutRec2(outRec2, outRec1))
            holeStateRec = outRec1;
          else
            holeStateRec = this.GetLowermostRec(outRec1, outRec2);
          if (!this.JoinPoints(join, outRec1, outRec2)) continue;
          if (outRec1 === outRec2) {
            outRec1.Pts = join.OutPt1;
            outRec1.BottomPt = null;
            outRec2 = this.CreateOutRec();
            outRec2.Pts = join.OutPt2;
            this.UpdateOutPtIdxs(outRec2);
            if (this.Poly2ContainsPoly1(outRec2.Pts, outRec1.Pts)) {
              outRec2.IsHole = !outRec1.IsHole;
              outRec2.FirstLeft = outRec1;
              if (this.m_UsingPolyTree)
                this.FixupFirstLefts2(outRec2, outRec1);
              if ((outRec2.IsHole ^ this.ReverseSolution) == this.Area$1(outRec2) > 0)
                this.ReversePolyPtLinks(outRec2.Pts);
            } else if (this.Poly2ContainsPoly1(outRec1.Pts, outRec2.Pts)) {
              outRec2.IsHole = outRec1.IsHole;
              outRec1.IsHole = !outRec2.IsHole;
              outRec2.FirstLeft = outRec1.FirstLeft;
              outRec1.FirstLeft = outRec2;
              if (this.m_UsingPolyTree)
                this.FixupFirstLefts2(outRec1, outRec2);
              if ((outRec1.IsHole ^ this.ReverseSolution) == this.Area$1(outRec1) > 0)
                this.ReversePolyPtLinks(outRec1.Pts);
            } else {
              outRec2.IsHole = outRec1.IsHole;
              outRec2.FirstLeft = outRec1.FirstLeft;
              if (this.m_UsingPolyTree)
                this.FixupFirstLefts1(outRec1, outRec2);
            }
          } else {
            outRec2.Pts = null;
            outRec2.BottomPt = null;
            outRec2.Idx = outRec1.Idx;
            outRec1.IsHole = holeStateRec.IsHole;
            if (holeStateRec === outRec2)
              outRec1.FirstLeft = outRec2.FirstLeft;
            outRec2.FirstLeft = outRec1;
            if (this.m_UsingPolyTree)
              this.FixupFirstLefts3(outRec2, outRec1);
          }
        }
      };
      ClipperLib.Clipper.prototype.UpdateOutPtIdxs = function(outrec) {
        var op = outrec.Pts;
        do {
          op.Idx = outrec.Idx;
          op = op.Prev;
        } while (op !== outrec.Pts);
      };
      ClipperLib.Clipper.prototype.DoSimplePolygons = function() {
        var i = 0;
        while (i < this.m_PolyOuts.length) {
          var outrec = this.m_PolyOuts[i++];
          var op = outrec.Pts;
          if (op === null || outrec.IsOpen)
            continue;
          do {
            var op2 = op.Next;
            while (op2 !== outrec.Pts) {
              if (ClipperLib.IntPoint.op_Equality(op.Pt, op2.Pt) && op2.Next !== op && op2.Prev !== op) {
                var op3 = op.Prev;
                var op4 = op2.Prev;
                op.Prev = op4;
                op4.Next = op;
                op2.Prev = op3;
                op3.Next = op2;
                outrec.Pts = op;
                var outrec2 = this.CreateOutRec();
                outrec2.Pts = op2;
                this.UpdateOutPtIdxs(outrec2);
                if (this.Poly2ContainsPoly1(outrec2.Pts, outrec.Pts)) {
                  outrec2.IsHole = !outrec.IsHole;
                  outrec2.FirstLeft = outrec;
                  if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec2, outrec);
                } else if (this.Poly2ContainsPoly1(outrec.Pts, outrec2.Pts)) {
                  outrec2.IsHole = outrec.IsHole;
                  outrec.IsHole = !outrec2.IsHole;
                  outrec2.FirstLeft = outrec.FirstLeft;
                  outrec.FirstLeft = outrec2;
                  if (this.m_UsingPolyTree) this.FixupFirstLefts2(outrec, outrec2);
                } else {
                  outrec2.IsHole = outrec.IsHole;
                  outrec2.FirstLeft = outrec.FirstLeft;
                  if (this.m_UsingPolyTree) this.FixupFirstLefts1(outrec, outrec2);
                }
                op2 = op;
              }
              op2 = op2.Next;
            }
            op = op.Next;
          } while (op !== outrec.Pts);
        }
      };
      ClipperLib.Clipper.Area = function(poly) {
        if (!Array.isArray(poly))
          return 0;
        var cnt = poly.length;
        if (cnt < 3)
          return 0;
        var a = 0;
        for (var i = 0, j = cnt - 1; i < cnt; ++i) {
          a += (poly[j].X + poly[i].X) * (poly[j].Y - poly[i].Y);
          j = i;
        }
        return -a * 0.5;
      };
      ClipperLib.Clipper.prototype.Area = function(op) {
        var opFirst = op;
        if (op === null) return 0;
        var a = 0;
        do {
          a = a + (op.Prev.Pt.X + op.Pt.X) * (op.Prev.Pt.Y - op.Pt.Y);
          op = op.Next;
        } while (op !== opFirst);
        return a * 0.5;
      };
      ClipperLib.Clipper.prototype.Area$1 = function(outRec) {
        return this.Area(outRec.Pts);
      };
      ClipperLib.Clipper.SimplifyPolygon = function(poly, fillType) {
        var result = new Array();
        var c = new ClipperLib.Clipper(0);
        c.StrictlySimple = true;
        c.AddPath(poly, ClipperLib.PolyType.ptSubject, true);
        c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
        return result;
      };
      ClipperLib.Clipper.SimplifyPolygons = function(polys, fillType) {
        if (typeof fillType === "undefined") fillType = ClipperLib.PolyFillType.pftEvenOdd;
        var result = new Array();
        var c = new ClipperLib.Clipper(0);
        c.StrictlySimple = true;
        c.AddPaths(polys, ClipperLib.PolyType.ptSubject, true);
        c.Execute(ClipperLib.ClipType.ctUnion, result, fillType, fillType);
        return result;
      };
      ClipperLib.Clipper.DistanceSqrd = function(pt1, pt2) {
        var dx = pt1.X - pt2.X;
        var dy = pt1.Y - pt2.Y;
        return dx * dx + dy * dy;
      };
      ClipperLib.Clipper.DistanceFromLineSqrd = function(pt, ln1, ln2) {
        var A = ln1.Y - ln2.Y;
        var B = ln2.X - ln1.X;
        var C = A * ln1.X + B * ln1.Y;
        C = A * pt.X + B * pt.Y - C;
        return C * C / (A * A + B * B);
      };
      ClipperLib.Clipper.SlopesNearCollinear = function(pt1, pt2, pt3, distSqrd) {
        if (Math.abs(pt1.X - pt2.X) > Math.abs(pt1.Y - pt2.Y)) {
          if (pt1.X > pt2.X === pt1.X < pt3.X)
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
          else if (pt2.X > pt1.X === pt2.X < pt3.X)
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
          else
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
        } else {
          if (pt1.Y > pt2.Y === pt1.Y < pt3.Y)
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt1, pt2, pt3) < distSqrd;
          else if (pt2.Y > pt1.Y === pt2.Y < pt3.Y)
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt2, pt1, pt3) < distSqrd;
          else
            return ClipperLib.Clipper.DistanceFromLineSqrd(pt3, pt1, pt2) < distSqrd;
        }
      };
      ClipperLib.Clipper.PointsAreClose = function(pt1, pt2, distSqrd) {
        var dx = pt1.X - pt2.X;
        var dy = pt1.Y - pt2.Y;
        return dx * dx + dy * dy <= distSqrd;
      };
      ClipperLib.Clipper.ExcludeOp = function(op) {
        var result = op.Prev;
        result.Next = op.Next;
        op.Next.Prev = result;
        result.Idx = 0;
        return result;
      };
      ClipperLib.Clipper.CleanPolygon = function(path, distance2) {
        if (typeof distance2 === "undefined") distance2 = 1.415;
        var cnt = path.length;
        if (cnt === 0)
          return new Array();
        var outPts = new Array(cnt);
        for (var i = 0; i < cnt; ++i)
          outPts[i] = new ClipperLib.OutPt();
        for (var i = 0; i < cnt; ++i) {
          outPts[i].Pt = path[i];
          outPts[i].Next = outPts[(i + 1) % cnt];
          outPts[i].Next.Prev = outPts[i];
          outPts[i].Idx = 0;
        }
        var distSqrd = distance2 * distance2;
        var op = outPts[0];
        while (op.Idx === 0 && op.Next !== op.Prev) {
          if (ClipperLib.Clipper.PointsAreClose(op.Pt, op.Prev.Pt, distSqrd)) {
            op = ClipperLib.Clipper.ExcludeOp(op);
            cnt--;
          } else if (ClipperLib.Clipper.PointsAreClose(op.Prev.Pt, op.Next.Pt, distSqrd)) {
            ClipperLib.Clipper.ExcludeOp(op.Next);
            op = ClipperLib.Clipper.ExcludeOp(op);
            cnt -= 2;
          } else if (ClipperLib.Clipper.SlopesNearCollinear(op.Prev.Pt, op.Pt, op.Next.Pt, distSqrd)) {
            op = ClipperLib.Clipper.ExcludeOp(op);
            cnt--;
          } else {
            op.Idx = 1;
            op = op.Next;
          }
        }
        if (cnt < 3)
          cnt = 0;
        var result = new Array(cnt);
        for (var i = 0; i < cnt; ++i) {
          result[i] = new ClipperLib.IntPoint1(op.Pt);
          op = op.Next;
        }
        outPts = null;
        return result;
      };
      ClipperLib.Clipper.CleanPolygons = function(polys, distance2) {
        var result = new Array(polys.length);
        for (var i = 0, ilen = polys.length; i < ilen; i++)
          result[i] = ClipperLib.Clipper.CleanPolygon(polys[i], distance2);
        return result;
      };
      ClipperLib.Clipper.Minkowski = function(pattern, path, IsSum, IsClosed) {
        var delta = IsClosed ? 1 : 0;
        var polyCnt = pattern.length;
        var pathCnt = path.length;
        var result = new Array();
        if (IsSum)
          for (var i = 0; i < pathCnt; i++) {
            var p = new Array(polyCnt);
            for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
              p[j] = new ClipperLib.IntPoint2(path[i].X + ip.X, path[i].Y + ip.Y);
            result.push(p);
          }
        else
          for (var i = 0; i < pathCnt; i++) {
            var p = new Array(polyCnt);
            for (var j = 0, jlen = pattern.length, ip = pattern[j]; j < jlen; j++, ip = pattern[j])
              p[j] = new ClipperLib.IntPoint2(path[i].X - ip.X, path[i].Y - ip.Y);
            result.push(p);
          }
        var quads = new Array();
        for (var i = 0; i < pathCnt - 1 + delta; i++)
          for (var j = 0; j < polyCnt; j++) {
            var quad = new Array();
            quad.push(result[i % pathCnt][j % polyCnt]);
            quad.push(result[(i + 1) % pathCnt][j % polyCnt]);
            quad.push(result[(i + 1) % pathCnt][(j + 1) % polyCnt]);
            quad.push(result[i % pathCnt][(j + 1) % polyCnt]);
            if (!ClipperLib.Clipper.Orientation(quad))
              quad.reverse();
            quads.push(quad);
          }
        return quads;
      };
      ClipperLib.Clipper.MinkowskiSum = function(pattern, path_or_paths, pathIsClosed) {
        if (!(path_or_paths[0] instanceof Array)) {
          var path = path_or_paths;
          var paths = ClipperLib.Clipper.Minkowski(pattern, path, true, pathIsClosed);
          var c = new ClipperLib.Clipper();
          c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
          c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
          return paths;
        } else {
          var paths = path_or_paths;
          var solution = new ClipperLib.Paths();
          var c = new ClipperLib.Clipper();
          for (var i = 0; i < paths.length; ++i) {
            var tmp = ClipperLib.Clipper.Minkowski(pattern, paths[i], true, pathIsClosed);
            c.AddPaths(tmp, ClipperLib.PolyType.ptSubject, true);
            if (pathIsClosed) {
              var path = ClipperLib.Clipper.TranslatePath(paths[i], pattern[0]);
              c.AddPath(path, ClipperLib.PolyType.ptClip, true);
            }
          }
          c.Execute(
            ClipperLib.ClipType.ctUnion,
            solution,
            ClipperLib.PolyFillType.pftNonZero,
            ClipperLib.PolyFillType.pftNonZero
          );
          return solution;
        }
      };
      ClipperLib.Clipper.TranslatePath = function(path, delta) {
        var outPath = new ClipperLib.Path();
        for (var i = 0; i < path.length; i++)
          outPath.push(new ClipperLib.IntPoint2(path[i].X + delta.X, path[i].Y + delta.Y));
        return outPath;
      };
      ClipperLib.Clipper.MinkowskiDiff = function(poly1, poly2) {
        var paths = ClipperLib.Clipper.Minkowski(poly1, poly2, false, true);
        var c = new ClipperLib.Clipper();
        c.AddPaths(paths, ClipperLib.PolyType.ptSubject, true);
        c.Execute(ClipperLib.ClipType.ctUnion, paths, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
        return paths;
      };
      ClipperLib.Clipper.PolyTreeToPaths = function(polytree) {
        var result = new Array();
        ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntAny, result);
        return result;
      };
      ClipperLib.Clipper.AddPolyNodeToPaths = function(polynode, nt, paths) {
        var match = true;
        switch (nt) {
          case ClipperLib.Clipper.NodeType.ntOpen:
            return;
          case ClipperLib.Clipper.NodeType.ntClosed:
            match = !polynode.IsOpen;
            break;
          default:
            break;
        }
        if (polynode.m_polygon.length > 0 && match)
          paths.push(polynode.m_polygon);
        for (var $i3 = 0, $t3 = polynode.Childs(), $l3 = $t3.length, pn = $t3[$i3]; $i3 < $l3; $i3++, pn = $t3[$i3])
          ClipperLib.Clipper.AddPolyNodeToPaths(pn, nt, paths);
      };
      ClipperLib.Clipper.OpenPathsFromPolyTree = function(polytree) {
        var result = new ClipperLib.Paths();
        for (var i = 0, ilen = polytree.ChildCount(); i < ilen; i++)
          if (polytree.Childs()[i].IsOpen)
            result.push(polytree.Childs()[i].m_polygon);
        return result;
      };
      ClipperLib.Clipper.ClosedPathsFromPolyTree = function(polytree) {
        var result = new ClipperLib.Paths();
        ClipperLib.Clipper.AddPolyNodeToPaths(polytree, ClipperLib.Clipper.NodeType.ntClosed, result);
        return result;
      };
      Inherit(ClipperLib.Clipper, ClipperLib.ClipperBase);
      ClipperLib.Clipper.NodeType = {
        ntAny: 0,
        ntOpen: 1,
        ntClosed: 2
      };
      ClipperLib.ClipperOffset = function(miterLimit, arcTolerance) {
        if (typeof miterLimit === "undefined") miterLimit = 2;
        if (typeof arcTolerance === "undefined") arcTolerance = ClipperLib.ClipperOffset.def_arc_tolerance;
        this.m_destPolys = new ClipperLib.Paths();
        this.m_srcPoly = new ClipperLib.Path();
        this.m_destPoly = new ClipperLib.Path();
        this.m_normals = new Array();
        this.m_delta = 0;
        this.m_sinA = 0;
        this.m_sin = 0;
        this.m_cos = 0;
        this.m_miterLim = 0;
        this.m_StepsPerRad = 0;
        this.m_lowest = new ClipperLib.IntPoint0();
        this.m_polyNodes = new ClipperLib.PolyNode();
        this.MiterLimit = miterLimit;
        this.ArcTolerance = arcTolerance;
        this.m_lowest.X = -1;
      };
      ClipperLib.ClipperOffset.two_pi = 6.28318530717959;
      ClipperLib.ClipperOffset.def_arc_tolerance = 0.25;
      ClipperLib.ClipperOffset.prototype.Clear = function() {
        ClipperLib.Clear(this.m_polyNodes.Childs());
        this.m_lowest.X = -1;
      };
      ClipperLib.ClipperOffset.Round = ClipperLib.Clipper.Round;
      ClipperLib.ClipperOffset.prototype.AddPath = function(path, joinType, endType) {
        var highI = path.length - 1;
        if (highI < 0)
          return;
        var newNode = new ClipperLib.PolyNode();
        newNode.m_jointype = joinType;
        newNode.m_endtype = endType;
        if (endType === ClipperLib.EndType.etClosedLine || endType === ClipperLib.EndType.etClosedPolygon)
          while (highI > 0 && ClipperLib.IntPoint.op_Equality(path[0], path[highI]))
            highI--;
        newNode.m_polygon.push(path[0]);
        var j = 0, k = 0;
        for (var i = 1; i <= highI; i++)
          if (ClipperLib.IntPoint.op_Inequality(newNode.m_polygon[j], path[i])) {
            j++;
            newNode.m_polygon.push(path[i]);
            if (path[i].Y > newNode.m_polygon[k].Y || path[i].Y === newNode.m_polygon[k].Y && path[i].X < newNode.m_polygon[k].X)
              k = j;
          }
        if (endType === ClipperLib.EndType.etClosedPolygon && j < 2) return;
        this.m_polyNodes.AddChild(newNode);
        if (endType !== ClipperLib.EndType.etClosedPolygon)
          return;
        if (this.m_lowest.X < 0)
          this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
        else {
          var ip = this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon[this.m_lowest.Y];
          if (newNode.m_polygon[k].Y > ip.Y || newNode.m_polygon[k].Y === ip.Y && newNode.m_polygon[k].X < ip.X)
            this.m_lowest = new ClipperLib.IntPoint2(this.m_polyNodes.ChildCount() - 1, k);
        }
      };
      ClipperLib.ClipperOffset.prototype.AddPaths = function(paths, joinType, endType) {
        for (var i = 0, ilen = paths.length; i < ilen; i++)
          this.AddPath(paths[i], joinType, endType);
      };
      ClipperLib.ClipperOffset.prototype.FixOrientations = function() {
        if (this.m_lowest.X >= 0 && !ClipperLib.Clipper.Orientation(this.m_polyNodes.Childs()[this.m_lowest.X].m_polygon)) {
          for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
            var node = this.m_polyNodes.Childs()[i];
            if (node.m_endtype === ClipperLib.EndType.etClosedPolygon || node.m_endtype === ClipperLib.EndType.etClosedLine && ClipperLib.Clipper.Orientation(node.m_polygon))
              node.m_polygon.reverse();
          }
        } else {
          for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
            var node = this.m_polyNodes.Childs()[i];
            if (node.m_endtype === ClipperLib.EndType.etClosedLine && !ClipperLib.Clipper.Orientation(node.m_polygon))
              node.m_polygon.reverse();
          }
        }
      };
      ClipperLib.ClipperOffset.GetUnitNormal = function(pt1, pt2) {
        var dx = pt2.X - pt1.X;
        var dy = pt2.Y - pt1.Y;
        if (dx === 0 && dy === 0)
          return new ClipperLib.DoublePoint2(0, 0);
        var f = 1 / Math.sqrt(dx * dx + dy * dy);
        dx *= f;
        dy *= f;
        return new ClipperLib.DoublePoint2(dy, -dx);
      };
      ClipperLib.ClipperOffset.prototype.DoOffset = function(delta) {
        this.m_destPolys = new Array();
        this.m_delta = delta;
        if (ClipperLib.ClipperBase.near_zero(delta)) {
          for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
            var node = this.m_polyNodes.Childs()[i];
            if (node.m_endtype === ClipperLib.EndType.etClosedPolygon)
              this.m_destPolys.push(node.m_polygon);
          }
          return;
        }
        if (this.MiterLimit > 2)
          this.m_miterLim = 2 / (this.MiterLimit * this.MiterLimit);
        else
          this.m_miterLim = 0.5;
        var y;
        if (this.ArcTolerance <= 0)
          y = ClipperLib.ClipperOffset.def_arc_tolerance;
        else if (this.ArcTolerance > Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance)
          y = Math.abs(delta) * ClipperLib.ClipperOffset.def_arc_tolerance;
        else
          y = this.ArcTolerance;
        var steps = 3.14159265358979 / Math.acos(1 - y / Math.abs(delta));
        this.m_sin = Math.sin(ClipperLib.ClipperOffset.two_pi / steps);
        this.m_cos = Math.cos(ClipperLib.ClipperOffset.two_pi / steps);
        this.m_StepsPerRad = steps / ClipperLib.ClipperOffset.two_pi;
        if (delta < 0)
          this.m_sin = -this.m_sin;
        for (var i = 0; i < this.m_polyNodes.ChildCount(); i++) {
          var node = this.m_polyNodes.Childs()[i];
          this.m_srcPoly = node.m_polygon;
          var len = this.m_srcPoly.length;
          if (len === 0 || delta <= 0 && (len < 3 || node.m_endtype !== ClipperLib.EndType.etClosedPolygon))
            continue;
          this.m_destPoly = new Array();
          if (len === 1) {
            if (node.m_jointype === ClipperLib.JoinType.jtRound) {
              var X = 1, Y = 0;
              for (var j = 1; j <= steps; j++) {
                this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
                var X2 = X;
                X = X * this.m_cos - this.m_sin * Y;
                Y = X2 * this.m_sin + Y * this.m_cos;
              }
            } else {
              var X = -1, Y = -1;
              for (var j = 0; j < 4; ++j) {
                this.m_destPoly.push(new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + Y * delta)));
                if (X < 0)
                  X = 1;
                else if (Y < 0)
                  Y = 1;
                else
                  X = -1;
              }
            }
            this.m_destPolys.push(this.m_destPoly);
            continue;
          }
          this.m_normals.length = 0;
          for (var j = 0; j < len - 1; j++)
            this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[j], this.m_srcPoly[j + 1]));
          if (node.m_endtype === ClipperLib.EndType.etClosedLine || node.m_endtype === ClipperLib.EndType.etClosedPolygon)
            this.m_normals.push(ClipperLib.ClipperOffset.GetUnitNormal(this.m_srcPoly[len - 1], this.m_srcPoly[0]));
          else
            this.m_normals.push(new ClipperLib.DoublePoint1(this.m_normals[len - 2]));
          if (node.m_endtype === ClipperLib.EndType.etClosedPolygon) {
            var k = len - 1;
            for (var j = 0; j < len; j++)
              k = this.OffsetPoint(j, k, node.m_jointype);
            this.m_destPolys.push(this.m_destPoly);
          } else if (node.m_endtype === ClipperLib.EndType.etClosedLine) {
            var k = len - 1;
            for (var j = 0; j < len; j++)
              k = this.OffsetPoint(j, k, node.m_jointype);
            this.m_destPolys.push(this.m_destPoly);
            this.m_destPoly = new Array();
            var n = this.m_normals[len - 1];
            for (var j = len - 1; j > 0; j--)
              this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
            this.m_normals[0] = new ClipperLib.DoublePoint2(-n.X, -n.Y);
            k = 0;
            for (var j = len - 1; j >= 0; j--)
              k = this.OffsetPoint(j, k, node.m_jointype);
            this.m_destPolys.push(this.m_destPoly);
          } else {
            var k = 0;
            for (var j = 1; j < len - 1; ++j)
              k = this.OffsetPoint(j, k, node.m_jointype);
            var pt1;
            if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
              var j = len - 1;
              pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * delta));
              this.m_destPoly.push(pt1);
              pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X - this.m_normals[j].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y - this.m_normals[j].Y * delta));
              this.m_destPoly.push(pt1);
            } else {
              var j = len - 1;
              k = len - 2;
              this.m_sinA = 0;
              this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j].X, -this.m_normals[j].Y);
              if (node.m_endtype === ClipperLib.EndType.etOpenSquare)
                this.DoSquare(j, k);
              else
                this.DoRound(j, k);
            }
            for (var j = len - 1; j > 0; j--)
              this.m_normals[j] = new ClipperLib.DoublePoint2(-this.m_normals[j - 1].X, -this.m_normals[j - 1].Y);
            this.m_normals[0] = new ClipperLib.DoublePoint2(-this.m_normals[1].X, -this.m_normals[1].Y);
            k = len - 1;
            for (var j = k - 1; j > 0; --j)
              k = this.OffsetPoint(j, k, node.m_jointype);
            if (node.m_endtype === ClipperLib.EndType.etOpenButt) {
              pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X - this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y - this.m_normals[0].Y * delta));
              this.m_destPoly.push(pt1);
              pt1 = new ClipperLib.IntPoint2(ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].X + this.m_normals[0].X * delta), ClipperLib.ClipperOffset.Round(this.m_srcPoly[0].Y + this.m_normals[0].Y * delta));
              this.m_destPoly.push(pt1);
            } else {
              k = 1;
              this.m_sinA = 0;
              if (node.m_endtype === ClipperLib.EndType.etOpenSquare)
                this.DoSquare(0, 1);
              else
                this.DoRound(0, 1);
            }
            this.m_destPolys.push(this.m_destPoly);
          }
        }
      };
      ClipperLib.ClipperOffset.prototype.Execute = function() {
        var a = arguments, ispolytree = a[0] instanceof ClipperLib.PolyTree;
        if (!ispolytree) {
          var solution = a[0], delta = a[1];
          ClipperLib.Clear(solution);
          this.FixOrientations();
          this.DoOffset(delta);
          var clpr = new ClipperLib.Clipper(0);
          clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
          if (delta > 0) {
            clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
          } else {
            var r2 = ClipperLib.Clipper.GetBounds(this.m_destPolys);
            var outer = new ClipperLib.Path();
            outer.push(new ClipperLib.IntPoint2(r2.left - 10, r2.bottom + 10));
            outer.push(new ClipperLib.IntPoint2(r2.right + 10, r2.bottom + 10));
            outer.push(new ClipperLib.IntPoint2(r2.right + 10, r2.top - 10));
            outer.push(new ClipperLib.IntPoint2(r2.left - 10, r2.top - 10));
            clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
            clpr.ReverseSolution = true;
            clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
            if (solution.length > 0)
              solution.splice(0, 1);
          }
        } else {
          var solution = a[0], delta = a[1];
          solution.Clear();
          this.FixOrientations();
          this.DoOffset(delta);
          var clpr = new ClipperLib.Clipper(0);
          clpr.AddPaths(this.m_destPolys, ClipperLib.PolyType.ptSubject, true);
          if (delta > 0) {
            clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftPositive, ClipperLib.PolyFillType.pftPositive);
          } else {
            var r2 = ClipperLib.Clipper.GetBounds(this.m_destPolys);
            var outer = new ClipperLib.Path();
            outer.push(new ClipperLib.IntPoint2(r2.left - 10, r2.bottom + 10));
            outer.push(new ClipperLib.IntPoint2(r2.right + 10, r2.bottom + 10));
            outer.push(new ClipperLib.IntPoint2(r2.right + 10, r2.top - 10));
            outer.push(new ClipperLib.IntPoint2(r2.left - 10, r2.top - 10));
            clpr.AddPath(outer, ClipperLib.PolyType.ptSubject, true);
            clpr.ReverseSolution = true;
            clpr.Execute(ClipperLib.ClipType.ctUnion, solution, ClipperLib.PolyFillType.pftNegative, ClipperLib.PolyFillType.pftNegative);
            if (solution.ChildCount() === 1 && solution.Childs()[0].ChildCount() > 0) {
              var outerNode = solution.Childs()[0];
              solution.Childs()[0] = outerNode.Childs()[0];
              solution.Childs()[0].m_Parent = solution;
              for (var i = 1; i < outerNode.ChildCount(); i++)
                solution.AddChild(outerNode.Childs()[i]);
            } else
              solution.Clear();
          }
        }
      };
      ClipperLib.ClipperOffset.prototype.OffsetPoint = function(j, k, jointype) {
        this.m_sinA = this.m_normals[k].X * this.m_normals[j].Y - this.m_normals[j].X * this.m_normals[k].Y;
        if (Math.abs(this.m_sinA * this.m_delta) < 1) {
          var cosA = this.m_normals[k].X * this.m_normals[j].X + this.m_normals[j].Y * this.m_normals[k].Y;
          if (cosA > 0) {
            this.m_destPoly.push(new ClipperLib.IntPoint2(
              ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
              ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)
            ));
            return k;
          }
        } else if (this.m_sinA > 1)
          this.m_sinA = 1;
        else if (this.m_sinA < -1)
          this.m_sinA = -1;
        if (this.m_sinA * this.m_delta < 0) {
          this.m_destPoly.push(new ClipperLib.IntPoint2(
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[k].X * this.m_delta),
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[k].Y * this.m_delta)
          ));
          this.m_destPoly.push(new ClipperLib.IntPoint1(this.m_srcPoly[j]));
          this.m_destPoly.push(new ClipperLib.IntPoint2(
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)
          ));
        } else
          switch (jointype) {
            case ClipperLib.JoinType.jtMiter: {
              var r2 = 1 + (this.m_normals[j].X * this.m_normals[k].X + this.m_normals[j].Y * this.m_normals[k].Y);
              if (r2 >= this.m_miterLim)
                this.DoMiter(j, k, r2);
              else
                this.DoSquare(j, k);
              break;
            }
            case ClipperLib.JoinType.jtSquare:
              this.DoSquare(j, k);
              break;
            case ClipperLib.JoinType.jtRound:
              this.DoRound(j, k);
              break;
          }
        k = j;
        return k;
      };
      ClipperLib.ClipperOffset.prototype.DoSquare = function(j, k) {
        var dx = Math.tan(Math.atan2(
          this.m_sinA,
          this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y
        ) / 4);
        this.m_destPoly.push(new ClipperLib.IntPoint2(
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[k].X - this.m_normals[k].Y * dx)),
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[k].Y + this.m_normals[k].X * dx))
        ));
        this.m_destPoly.push(new ClipperLib.IntPoint2(
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_delta * (this.m_normals[j].X + this.m_normals[j].Y * dx)),
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_delta * (this.m_normals[j].Y - this.m_normals[j].X * dx))
        ));
      };
      ClipperLib.ClipperOffset.prototype.DoMiter = function(j, k, r2) {
        var q = this.m_delta / r2;
        this.m_destPoly.push(new ClipperLib.IntPoint2(
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + (this.m_normals[k].X + this.m_normals[j].X) * q),
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + (this.m_normals[k].Y + this.m_normals[j].Y) * q)
        ));
      };
      ClipperLib.ClipperOffset.prototype.DoRound = function(j, k) {
        var a = Math.atan2(
          this.m_sinA,
          this.m_normals[k].X * this.m_normals[j].X + this.m_normals[k].Y * this.m_normals[j].Y
        );
        var steps = Math.max(ClipperLib.Cast_Int32(ClipperLib.ClipperOffset.Round(this.m_StepsPerRad * Math.abs(a))), 1);
        var X = this.m_normals[k].X, Y = this.m_normals[k].Y, X2;
        for (var i = 0; i < steps; ++i) {
          this.m_destPoly.push(new ClipperLib.IntPoint2(
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + X * this.m_delta),
            ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + Y * this.m_delta)
          ));
          X2 = X;
          X = X * this.m_cos - this.m_sin * Y;
          Y = X2 * this.m_sin + Y * this.m_cos;
        }
        this.m_destPoly.push(new ClipperLib.IntPoint2(
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].X + this.m_normals[j].X * this.m_delta),
          ClipperLib.ClipperOffset.Round(this.m_srcPoly[j].Y + this.m_normals[j].Y * this.m_delta)
        ));
      };
      ClipperLib.Error = function(message) {
        try {
          throw new Error(message);
        } catch (err) {
          alert(err.message);
        }
      };
      ClipperLib.JS = {};
      ClipperLib.JS.AreaOfPolygon = function(poly, scale) {
        if (!scale) scale = 1;
        return ClipperLib.Clipper.Area(poly) / (scale * scale);
      };
      ClipperLib.JS.AreaOfPolygons = function(poly, scale) {
        if (!scale) scale = 1;
        var area = 0;
        for (var i = 0; i < poly.length; i++) {
          area += ClipperLib.Clipper.Area(poly[i]);
        }
        return area / (scale * scale);
      };
      ClipperLib.JS.BoundsOfPath = function(path, scale) {
        return ClipperLib.JS.BoundsOfPaths([path], scale);
      };
      ClipperLib.JS.BoundsOfPaths = function(paths, scale) {
        if (!scale) scale = 1;
        var bounds = ClipperLib.Clipper.GetBounds(paths);
        bounds.left /= scale;
        bounds.bottom /= scale;
        bounds.right /= scale;
        bounds.top /= scale;
        return bounds;
      };
      ClipperLib.JS.Clean = function(polygon, delta) {
        if (!(polygon instanceof Array)) return [];
        var isPolygons = polygon[0] instanceof Array;
        var polygon = ClipperLib.JS.Clone(polygon);
        if (typeof delta !== "number" || delta === null) {
          ClipperLib.Error("Delta is not a number in Clean().");
          return polygon;
        }
        if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || delta < 0) return polygon;
        if (!isPolygons) polygon = [polygon];
        var k_length = polygon.length;
        var len, poly, result, d, p, j, i;
        var results = [];
        for (var k = 0; k < k_length; k++) {
          poly = polygon[k];
          len = poly.length;
          if (len === 0) continue;
          else if (len < 3) {
            result = poly;
            results.push(result);
            continue;
          }
          result = poly;
          d = delta * delta;
          p = poly[0];
          j = 1;
          for (i = 1; i < len; i++) {
            if ((poly[i].X - p.X) * (poly[i].X - p.X) + (poly[i].Y - p.Y) * (poly[i].Y - p.Y) <= d)
              continue;
            result[j] = poly[i];
            p = poly[i];
            j++;
          }
          p = poly[j - 1];
          if ((poly[0].X - p.X) * (poly[0].X - p.X) + (poly[0].Y - p.Y) * (poly[0].Y - p.Y) <= d)
            j--;
          if (j < len)
            result.splice(j, len - j);
          if (result.length) results.push(result);
        }
        if (!isPolygons && results.length) results = results[0];
        else if (!isPolygons && results.length === 0) results = [];
        else if (isPolygons && results.length === 0) results = [
          []
        ];
        return results;
      };
      ClipperLib.JS.Clone = function(polygon) {
        if (!(polygon instanceof Array)) return [];
        if (polygon.length === 0) return [];
        else if (polygon.length === 1 && polygon[0].length === 0) return [
          []
        ];
        var isPolygons = polygon[0] instanceof Array;
        if (!isPolygons) polygon = [polygon];
        var len = polygon.length, plen, i, j, result;
        var results = new Array(len);
        for (i = 0; i < len; i++) {
          plen = polygon[i].length;
          result = new Array(plen);
          for (j = 0; j < plen; j++) {
            result[j] = {
              X: polygon[i][j].X,
              Y: polygon[i][j].Y
            };
          }
          results[i] = result;
        }
        if (!isPolygons) results = results[0];
        return results;
      };
      ClipperLib.JS.Lighten = function(polygon, tolerance) {
        if (!(polygon instanceof Array)) return [];
        if (typeof tolerance !== "number" || tolerance === null) {
          ClipperLib.Error("Tolerance is not a number in Lighten().");
          return ClipperLib.JS.Clone(polygon);
        }
        if (polygon.length === 0 || polygon.length === 1 && polygon[0].length === 0 || tolerance < 0) {
          return ClipperLib.JS.Clone(polygon);
        }
        var isPolygons = polygon[0] instanceof Array;
        if (!isPolygons) polygon = [polygon];
        var i, j, poly, k, poly2, plen, A, B, P, d, rem, addlast;
        var bxax, byay, l, ax, ay;
        var len = polygon.length;
        var toleranceSq = tolerance * tolerance;
        var results = [];
        for (i = 0; i < len; i++) {
          poly = polygon[i];
          plen = poly.length;
          if (plen === 0) continue;
          for (k = 0; k < 1e6; k++) {
            poly2 = [];
            plen = poly.length;
            if (poly[plen - 1].X !== poly[0].X || poly[plen - 1].Y !== poly[0].Y) {
              addlast = 1;
              poly.push(
                {
                  X: poly[0].X,
                  Y: poly[0].Y
                }
              );
              plen = poly.length;
            } else addlast = 0;
            rem = [];
            for (j = 0; j < plen - 2; j++) {
              A = poly[j];
              P = poly[j + 1];
              B = poly[j + 2];
              ax = A.X;
              ay = A.Y;
              bxax = B.X - ax;
              byay = B.Y - ay;
              if (bxax !== 0 || byay !== 0) {
                l = ((P.X - ax) * bxax + (P.Y - ay) * byay) / (bxax * bxax + byay * byay);
                if (l > 1) {
                  ax = B.X;
                  ay = B.Y;
                } else if (l > 0) {
                  ax += bxax * l;
                  ay += byay * l;
                }
              }
              bxax = P.X - ax;
              byay = P.Y - ay;
              d = bxax * bxax + byay * byay;
              if (d <= toleranceSq) {
                rem[j + 1] = 1;
                j++;
              }
            }
            poly2.push(
              {
                X: poly[0].X,
                Y: poly[0].Y
              }
            );
            for (j = 1; j < plen - 1; j++)
              if (!rem[j]) poly2.push(
                {
                  X: poly[j].X,
                  Y: poly[j].Y
                }
              );
            poly2.push(
              {
                X: poly[plen - 1].X,
                Y: poly[plen - 1].Y
              }
            );
            if (addlast) poly.pop();
            if (!rem.length) break;
            else poly = poly2;
          }
          plen = poly2.length;
          if (poly2[plen - 1].X === poly2[0].X && poly2[plen - 1].Y === poly2[0].Y) {
            poly2.pop();
          }
          if (poly2.length > 2)
            results.push(poly2);
        }
        if (!isPolygons) {
          results = results[0];
        }
        if (typeof results === "undefined") {
          results = [];
        }
        return results;
      };
      ClipperLib.JS.PerimeterOfPath = function(path, closed, scale) {
        if (typeof path === "undefined") return 0;
        var sqrt = Math.sqrt;
        var perimeter = 0;
        var p1, p2, p1x = 0, p1y = 0, p2x = 0, p2y = 0;
        var j = path.length;
        if (j < 2) return 0;
        if (closed) {
          path[j] = path[0];
          j++;
        }
        while (--j) {
          p1 = path[j];
          p1x = p1.X;
          p1y = p1.Y;
          p2 = path[j - 1];
          p2x = p2.X;
          p2y = p2.Y;
          perimeter += sqrt((p1x - p2x) * (p1x - p2x) + (p1y - p2y) * (p1y - p2y));
        }
        if (closed) path.pop();
        return perimeter / scale;
      };
      ClipperLib.JS.PerimeterOfPaths = function(paths, closed, scale) {
        if (!scale) scale = 1;
        var perimeter = 0;
        for (var i = 0; i < paths.length; i++) {
          perimeter += ClipperLib.JS.PerimeterOfPath(paths[i], closed, scale);
        }
        return perimeter;
      };
      ClipperLib.JS.ScaleDownPath = function(path, scale) {
        var i, p;
        if (!scale) scale = 1;
        i = path.length;
        while (i--) {
          p = path[i];
          p.X = p.X / scale;
          p.Y = p.Y / scale;
        }
      };
      ClipperLib.JS.ScaleDownPaths = function(paths, scale) {
        var i, j, p;
        if (!scale) scale = 1;
        i = paths.length;
        while (i--) {
          j = paths[i].length;
          while (j--) {
            p = paths[i][j];
            p.X = p.X / scale;
            p.Y = p.Y / scale;
          }
        }
      };
      ClipperLib.JS.ScaleUpPath = function(path, scale) {
        var i, p, round = Math.round;
        if (!scale) scale = 1;
        i = path.length;
        while (i--) {
          p = path[i];
          p.X = round(p.X * scale);
          p.Y = round(p.Y * scale);
        }
      };
      ClipperLib.JS.ScaleUpPaths = function(paths, scale) {
        var i, j, p, round = Math.round;
        if (!scale) scale = 1;
        i = paths.length;
        while (i--) {
          j = paths[i].length;
          while (j--) {
            p = paths[i][j];
            p.X = round(p.X * scale);
            p.Y = round(p.Y * scale);
          }
        }
      };
      ClipperLib.ExPolygons = function() {
        return [];
      };
      ClipperLib.ExPolygon = function() {
        this.outer = null;
        this.holes = null;
      };
      ClipperLib.JS.AddOuterPolyNodeToExPolygons = function(polynode, expolygons) {
        var ep = new ClipperLib.ExPolygon();
        ep.outer = polynode.Contour();
        var childs = polynode.Childs();
        var ilen = childs.length;
        ep.holes = new Array(ilen);
        var node, n, i, j, childs2, jlen;
        for (i = 0; i < ilen; i++) {
          node = childs[i];
          ep.holes[i] = node.Contour();
          for (j = 0, childs2 = node.Childs(), jlen = childs2.length; j < jlen; j++) {
            n = childs2[j];
            ClipperLib.JS.AddOuterPolyNodeToExPolygons(n, expolygons);
          }
        }
        expolygons.push(ep);
      };
      ClipperLib.JS.ExPolygonsToPaths = function(expolygons) {
        var a, i, alen, ilen;
        var paths = new ClipperLib.Paths();
        for (a = 0, alen = expolygons.length; a < alen; a++) {
          paths.push(expolygons[a].outer);
          for (i = 0, ilen = expolygons[a].holes.length; i < ilen; i++) {
            paths.push(expolygons[a].holes[i]);
          }
        }
        return paths;
      };
      ClipperLib.JS.PolyTreeToExPolygons = function(polytree) {
        var expolygons = new ClipperLib.ExPolygons();
        var node, i, childs, ilen;
        for (i = 0, childs = polytree.Childs(), ilen = childs.length; i < ilen; i++) {
          node = childs[i];
          ClipperLib.JS.AddOuterPolyNodeToExPolygons(node, expolygons);
        }
        return expolygons;
      };
    })();
    clipper_default = module2.exports;
  }
});

// src/core/clip.js
function treeToRegions(tree) {
  const regions = [];
  const walk = (node) => {
    for (const child of node.Childs()) {
      if (!child.IsHole()) {
        const outer = child.Contour().map((q) => [q.X / S, q.Y / S]);
        const holes = child.Childs().map((h) => h.Contour().map((q) => [q.X / S, q.Y / S]));
        regions.push({ outer, holes });
        for (const h of child.Childs()) for (const inner of h.Childs()) walk({ Childs: () => [inner] });
      }
    }
  };
  walk(tree);
  return regions;
}
function run(op, subject, clip, fill) {
  const c = new clipper_default.Clipper();
  c.AddPaths(toC(subject), clipper_default.PolyType.ptSubject, true);
  if (clip && clip.length) c.AddPaths(toC(clip), clipper_default.PolyType.ptClip, true);
  const tree = new clipper_default.PolyTree();
  c.Execute(op, tree, fill, fill);
  return treeToRegions(tree);
}
function normalise(rings) {
  return run(clipper_default.ClipType.ctUnion, rings, [], FILL.EVEN_ODD);
}
function offsetRegions(regions, delta, { join = "ROUND", miterLimit = 3, arcTol = 0.25 } = {}) {
  if (Math.abs(delta) < 1e-9) return regions;
  const co = new clipper_default.ClipperOffset(miterLimit, arcTol * S);
  for (const reg of regions) {
    co.AddPath(toC([reg.outer])[0], JOIN[join], clipper_default.EndType.etClosedPolygon);
    for (const h of reg.holes) co.AddPath(toC([h])[0], JOIN[join], clipper_default.EndType.etClosedPolygon);
  }
  const tree = new clipper_default.PolyTree();
  co.Execute(tree, delta * S);
  return treeToRegions(tree);
}
var S, toC, FILL, JOIN;
var init_clip = __esm({
  "src/core/clip.js"() {
    init_clipper();
    S = 100;
    toC = (rings) => rings.map((r2) => r2.map(([x, y]) => ({ X: Math.round(x * S), Y: Math.round(y * S) })));
    FILL = { EVEN_ODD: clipper_default.PolyFillType.pftEvenOdd, NON_ZERO: clipper_default.PolyFillType.pftNonZero };
    JOIN = { ROUND: clipper_default.JoinType.jtRound, MITER: clipper_default.JoinType.jtMiter, SQUARE: clipper_default.JoinType.jtSquare };
  }
});

// src/core/geometry.js
function flattenCubic(p0, p1, p2, p3, tol = 0.5, out = [], depth = 0) {
  const dx = p3[0] - p0[0], dy = p3[1] - p0[1];
  const len = Math.hypot(dx, dy);
  let d1, d2;
  if (len < 1e-9) {
    d1 = dist(p0, p1);
    d2 = dist(p0, p2);
  } else {
    d1 = Math.abs((p1[0] - p0[0]) * dy - (p1[1] - p0[1]) * dx) / len;
    d2 = Math.abs((p2[0] - p0[0]) * dy - (p2[1] - p0[1]) * dx) / len;
  }
  if (Math.max(d1, d2) <= tol || depth > 16) {
    out.push(p3);
    return out;
  }
  const p01 = lerp(p0, p1, 0.5), p12 = lerp(p1, p2, 0.5), p23 = lerp(p2, p3, 0.5);
  const a = lerp(p01, p12, 0.5), b2 = lerp(p12, p23, 0.5), m = lerp(a, b2, 0.5);
  flattenCubic(p0, p01, a, m, tol, out, depth + 1);
  flattenCubic(m, b2, p23, p3, tol, out, depth + 1);
  return out;
}
function flattenSegments(segs, tol = 0.5) {
  if (!segs.length) return [];
  const pts = [segs[0].p0];
  for (const s of segs) flattenCubic(s.p0, s.c1, s.c2, s.p3, tol, pts);
  return pts;
}
function pointInRing(pt, ring) {
  let inside = false;
  const [x, y] = pt;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if (yi > y !== yj > y && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function pointInRings(pt, rings) {
  let inside = false;
  for (const r2 of rings) if (pointInRing(pt, r2)) inside = !inside;
  return inside;
}
function dedupe(pts, eps = 1e-6, closed = false) {
  const out = [];
  for (const p of pts) if (!out.length || dist(out[out.length - 1], p) > eps) out.push(p);
  if (closed && out.length > 1 && dist(out[0], out[out.length - 1]) <= eps) out.pop();
  return out;
}
function rotatePoint(p, angle, c = [0, 0]) {
  const s = Math.sin(angle), co = Math.cos(angle);
  const x = p[0] - c[0], y = p[1] - c[1];
  return [c[0] + x * co - y * s, c[1] + x * s + y * co];
}
function scanlineX(rings, y) {
  const xs = [];
  for (const ring of rings) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const a = ring[i], b2 = ring[(i + 1) % n];
      if (a[1] === b2[1]) continue;
      const lo = a[1] < b2[1] ? a : b2, hi = a[1] < b2[1] ? b2 : a;
      if (y >= lo[1] && y < hi[1]) xs.push(lo[0] + (y - lo[1]) / (hi[1] - lo[1]) * (hi[0] - lo[0]));
    }
  }
  return xs.sort((p, q) => p - q);
}
function arcTable(pts, closed = false) {
  const P = closed ? [...pts, pts[0]] : pts;
  const cum = [0];
  for (let i = 1; i < P.length; i++) cum.push(cum[i - 1] + dist(P[i - 1], P[i]));
  return { pts: P, cum, length: cum[cum.length - 1] };
}
function pointAt(table, s) {
  const { pts, cum, length } = table;
  if (s <= 0) s = 0;
  if (s >= length) s = length;
  let lo = 0, hi = cum.length - 1;
  while (hi - lo > 1) {
    const m = lo + hi >> 1;
    if (cum[m] <= s) lo = m;
    else hi = m;
  }
  const seg = cum[hi] - cum[lo];
  const t = seg > 0 ? (s - cum[lo]) / seg : 0;
  const a = pts[lo], b2 = pts[hi];
  const tx = seg > 0 ? (b2[0] - a[0]) / seg : 1, ty = seg > 0 ? (b2[1] - a[1]) / seg : 0;
  return { p: [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t], tangent: [tx, ty], index: lo };
}
function resample(pts, step, closed = false) {
  const tb = arcTable(pts, closed);
  if (tb.length === 0) return [pts[0]];
  const n = Math.max(1, Math.round(tb.length / step));
  const out = [];
  for (let i = 0; i <= n; i++) out.push(pointAt(tb, tb.length * i / n).p);
  if (closed) out.pop();
  return out;
}
function isCorner(prev, cur, next, angleDeg = 30) {
  const a1 = Math.atan2(cur[1] - prev[1], cur[0] - prev[0]);
  const a2 = Math.atan2(next[1] - cur[1], next[0] - cur[0]);
  let d = Math.abs(a2 - a1);
  if (d > Math.PI) d = 2 * Math.PI - d;
  return d * 180 / Math.PI > angleDeg;
}
var dist, lerp;
var init_geometry = __esm({
  "src/core/geometry.js"() {
    dist = (a, b2) => Math.hypot(b2[0] - a[0], b2[1] - a[1]);
    lerp = (a, b2, t) => [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];
  }
});

// src/stitch/fill-util.js
function segmentInside(a, b2, rings, step = 2, interiorOnly = false) {
  const L = dist(a, b2);
  if (L < 1e-6) return true;
  const n = Math.max(2, Math.ceil(L / step));
  for (let i = interiorOnly ? 1 : 0; i <= (interiorOnly ? n - 1 : n); i++) {
    const t = i / n;
    if (!pointInRings([a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t], rings)) return false;
  }
  return true;
}
var regionsToRingsSafe;
var init_fill_util = __esm({
  "src/stitch/fill-util.js"() {
    init_geometry();
    regionsToRingsSafe = (regions) => regions.flatMap((r2) => [r2.outer, ...r2.holes]);
  }
});

// src/stitch/running.js
function runningPoints(pts, len, { closed = false, cornerAngle = 30 } = {}) {
  let P = dedupe(pts, 1e-6, closed);
  if (P.length < 2) return P.slice();
  if (closed) P = [...P, P[0]];
  const anchor = /* @__PURE__ */ new Set([0, P.length - 1]);
  for (let i = 1; i < P.length - 1; i++) if (isCorner(P[i - 1], P[i], P[i + 1], cornerAngle)) anchor.add(i);
  const idx = [...anchor].sort((a, b2) => a - b2);
  const out = [P[0]];
  for (let k = 0; k + 1 < idx.length; k++) {
    const sub = P.slice(idx[k], idx[k + 1] + 1);
    let L = 0;
    for (let i = 1; i < sub.length; i++) L += dist(sub[i - 1], sub[i]);
    const n = Math.max(1, Math.round(L / len));
    const step = L / n;
    let walked = 0, seg = 1, segStart = 0;
    for (let j = 1; j <= n; j++) {
      const target = j * step;
      while (seg < sub.length - 1 && segStart + dist(sub[seg - 1], sub[seg]) < target - 1e-9) {
        segStart += dist(sub[seg - 1], sub[seg]);
        seg++;
      }
      const a = sub[seg - 1], b2 = sub[seg];
      const sl = dist(a, b2);
      const t = sl > 0 ? Math.min(1, Math.max(0, (target - segStart) / sl)) : 0;
      out.push([a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t]);
      walked = target;
    }
    void walked;
  }
  return out;
}
function beanify(pts, extra = 1) {
  if (pts.length < 2) return pts.slice();
  const out = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b2 = pts[i];
    for (let r2 = 0; r2 < extra; r2++) {
      out.push(b2, a);
    }
    out.push(b2);
  }
  return out;
}
function repeatPath(pts, n) {
  if (n <= 1 || pts.length < 2) return pts;
  let out = pts.slice();
  for (let i = 1; i < n; i++) {
    const pass = i % 2 === 1 ? pts.slice().reverse() : pts.slice();
    out = out.concat(pass.slice(1));
  }
  return out;
}
function runningStitch(pts, o) {
  const { stitchLengthDu, repeats = 1, bean = false, beanRepeats = 1, closed = false, cornerAngle = 30 } = o;
  let out = runningPoints(pts, stitchLengthDu, { closed, cornerAngle });
  if (bean) out = beanify(out, beanRepeats);
  return repeatPath(out, repeats);
}
var init_running = __esm({
  "src/stitch/running.js"() {
    init_geometry();
  }
});

// src/stitch/fill.js
function tatamiChains(regions, { angleDeg, spacing, maxLen, stagger, reverseRows = false, flipSide = false }) {
  const theta = angleDeg * Math.PI / 180;
  const rot = (p) => rotatePoint(p, -theta);
  const unrot = (p) => rotatePoint(p, theta);
  const rings = regions.flatMap((r2) => [r2.outer, ...r2.holes]).map((ring) => ring.map(rot));
  if (!rings.length) return [];
  let minY = Infinity, maxY = -Infinity;
  for (const r2 of rings) for (const p of r2) {
    if (p[1] < minY) minY = p[1];
    if (p[1] > maxY) maxY = p[1];
  }
  const k0 = Math.floor(minY / spacing), k1 = Math.ceil(maxY / spacing);
  const period = Math.max(1, stagger | 0);
  const rows = [];
  for (let k = k0; k <= k1; k++) {
    const y = (k + 0.5) * spacing;
    if (y < minY || y > maxY) continue;
    const xs = scanlineX(rings, y);
    const spans = [];
    for (let i = 0; i + 1 < xs.length; i += 2) if (xs[i + 1] - xs[i] >= MIN_ROW) spans.push({ x1: xs[i], x2: xs[i + 1], y, k, used: false });
    if (spans.length) rows.push({ k, y, spans });
  }
  if (!rows.length) return [];
  const order = reverseRows ? [...rows].reverse() : rows;
  const spanPoints = (s, leftToRight) => {
    const off = (s.k % period + period) % period / period * maxLen;
    const minSeg = Math.min(maxLen * 0.25, 3);
    const pts = [[s.x1, s.y]];
    const first = Math.ceil((s.x1 + minSeg - off) / maxLen);
    for (let m = first; ; m++) {
      const x = off + m * maxLen;
      if (x > s.x2 - minSeg) break;
      pts.push([x, s.y]);
    }
    pts.push([s.x2, s.y]);
    return leftToRight ? pts : pts.reverse();
  };
  const overlap = (a, b2) => Math.min(a.x2, b2.x2) - Math.max(a.x1, b2.x1);
  const chains = [];
  for (let ri = 0; ri < order.length; ri++) {
    for (const start of order[ri].spans) {
      if (start.used) continue;
      let cur = start, row = ri, ltr = !flipSide;
      const chain = [];
      for (; ; ) {
        cur.used = true;
        chain.push(...spanPoints(cur, ltr));
        const next = order[row + 1];
        if (!next || Math.abs(next.k - order[row].k) !== 1) break;
        let best = null, bo = MIN_ROW;
        for (const s of next.spans) {
          if (s.used) continue;
          const o = overlap(cur, s);
          if (o > bo) {
            bo = o;
            best = s;
          }
        }
        if (!best) break;
        const a = chain[chain.length - 1];
        const b2 = ltr ? [best.x2, best.y] : [best.x1, best.y];
        if (dist(a, b2) > spacing * 4 && !segmentInside(a, b2, rings, 3, true)) break;
        cur = best;
        row++;
        ltr = !ltr;
      }
      chains.push(chain.map(unrot));
    }
  }
  return chains;
}
function routeChains(chains, regions, { start = null, travelMax = 50 } = {}) {
  if (!chains.length) return [];
  const rings = regionsToRingsSafe(regions);
  const left = chains.map((c) => c.slice());
  const segments2 = [];
  let cur = start;
  let seg = null;
  while (left.length) {
    let bi = 0, bd = Infinity, brev = false;
    for (let i = 0; i < left.length; i++) {
      const c2 = left[i];
      const p = cur ?? c2[0];
      const d0 = dist(p, c2[0]), d1 = dist(p, c2[c2.length - 1]);
      if (d0 < bd) {
        bd = d0;
        bi = i;
        brev = false;
      }
      if (d1 < bd) {
        bd = d1;
        bi = i;
        brev = true;
      }
    }
    let c = left.splice(bi, 1)[0];
    if (brev) c = c.reverse();
    if (seg && cur && bd <= travelMax && segmentInside(cur, c[0], rings, 3, true)) {
      seg.push(...c);
    } else {
      seg = c.slice();
      segments2.push(seg);
    }
    cur = seg[seg.length - 1];
  }
  return segments2;
}
function tatamiFill(regions, o) {
  const { start = null, end = null, travelMax = 50 } = o;
  let best = null, bestCost = Infinity;
  const variants = start || end ? [[false, false], [true, false], [false, true], [true, true]] : [[false, false]];
  for (const [reverseRows, flipSide] of variants) {
    const chains = tatamiChains(regions, { ...o, reverseRows, flipSide });
    const segs = routeChains(chains, regions, { start, travelMax });
    if (!segs.length) continue;
    const first = segs[0][0], last = segs[segs.length - 1][segs[segs.length - 1].length - 1];
    const cost = (start ? dist(first, start) : 0) + (end ? dist(last, end) : 0);
    if (cost < bestCost) {
      bestCost = cost;
      best = segs;
    }
  }
  return best ?? [];
}
function contourFill(regions, { spacing, maxLen, start = null }) {
  const segments2 = [];
  let cur = regions;
  let pos = start;
  let seg = null;
  for (let guard = 0; guard < 2e3 && cur.length; guard++) {
    for (const reg of cur) {
      for (const ring of [reg.outer, ...reg.holes]) {
        let pts = runningPoints(ring, maxLen, { closed: true });
        if (pts.length < 2) continue;
        if (pos) {
          let bi = 0, bd = Infinity;
          pts.forEach((p, i) => {
            const d = dist(p, pos);
            if (d < bd) {
              bd = d;
              bi = i;
            }
          });
          pts = [...pts.slice(bi), ...pts.slice(0, bi)];
        }
        pts.push(pts[0]);
        if (seg && pos && dist(pos, pts[0]) <= spacing * 3) seg.push(...pts);
        else {
          seg = pts;
          segments2.push(seg);
        }
        pos = pts[pts.length - 1];
      }
    }
    cur = offsetRegions(cur, -spacing, { join: "MITER" });
  }
  return segments2;
}
var MIN_ROW;
var init_fill = __esm({
  "src/stitch/fill.js"() {
    init_fill_util();
    init_clip();
    init_running();
    MIN_ROW = 1;
  }
});

// src/stitch/satin.js
function railsFromStroke(center, widthDu, { closed = false, step, cornerAngle = 35 }) {
  let C = dedupe(center, 1e-6, closed);
  if (C.length < 2) return null;
  C = runningPoints(C, step, { closed, cornerAngle });
  if (closed && dist(C[0], C[C.length - 1]) < 1e-6) C.pop();
  const n = C.length;
  const A = [], B = [], mid = [];
  const segN = (p, q) => {
    const d = dist(p, q) || 1;
    return [-(q[1] - p[1]) / d, (q[0] - p[0]) / d];
  };
  for (let i = 0; i < n; i++) {
    const prev = i > 0 ? C[i - 1] : closed ? C[n - 1] : null;
    const next = i < n - 1 ? C[i + 1] : closed ? C[0] : null;
    let nv;
    const n1 = prev ? segN(prev, C[i]) : null, n2 = next ? segN(C[i], next) : null;
    if (n1 && n2) {
      const m = [n1[0] + n2[0], n1[1] + n2[1]];
      const l2 = m[0] * m[0] + m[1] * m[1];
      if (l2 < 1e-9) nv = n1;
      else {
        const k = Math.min(2, 2 / l2 > 0 ? Math.sqrt(2 / (1 + (n1[0] * n2[0] + n1[1] * n2[1]))) : 1);
        const ml = Math.sqrt(l2);
        nv = [m[0] / ml * k, m[1] / ml * k];
      }
    } else nv = n1 || n2;
    const h = widthDu / 2;
    A.push([C[i][0] + nv[0] * h, C[i][1] + nv[1] * h]);
    B.push([C[i][0] - nv[0] * h, C[i][1] - nv[1] * h]);
    mid.push(C[i]);
  }
  if (closed) {
    A.push(A[0]);
    B.push(B[0]);
    mid.push(mid[0]);
  }
  return { A, B, mid };
}
function railsFromShape(ring, step) {
  const P = resample(ring, Math.max(step, 2), true);
  const n = P.length;
  if (n < 6) return null;
  let cx = 0, cy = 0;
  for (const p of P) {
    cx += p[0];
    cy += p[1];
  }
  cx /= n;
  cy /= n;
  let sxx = 0, syy = 0, sxy = 0;
  for (const p of P) {
    const dx = p[0] - cx, dy = p[1] - cy;
    sxx += dx * dx;
    syy += dy * dy;
    sxy += dx * dy;
  }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const ax = Math.cos(ang), ay = Math.sin(ang);
  let imin = 0, imax = 0, pmin = Infinity, pmax = -Infinity;
  P.forEach((p, i) => {
    const t = (p[0] - cx) * ax + (p[1] - cy) * ay;
    if (t < pmin) {
      pmin = t;
      imin = i;
    }
    if (t > pmax) {
      pmax = t;
      imax = i;
    }
  });
  const arc = (from, to) => {
    const out = [P[from]];
    for (let i = from; i !== to; ) {
      i = (i + 1) % n;
      out.push(P[i]);
    }
    return out;
  };
  const r1 = arc(imin, imax);
  const r2 = arc(imax, imin).reverse();
  return { A: r1, B: r2 };
}
function pairRails(A, B, step) {
  const ta = arcTable(A), tb = arcTable(B);
  const L = Math.max(ta.length, tb.length);
  const N = Math.max(2, Math.ceil(L / step));
  const a = [], b2 = [];
  for (let i = 0; i <= N; i++) {
    a.push(pointAt(ta, ta.length * i / N).p);
    b2.push(pointAt(tb, tb.length * i / N).p);
  }
  return { A: a, B: b2 };
}
function zigzag(A, B, maxStitch) {
  const pts = [];
  for (let i = 0; i < A.length; i++) {
    const [p, q] = i % 2 === 0 ? [A[i], B[i]] : [B[i], A[i]];
    pts.push(p);
    const L = dist(p, q);
    if (L > maxStitch) {
      const k = Math.ceil(L / maxStitch);
      for (let j = 1; j < k; j++) pts.push(lerpP(p, q, j / k));
    }
    pts.push(q);
  }
  return pts;
}
function satinColumn(rails, o) {
  const {
    spacing,
    pullComp,
    maxStitch,
    centerWalk,
    contour,
    zigzagUnderlay,
    underlayInset,
    underlayStitch,
    zigzagSpacing,
    shortStitch,
    shortDist,
    shortInset,
    preservePairing = false
  } = o;
  let A, B;
  if (preservePairing) ({ A, B } = rails);
  else ({ A, B } = pairRails(rails.A, rails.B, spacing));
  const n = A.length;
  if (n < 2) return [];
  const widths = A.map((p, i) => dist(p, B[i]));
  const mid = A.map((p, i) => lerpP(p, B[i], 0.5));
  const inset = (X, Y, d) => X.map((p, i) => {
    const w = widths[i];
    if (w < 1e-6) return p;
    return lerpP(p, Y[i], Math.min(0.5, d / w));
  });
  const meanW = widths.reduce((s, v) => s + v, 0) / n;
  const layers = [];
  const walkPts = (path) => runningPoints(path, underlayStitch, { cornerAngle: 40 });
  if (centerWalk) layers.push({ kind: "oneway", make: (rev) => {
    const p = walkPts(mid);
    return rev ? p.slice().reverse() : p;
  } });
  if (contour && meanW > underlayInset * 2 + 2) {
    const Ai = inset(A, B, underlayInset), Bi = inset(B, A, underlayInset);
    layers.push({ kind: "loop", make: (rev) => {
      const a = walkPts(Ai), b2 = walkPts(Bi);
      return rev ? [...a.slice().reverse(), ...b2] : [...a, ...b2.slice().reverse()];
    } });
  }
  if (zigzagUnderlay && meanW > underlayInset * 2 + 2) {
    const Ai = inset(A, B, underlayInset), Bi = inset(B, A, underlayInset);
    const pr = pairRails(Ai, Bi, zigzagSpacing);
    layers.push({ kind: "oneway", make: (rev) => {
      const z = zigzag(pr.A, pr.B, maxStitch);
      return rev ? z.slice().reverse() : z;
    } });
  }
  const A2 = A.map((p) => p.slice()), B2 = B.map((p) => p.slice());
  for (let i = 0; i < n; i++) {
    const w = widths[i];
    if (w < 1e-6 || !pullComp) continue;
    const ux = (A[i][0] - B[i][0]) / w, uy = (A[i][1] - B[i][1]) / w;
    A2[i] = [A[i][0] + ux * pullComp / 2, A[i][1] + uy * pullComp / 2];
    B2[i] = [B[i][0] - ux * pullComp / 2, B[i][1] - uy * pullComp / 2];
  }
  if (shortStitch) {
    for (const [X, Y] of [[A2, B2], [B2, A2]]) {
      let parity = 0, last = X[0];
      for (let i = 1; i < n; i++) {
        if (dist(X[i], last) < shortDist) {
          if (parity++ % 2 === 1) X[i] = lerpP(X[i], Y[i], shortInset);
        } else {
          last = X[i];
          parity = 0;
        }
      }
    }
  }
  layers.push({ kind: "oneway", top: true, make: (rev) => {
    const z = zigzag(A2, B2, maxStitch);
    return rev ? z.slice().reverse() : z;
  } });
  const out = [];
  let atEnd = false;
  for (const L of layers) {
    const rev = atEnd;
    out.push(...L.make(rev));
    if (L.kind === "oneway") atEnd = !atEnd;
  }
  return [out];
}
var lerpP;
var init_satin = __esm({
  "src/stitch/satin.js"() {
    init_geometry();
    init_running();
    lerpP = (a, b2, t) => [a[0] + (b2[0] - a[0]) * t, a[1] + (b2[1] - a[1]) * t];
  }
});

// src/stitch/manual.js
function manualStitch(nodes, { closed = false, repeats = 1 } = {}) {
  let pts = dedupe(nodes, 1e-6, false);
  if (closed && pts.length > 1) pts = [...pts, pts[0]];
  return repeatPath(pts, repeats);
}
var init_manual = __esm({
  "src/stitch/manual.js"() {
    init_geometry();
    init_running();
  }
});

// src/stitch/index.js
function regionsOf(shape) {
  const rings = shape.paths.filter((p) => p.closed && p.points.length >= 3).map((p) => p.points);
  return rings.length ? normalise(rings) : [];
}
function fillBlocks(shape, p, color) {
  let regions = regionsOf(shape);
  if (!regions.length) return [];
  if (p.expand) regions = offsetRegions(regions, du(p.expand));
  if (!regions.length) return [];
  const segments2 = [];
  const startPt = toDu(p.fillStart), endPt = toDu(p.fillEnd);
  let underlayEnd = null;
  if (p.type === "contour") {
    return [{ color, objectId: shape.id, kind: "contour", segments: contourFill(regions, { spacing: du(p.rowSpacing), maxLen: du(p.maxStitchLength), start: startPt }), reversible: false }];
  }
  if (p.fillUnderlay) {
    const ur = offsetRegions(regions, -du(p.fillUnderlayInset));
    if (ur.length) {
      const us = tatamiFill(ur, {
        angleDeg: p.fillAngle + p.fillUnderlayAngle,
        spacing: du(p.fillUnderlaySpacing),
        maxLen: du(p.fillUnderlayMaxStitch),
        stagger: 2,
        start: startPt,
        end: null,
        travelMax: du(p.travelMax)
      });
      segments2.push(...us);
      if (us.length) {
        const l = us[us.length - 1];
        underlayEnd = l[l.length - 1];
      }
    }
  }
  const top = tatamiFill(regions, {
    angleDeg: p.fillAngle,
    spacing: du(p.rowSpacing),
    maxLen: du(p.maxStitchLength),
    stagger: p.stagger,
    start: underlayEnd ?? startPt,
    end: endPt,
    travelMax: du(p.travelMax)
  });
  segments2.push(...top);
  return [{ color, objectId: shape.id, kind: "fill", segments: segments2, reversible: false }];
}
function satinBlocks(shape, p, color, widthDu, source) {
  const spacing = du(p.satinSpacing);
  let rails = null;
  const open = shape.paths.filter((q) => !q.closed && q.points.length >= 2);
  if (p.satinRails) rails = { A: p.satinRails[0], B: p.satinRails[1] };
  else if (open.length === 2 && source === "two-rail") rails = { A: open[0].points, B: open[1].points };
  else if (source === "shape") {
    const ring = shape.paths.find((q) => q.closed && q.points.length >= 3);
    rails = ring ? railsFromShape(ring.points, spacing) : null;
  } else {
    const path = shape.paths[0];
    rails = railsFromStroke(path.points, widthDu, { closed: path.closed, step: spacing });
    if (rails) return [{ color, objectId: shape.id, kind: "satin", reversible: false, segments: satinColumn(rails, satinOpts(p, true)) }];
  }
  if (!rails) return [];
  return [{ color, objectId: shape.id, kind: "satin", reversible: false, segments: satinColumn(rails, satinOpts(p, false)) }];
}
function satinOpts(p, preservePairing) {
  return {
    spacing: du(p.satinSpacing),
    pullComp: du(p.satinPullComp),
    maxStitch: du(p.satinMaxStitch),
    centerWalk: p.satinCenterWalk,
    contour: p.satinContour,
    zigzagUnderlay: p.satinZigzag,
    underlayInset: du(p.satinUnderlayInset),
    underlayStitch: du(p.satinUnderlayStitch),
    zigzagSpacing: du(p.satinZigzagSpacing),
    shortStitch: p.shortStitch,
    shortDist: du(p.shortStitchDistance),
    shortInset: p.shortStitchInset,
    preservePairing
  };
}
function runBlocks(shape, p, color, which) {
  const segs = [];
  for (const path of which) {
    if (path.points.length < 2) continue;
    segs.push(runningStitch(path.points, { stitchLengthDu: du(p.stitchLength), repeats: p.repeats, bean: p.bean, beanRepeats: p.beanRepeats, closed: path.closed, cornerAngle: p.runCornerAngle }));
  }
  return segs.length ? [{ color, objectId: shape.id, kind: "run", segments: segs, reversible: !p.bean && p.repeats <= 1 }] : [];
}
function stitchShape(shape) {
  const p = resolveParams(shape.params);
  const blocks = [];
  const hasClosed = shape.paths.some((q) => q.closed && q.points.length >= 3);
  const fillColor = colorOf(shape.fill, p, 0);
  const strokeColor = shape.stroke ? colorOf(shape.stroke, { threadColor: null }, 0) : fillColor;
  const strokeW = shape.stroke ? shape.stroke.width : 0;
  const type = p.type;
  if (type === "none") return [];
  if (type === "manual") {
    const segs = shape.paths.map((q) => manualStitch(q.nodes ?? q.points, { closed: q.closed, repeats: p.repeats })).filter((s) => s.length > 1);
    return segs.length ? [{ color: colorOf(shape.fill ?? shape.stroke, p), objectId: shape.id, kind: "manual", segments: segs, reversible: false }] : [];
  }
  if (type === "running") return runBlocks(shape, p, colorOf(shape.stroke ?? shape.fill, p), shape.paths);
  if (type === "satin") {
    const color = colorOf(shape.stroke ?? shape.fill, p);
    const open = shape.paths.filter((q) => !q.closed);
    const source = open.length === 2 ? "two-rail" : shape.stroke && !(hasClosed && shape.fill) ? "stroke" : hasClosed ? "shape" : "stroke";
    return satinBlocks(shape, p, color, strokeW || du(p.satinMinWidth * 2), source);
  }
  if (type === "fill" || type === "contour") {
    return fillBlocks(shape, p, shape.fill ? fillColor : colorOf(shape.stroke, p));
  }
  if (shape.fill && hasClosed) blocks.push(...fillBlocks(shape, { ...p, type: "fill" }, fillColor));
  if (shape.stroke && strokeW > 0) {
    const w = strokeW / MM;
    const ps = { ...p, threadColor: null };
    if (w >= p.satinMinWidth) {
      const open = shape.paths.filter((q) => !q.closed);
      const source = open.length === 2 && !shape.fill ? "two-rail" : "stroke";
      for (const path of shape.paths) {
        const sub = { ...shape, paths: [path] };
        blocks.push(...satinBlocks(sub, ps, strokeColor, strokeW, source === "two-rail" ? "stroke" : "stroke"));
      }
    } else blocks.push(...runBlocks(shape, ps, strokeColor, shape.paths));
  }
  return blocks;
}
var colorOf, toDu;
var init_stitch = __esm({
  "src/stitch/index.js"() {
    init_params();
    init_pattern();
    init_clip();
    init_fill();
    init_running();
    init_satin();
    init_manual();
    init_geometry();
    colorOf = (spec, p, fallback = 0) => p.threadColor ? hexToInt(p.threadColor) : spec?.color != null ? typeof spec.color === "number" ? spec.color : hexToInt(spec.color) : fallback;
    toDu = (pt) => pt ? [pt[0] * MM, pt[1] * MM] : null;
  }
});

// src/core/color.js
function distance(c1, c2) {
  const r1 = r(c1), g1 = g(c1), b1 = b(c1), r2 = r(c2), g2 = g(c2), b2 = b(c2);
  const rm = Math.round((r1 + r2) / 2);
  const dr = r1 - r2, dg = g1 - g2, db = b1 - b2;
  return ((512 + rm) * dr * dr >> 8) + 4 * dg * dg + ((767 - rm) * db * db >> 8);
}
function nearestIndex(color, palette) {
  let best = null, bd = Infinity;
  for (let i = 0; i < palette.length; i++) {
    if (!palette[i]) continue;
    const d = distance(color, palette[i].color);
    if (d <= bd) {
      bd = d;
      best = i;
    }
  }
  return best;
}
var r, g, b;
var init_color = __esm({
  "src/core/color.js"() {
    r = (c) => c >> 16 & 255;
    g = (c) => c >> 8 & 255;
    b = (c) => c & 255;
  }
});

// src/plan/palette.js
function loadPalette(json) {
  return {
    brand: json.brand,
    approximate: !!json.approximate,
    threads: json.threads.map((t) => ({ name: t.name, catalog: t.catalog ?? "", color: typeof t.color === "number" ? t.color : hexToInt(t.color) }))
  };
}
function nearestThread(color, palette) {
  let best = null, bd = Infinity;
  for (const t of palette.threads) {
    const d = distance(color, t.color);
    if (d < bd) {
      bd = d;
      best = t;
    }
  }
  return makeThread(best.color, best.name, palette.brand, best.catalog);
}
var init_palette = __esm({
  "src/plan/palette.js"() {
    init_color();
    init_pattern();
  }
});

// src/plan/plan.js
function threadFor(color, palette) {
  return palette ? nearestThread(color, palette) : makeThread(color, intToHex(color), "", "");
}
function orderBlocks(blocks, o) {
  const groups = [];
  if (o.optimise) {
    const byColor = /* @__PURE__ */ new Map();
    for (const b2 of blocks) {
      const key = threadFor(b2.color, o.palette).color;
      if (!byColor.has(key)) {
        byColor.set(key, { thread: threadFor(b2.color, o.palette), blocks: [] });
        groups.push(byColor.get(key));
      }
      byColor.get(key).blocks.push(b2);
    }
  } else {
    for (const b2 of blocks) {
      const th = threadFor(b2.color, o.palette);
      const last = groups[groups.length - 1];
      if (last && last.thread.color === th.color) last.blocks.push(b2);
      else groups.push({ thread: th, blocks: [b2] });
    }
  }
  let pos = o.start ? [o.start[0] * MM, o.start[1] * MM] : [0, 0];
  for (const g2 of groups) {
    if (!o.optimise) {
      for (const b2 of g2.blocks) pos = endOf(b2);
      continue;
    }
    const left = g2.blocks.slice(), ordered = [];
    while (left.length) {
      let bi = 0, bd = Infinity, brev = false;
      left.forEach((b3, i) => {
        const s = startOf(b3), e = endOf(b3);
        const d0 = dist(pos, s);
        if (d0 < bd) {
          bd = d0;
          bi = i;
          brev = false;
        }
        if (b3.reversible) {
          const d1 = dist(pos, e);
          if (d1 < bd) {
            bd = d1;
            bi = i;
            brev = true;
          }
        }
      });
      let b2 = left.splice(bi, 1)[0];
      if (brev) b2 = reverseBlock(b2);
      ordered.push(b2);
      pos = endOf(b2);
    }
    g2.blocks = ordered;
  }
  return groups;
}
function reverseBlock(b2) {
  return { ...b2, segments: b2.segments.slice().reverse().map((s) => s.slice().reverse()) };
}
function lockStitch(p, toward, lenDu) {
  const d = dist(p, toward);
  if (d < 1e-6) return [];
  const l = Math.min(lenDu, d / 2);
  const v = [p[0] + (toward[0] - p[0]) / d * l, p[1] + (toward[1] - p[1]) / d * l];
  return [v, p];
}
function buildPattern(blocks, opts = {}) {
  const o = { ...PLAN_DEFAULTS, ...opts };
  const live = blocks.filter((b2) => b2.segments.some((s) => s.length > 1));
  const pattern = new Pattern();
  if (!live.length) {
    pattern.end();
    return { pattern, stats: computeStats(pattern) };
  }
  const groups = orderBlocks(live, o);
  let off = [0, 0];
  if (o.center) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const g2 of groups) for (const b2 of g2.blocks) for (const s of b2.segments) for (const [x, y] of s) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    off = [-(minX + maxX) / 2, -(minY + maxY) / 2];
  }
  const T = (p) => [p[0] + off[0], p[1] + off[1]];
  const joinMax = o.stitchJoinMax * MM, trimAt = o.trimThreshold * MM, minSt = o.minStitch * MM, tieLen = o.tieLength * MM;
  let cur = null;
  let lastDir = null;
  let needsTieIn = true;
  const put = (p, cmd = CMD.STITCH) => {
    pattern.add(p[0], p[1], cmd);
    cur = p;
  };
  groups.forEach((g2, gi) => {
    if (gi > 0) {
      pattern.colorChange();
      needsTieIn = true;
    }
    pattern.addThread(g2.thread);
    for (const b2 of g2.blocks) {
      for (const seg of b2.segments) {
        const S2 = seg.map(T);
        if (S2.length < 2) continue;
        if (cur === null) {
          pattern.jump(S2[0][0], S2[0][1]);
          cur = S2[0];
          needsTieIn = true;
        } else {
          const gap = dist(cur, S2[0]);
          if (gap > joinMax || needsTieIn && gap > 1e-6) {
            if (!needsTieIn) {
              if (o.tieOff && lastDir) for (const q of lockStitch(cur, lastDir, tieLen)) put(q);
              if (gap > trimAt) pattern.trim();
            }
            pattern.jump(S2[0][0], S2[0][1]);
            cur = S2[0];
            needsTieIn = true;
          }
        }
        if (needsTieIn) {
          put(S2[0]);
          if (o.tieIn) for (const q of lockStitch(S2[0], S2[1], tieLen)) put(q);
          needsTieIn = false;
        } else if (dist(cur, S2[0]) > 1e-6) put(S2[0]);
        for (let i = 1; i < S2.length; i++) {
          if (dist(cur, S2[i]) < minSt && i !== S2.length - 1) continue;
          if (dist(cur, S2[i]) < 1e-6) continue;
          put(S2[i]);
        }
        lastDir = S2.length > 1 ? S2[S2.length - 2] : null;
        if (dist(lastDir ?? cur, cur) < 1e-6 && S2.length > 2) lastDir = S2[S2.length - 3];
      }
    }
    if (o.tieOff && lastDir && cur) for (const q of lockStitch(cur, lastDir, tieLen)) put(q);
    needsTieIn = true;
    lastDir = null;
  });
  pattern.trim();
  pattern.end();
  return { pattern, stats: computeStats(pattern) };
}
function computeStats(pattern) {
  const bd = pattern.bounds();
  const st = pattern.count(CMD.STITCH);
  return {
    stitches: st,
    jumps: pattern.count(CMD.JUMP),
    trims: pattern.count(CMD.TRIM),
    colorChanges: pattern.countColorChanges(),
    colors: pattern.threads.length,
    widthMm: (bd.maxX - bd.minX) / MM,
    heightMm: (bd.maxY - bd.minY) / MM,
    threads: pattern.threads.map((t) => ({ ...t, hex: intToHex(t.color) }))
  };
}
function threadReport(pattern, stats = computeStats(pattern), title = pattern.meta.name) {
  const lines = [];
  lines.push(`Embroidery summary: ${title}`);
  lines.push(`Size: ${stats.widthMm.toFixed(1)} x ${stats.heightMm.toFixed(1)} mm`);
  lines.push(`Stitches: ${stats.stitches}   Jumps: ${stats.jumps}   Trims: ${stats.trims}   Colour changes: ${stats.colorChanges}`);
  lines.push("");
  lines.push("Thread list (in sewing order):");
  const per = new Array(stats.threads.length).fill(0);
  let idx = 0;
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.COLOR_CHANGE) idx++;
    else if (s.cmd === CMD.STITCH) per[idx] = (per[idx] || 0) + 1;
  }
  stats.threads.forEach((t, i) => {
    lines.push(`${String(i + 1).padStart(2)}. ${t.hex}  ${(t.brand ? t.brand + " " : "") + (t.catalog ? t.catalog + " " : "")}${t.name && t.name !== t.hex ? t.name : ""}`.trimEnd() + `  (${per[i] ?? 0} stitches)`);
  });
  return lines.join("\n") + "\n";
}
var PLAN_DEFAULTS, startOf, endOf;
var init_plan = __esm({
  "src/plan/plan.js"() {
    init_pattern();
    init_geometry();
    init_palette();
    init_params();
    PLAN_DEFAULTS = Object.freeze({
      optimise: true,
      // false = keep document order (only merge adjacent same-colour blocks)
      stitchJoinMax: 0.6,
      // mm: gaps up to this are simply stitched, not jumped
      trimThreshold: 3,
      // mm: jumps longer than this get a TRIM first
      tieIn: true,
      tieOff: true,
      tieLength: 0.6,
      // mm
      minStitch: 0.1,
      // mm: points closer than this to the previous one are dropped
      palette: null,
      // Palette object to snap colours to, or null to keep exact RGB
      center: true,
      // translate so the design is centred on the hoop origin
      start: null
      // [x,y] mm preferred start position (design space)
    });
    startOf = (b2) => b2.segments[0][0];
    endOf = (b2) => {
      const s = b2.segments[b2.segments.length - 1];
      return s[s.length - 1];
    };
  }
});

// src/core/encoder.js
function encode(pattern, caps9) {
  const src = pattern.clone();
  fixThreadCount(src);
  const out = src.clone();
  out.stitches = [];
  let px = 0, py = 0;
  let threadIdx = 0;
  const emit = (x, y, cmd) => {
    out.stitches.push({ x, y, cmd });
    px = x;
    py = y;
  };
  for (const s of src.stitches) {
    const x = Math.round(s.x), y = Math.round(s.y);
    switch (s.cmd) {
      case CMD.STITCH:
      case CMD.JUMP: {
        const max = s.cmd === CMD.STITCH ? caps9.maxStitch : caps9.maxJump;
        const dx = x - px, dy = y - py;
        const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / max));
        const sx = px, sy = py;
        for (let i = 1; i <= n; i++) emit(sx + Math.round(dx * i / n), sy + Math.round(dy * i / n), s.cmd);
        break;
      }
      case CMD.COLOR_CHANGE:
        emit(px, py, CMD.COLOR_CHANGE);
        threadIdx++;
        break;
      case CMD.STOP:
        if (caps9.stopAsColor) {
          out.threads.splice(threadIdx, 0, out.threads[threadIdx]);
          threadIdx++;
          emit(px, py, CMD.COLOR_CHANGE);
        } else emit(px, py, CMD.STOP);
        break;
      case CMD.TRIM:
        emit(px, py, CMD.TRIM);
        break;
      case CMD.END:
        break;
    }
  }
  emit(px, py, CMD.END);
  return out;
}
function* colorBlocks(pattern) {
  let idx = 0, last = 0;
  const st = pattern.stitches;
  for (let i = 0; i < st.length; i++) {
    if (st[i].cmd !== CMD.COLOR_CHANGE) continue;
    yield { stitches: st.slice(last, i), thread: pattern.threads[idx] };
    idx++;
    last = i;
  }
  yield { stitches: st.slice(last), thread: pattern.threads[idx] };
}
var init_encoder = __esm({
  "src/core/encoder.js"() {
    init_pattern();
  }
});

// src/formats/dst.js
function record(x, y, kind) {
  y = -y;
  let b0 = 0, b1 = 0, b2 = 0;
  const bit = (n) => 1 << n;
  if (kind === "jump") b2 |= bit(7);
  if (kind === "stitch" || kind === "jump") {
    b2 |= bit(0) | bit(1);
    if (x > 40) {
      b2 |= bit(2);
      x -= 81;
    }
    if (x < -40) {
      b2 |= bit(3);
      x += 81;
    }
    if (x > 13) {
      b1 |= bit(2);
      x -= 27;
    }
    if (x < -13) {
      b1 |= bit(3);
      x += 27;
    }
    if (x > 4) {
      b0 |= bit(2);
      x -= 9;
    }
    if (x < -4) {
      b0 |= bit(3);
      x += 9;
    }
    if (x > 1) {
      b1 |= bit(0);
      x -= 3;
    }
    if (x < -1) {
      b1 |= bit(1);
      x += 3;
    }
    if (x > 0) {
      b0 |= bit(0);
      x -= 1;
    }
    if (x < 0) {
      b0 |= bit(1);
      x += 1;
    }
    if (x !== 0) throw new RangeError("DST dx out of range");
    if (y > 40) {
      b2 |= bit(5);
      y -= 81;
    }
    if (y < -40) {
      b2 |= bit(4);
      y += 81;
    }
    if (y > 13) {
      b1 |= bit(5);
      y -= 27;
    }
    if (y < -13) {
      b1 |= bit(4);
      y += 27;
    }
    if (y > 4) {
      b0 |= bit(5);
      y -= 9;
    }
    if (y < -4) {
      b0 |= bit(4);
      y += 9;
    }
    if (y > 1) {
      b1 |= bit(7);
      y -= 3;
    }
    if (y < -1) {
      b1 |= bit(6);
      y += 3;
    }
    if (y > 0) {
      b0 |= bit(7);
      y -= 1;
    }
    if (y < 0) {
      b0 |= bit(6);
      y += 1;
    }
    if (y !== 0) throw new RangeError("DST dy out of range");
  } else if (kind === "color") b2 = 195;
  else if (kind === "end") b2 = 243;
  return [b0, b1, b2];
}
function write(pattern, opts = {}) {
  const trimAt = opts.trimAt ?? 3;
  const p = encode(pattern, caps);
  const bd = p.bounds();
  const w = new ByteWriter();
  const name = p.meta.name || "Untitled";
  w.str("LA:" + name.padEnd(16, " ") + "\r");
  w.str("ST:" + pad(p.stitches.length, 7) + "\r");
  w.str("CO:" + pad(p.countColorChanges(), 3) + "\r");
  w.str("+X:" + pad(Math.abs(bd.maxX), 5) + "\r");
  w.str("-X:" + pad(Math.abs(bd.minX), 5) + "\r");
  w.str("+Y:" + pad(Math.abs(bd.maxY), 5) + "\r");
  w.str("-Y:" + pad(Math.abs(bd.minY), 5) + "\r");
  let ax = 0, ay = 0;
  if (p.stitches.length) {
    const l = p.stitches[p.stitches.length - 1];
    ax = Math.trunc(l.x);
    ay = -Math.trunc(l.y);
  }
  w.str("AX:" + (ax >= 0 ? "+" : "-") + pad(Math.abs(ax), 5) + "\r");
  w.str("AY:" + (ay >= 0 ? "+" : "-") + pad(Math.abs(ay), 5) + "\r");
  w.str("MX:+" + pad(0, 5) + "\r");
  w.str("MY:+" + pad(0, 5) + "\r");
  w.str("PD:" + "******".padStart(6, " ") + "\r");
  w.u8(26);
  while (w.tell() < 512) w.u8(32);
  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    if (s.cmd === CMD.TRIM) {
      let delta = -4;
      w.bytes(record(-delta / 2, -delta / 2, "jump"));
      for (let i = 1; i < trimAt - 1; i++) {
        w.bytes(record(delta, delta, "jump"));
        delta = -delta;
      }
      w.bytes(record(delta / 2, delta / 2, "jump"));
    } else if (s.cmd === CMD.STITCH) w.bytes(record(dx, dy, "stitch"));
    else if (s.cmd === CMD.JUMP) w.bytes(record(dx, dy, "jump"));
    else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.bytes(record(0, 0, "color"));
    else if (s.cmd === CMD.END) w.bytes(record(0, 0, "end"));
  }
  return w.result();
}
var caps, pad;
var init_dst = __esm({
  "src/formats/dst.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    caps = { maxStitch: 121, maxJump: 121, stopAsColor: false };
    pad = (v, n) => String(v).padStart(n, " ");
  }
});

// src/formats/exp.js
function write2(pattern) {
  const p = encode(pattern, caps2);
  const w = new ByteWriter();
  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    switch (s.cmd) {
      case CMD.STITCH:
        w.u8(dx).u8(-dy);
        break;
      case CMD.JUMP:
        w.u8(128).u8(4).u8(dx).u8(-dy);
        break;
      case CMD.TRIM:
        w.bytes([128, 128, 7, 0]);
        break;
      case CMD.COLOR_CHANGE:
      case CMD.STOP:
        w.bytes([128, 1, 0, 0]);
        break;
      default:
        break;
    }
  }
  return w.result();
}
var caps2;
var init_exp = __esm({
  "src/formats/exp.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    caps2 = { maxStitch: 127, maxJump: 127, stopAsColor: false };
  }
});

// src/data/jef-palette.js
var jef_palette_default;
var init_jef_palette = __esm({
  "src/data/jef-palette.js"() {
    jef_palette_default = [null, { "color": 0, "name": "Black", "catalog": "002" }, { "color": 16777215, "name": "White", "catalog": "001" }, { "color": 16776983, "name": "Yellow", "catalog": "204" }, { "color": 16737792, "name": "Orange", "catalog": "203" }, { "color": 3103027, "name": "Olive Green", "catalog": "219" }, { "color": 2323254, "name": "Green", "catalog": "226" }, { "color": 6669e3, "name": "Sky", "catalog": "217" }, { "color": 11229846, "name": "Purple", "catalog": "208" }, { "color": 16148896, "name": "Pink", "catalog": "201" }, { "color": 16711680, "name": "Red", "catalog": "225" }, { "color": 11628622, "name": "Brown", "catalog": "214" }, { "color": 733060, "name": "Blue", "catalog": "207" }, { "color": 14992221, "name": "Gold", "catalog": "003" }, { "color": 4725253, "name": "Dark Brown", "catalog": "205" }, { "color": 11312327, "name": "Pale Violet", "catalog": "209" }, { "color": 16577172, "name": "Pale Yellow", "catalog": "210" }, { "color": 16357815, "name": "Pale Pink", "catalog": "211" }, { "color": 16429953, "name": "Peach", "catalog": "212" }, { "color": 13214848, "name": "Beige", "catalog": "213" }, { "color": 9897267, "name": "Wine Red", "catalog": "215" }, { "color": 10533068, "name": "Pale Sky", "catalog": "216" }, { "color": 8372764, "name": "Yellow Green", "catalog": "218" }, { "color": 15066597, "name": "Silver Gray", "catalog": "220" }, { "color": 8952731, "name": "Gray", "catalog": "221" }, { "color": 10016445, "name": "Pale Aqua", "catalog": "227" }, { "color": 11723235, "name": "Baby Blue", "catalog": "228" }, { "color": 3574688, "name": "Powder Blue", "catalog": "229" }, { "color": 5211051, "name": "Bright Blue", "catalog": "230" }, { "color": 3697297, "name": "Slate Blue", "catalog": "231" }, { "color": 464464, "name": "Navy Blue", "catalog": "232" }, { "color": 16357794, "name": "Salmon Pink", "catalog": "233" }, { "color": 16344939, "name": "Coral", "catalog": "234" }, { "color": 14889247, "name": "Burnt Orange", "catalog": "235" }, { "color": 14852488, "name": "Cinnamon", "catalog": "236" }, { "color": 11900020, "name": "Umber", "catalog": "237" }, { "color": 14995353, "name": "Blond", "catalog": "238" }, { "color": 16763648, "name": "Sunflower", "catalog": "239" }, { "color": 14790100, "name": "Orchid Pink", "catalog": "240" }, { "color": 12779646, "name": "Peony Purple", "catalog": "241" }, { "color": 8388683, "name": "Burgundy", "catalog": "242" }, { "color": 5506417, "name": "Royal Purple", "catalog": "243" }, { "color": 11601189, "name": "Cardinal Red", "catalog": "244" }, { "color": 13295808, "name": "Opal Green", "catalog": "245" }, { "color": 9017430, "name": "Moss Green", "catalog": "246" }, { "color": 6067226, "name": "Meadow Green", "catalog": "247" }, { "color": 12564, "name": "Dark Green", "catalog": "248" }, { "color": 6139540, "name": "Aquamarine", "catalog": "249" }, { "color": 5029775, "name": "Emerald Green", "catalog": "250" }, { "color": 30578, "name": "Peacock Green", "catalog": "251" }, { "color": 5856097, "name": "Dark Gray", "catalog": "252" }, { "color": 16777202, "name": "Ivory White", "catalog": "253" }, { "color": 11622424, "name": "Hazel", "catalog": "254" }, { "color": 13339143, "name": "Toast", "catalog": "255" }, { "color": 9989248, "name": "Salmon", "catalog": "256" }, { "color": 9988397, "name": "Cocoa Brown", "catalog": "257" }, { "color": 5059609, "name": "Sienna", "catalog": "258" }, { "color": 4993803, "name": "Sepia", "catalog": "259" }, { "color": 3350538, "name": "Dark Sepia", "catalog": "260" }, { "color": 5388951, "name": "Violet Blue", "catalog": "261" }, { "color": 860542, "name": "Blue Ink", "catalog": "262" }, { "color": 1996716, "name": "Sola Blue", "catalog": "263" }, { "color": 11722067, "name": "Green Dust", "catalog": "264" }, { "color": 15939209, "name": "Crimson", "catalog": "265" }, { "color": 14574750, "name": "Floral Pink", "catalog": "266" }, { "color": 9978209, "name": "Wine", "catalog": "267" }, { "color": 5002770, "name": "Olive Drab", "catalog": "268" }, { "color": 5015583, "name": "Meadow", "catalog": "269" }, { "color": 14999161, "name": "Mustard", "catalog": "270" }, { "color": 13339162, "name": "Yellow Ocher", "catalog": "271" }, { "color": 13345308, "name": "Old Gold", "catalog": "272" }, { "color": 16750597, "name": "Honey Dew", "catalog": "273" }, { "color": 16560727, "name": "Tangerine", "catalog": "274" }, { "color": 16770309, "name": "Canary Yellow", "catalog": "275" }, { "color": 15741727, "name": "Vermilion", "catalog": "202" }, { "color": 1737773, "name": "Bright Green", "catalog": "206" }, { "color": 3697838, "name": "Ocean Blue", "catalog": "222" }, { "color": 14927028, "name": "Beige Gray", "catalog": "223" }, { "color": 14920833, "name": "Bamboo", "catalog": "224" }];
  }
});

// src/formats/jef.js
function hoopSize(w, h) {
  if (w < 500 && h < 500) return 1;
  if (w < 1260 && h < 1100) return 3;
  if (w < 1400 && h < 2e3) return 2;
  if (w < 2e3 && h < 2e3) return 4;
  return 0;
}
function hoopEdge(w, x, y) {
  if (Math.min(x, y) >= 0) w.u32le(x).u32le(y).u32le(x).u32le(y);
  else w.u32le(-1).u32le(-1).u32le(-1).u32le(-1);
}
function write3(pattern, opts = {}) {
  const trims = opts.trims ?? false;
  const trimAt = opts.trimAt ?? 3;
  const date = opts.date ?? (/* @__PURE__ */ new Date()).toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const p = encode(pattern, caps3);
  fixThreadCount(p);
  const set = jef_palette_default.slice();
  let lastIndex = null, lastThread = null, colorToggled = false, colorCount = 0, ti = 0;
  const palette = [];
  for (const s of p.stitches) {
    if (s.cmd === CMD.COLOR_CHANGE || ti === 0) {
      const th = p.threads[ti++];
      colorCount++;
      let idx = nearestIndex(th.color, set);
      if (lastIndex === idx && lastThread !== th) {
        const keep = set[idx];
        set[idx] = null;
        idx = nearestIndex(th.color, set);
        set[lastIndex] = keep;
      }
      palette.push(idx);
      lastIndex = idx;
      lastThread = th;
      colorToggled = false;
    }
    if (s.cmd === CMD.STOP) {
      colorCount++;
      colorToggled = !colorToggled;
      palette.push(colorToggled ? 0 : lastIndex);
    }
  }
  let points = 1;
  for (const s of p.stitches) {
    if (s.cmd === CMD.STITCH) points += 1;
    else if (s.cmd === CMD.JUMP) points += 2;
    else if (s.cmd === CMD.TRIM) {
      if (trims) points += 2 * trimAt;
    } else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) points += 2;
    else if (s.cmd === CMD.END) break;
  }
  const bd = p.bounds();
  const dw = pyRound(bd.maxX - bd.minX), dh = pyRound(bd.maxY - bd.minY);
  const hw = pyRound(dw / 2), hh = pyRound(dh / 2);
  const w = new ByteWriter();
  w.u32le(116 + colorCount * 8).u32le(20);
  w.str(date.padEnd(14, "0").slice(0, 14)).u8(0).u8(0);
  w.u32le(colorCount).u32le(points).u32le(hoopSize(dw, dh));
  w.u32le(hw).u32le(hh).u32le(hw).u32le(hh);
  hoopEdge(w, 550 - hw, 550 - hh);
  hoopEdge(w, 250 - hw, 250 - hh);
  hoopEdge(w, 700 - hw, 1e3 - hh);
  hoopEdge(w, 700 - hw, 1e3 - hh);
  for (const t of palette) w.u32le(t);
  for (let i = 0; i < colorCount; i++) w.u32le(13);
  let xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    if (s.cmd === CMD.STITCH) w.u8(dx).u8(-dy);
    else if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.u8(128).u8(1).u8(dx).u8(-dy);
    else if (s.cmd === CMD.TRIM) {
      if (trims) for (let i = 0; i < trimAt; i++) w.bytes([128, 2, 0, 0]);
    } else if (s.cmd === CMD.JUMP) w.u8(128).u8(2).u8(dx).u8(-dy);
    else if (s.cmd === CMD.END) break;
  }
  w.u8(128).u8(16);
  return w.result();
}
var caps3, pyRound;
var init_jef = __esm({
  "src/formats/jef.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    init_color();
    init_jef_palette();
    caps3 = { maxStitch: 127, maxJump: 127, stopAsColor: false };
    pyRound = (v) => {
      const f = Math.floor(v);
      const d = v - f;
      return d < 0.5 ? f : d > 0.5 ? f + 1 : f % 2 === 0 ? f : f + 1;
    };
  }
});

// src/data/pec-palette.js
var pec_palette_default;
var init_pec_palette = __esm({
  "src/data/pec-palette.js"() {
    pec_palette_default = [null, { "color": 925564, "name": "Prussian Blue", "catalog": "1" }, { "color": 677283, "name": "Blue", "catalog": "2" }, { "color": 34679, "name": "Teal Green", "catalog": "3" }, { "color": 4942767, "name": "Cornflower Blue", "catalog": "4" }, { "color": 15537951, "name": "Red", "catalog": "5" }, { "color": 13720576, "name": "Reddish Brown", "catalog": "6" }, { "color": 9516695, "name": "Magenta", "catalog": "7" }, { "color": 14981835, "name": "Light Lilac", "catalog": "8" }, { "color": 9527212, "name": "Lilac", "catalog": "9" }, { "color": 10409597, "name": "Mint Green", "catalog": "10" }, { "color": 15247616, "name": "Deep Gold", "catalog": "11" }, { "color": 16693813, "name": "Orange", "catalog": "12" }, { "color": 16776960, "name": "Yellow", "catalog": "13" }, { "color": 7388191, "name": "Lime Green", "catalog": "14" }, { "color": 12228608, "name": "Brass", "catalog": "15" }, { "color": 11053224, "name": "Silver", "catalog": "16" }, { "color": 8220416, "name": "Russet Brown", "catalog": "17" }, { "color": 16777139, "name": "Cream Brown", "catalog": "18" }, { "color": 5199190, "name": "Pewter", "catalog": "19" }, { "color": 0, "name": "Black", "catalog": "20" }, { "color": 736657, "name": "Ultramarine", "catalog": "21" }, { "color": 7799158, "name": "Royal Purple", "catalog": "22" }, { "color": 2699571, "name": "Dark Gray", "catalog": "23" }, { "color": 2757377, "name": "Dark Brown", "catalog": "24" }, { "color": 16140938, "name": "Deep Rose", "catalog": "25" }, { "color": 11695652, "name": "Light Brown", "catalog": "26" }, { "color": 16563141, "name": "Salmon Pink", "catalog": "27" }, { "color": 16660239, "name": "Vermilion", "catalog": "28" }, { "color": 15790320, "name": "White", "catalog": "29" }, { "color": 6954122, "name": "Violet", "catalog": "30" }, { "color": 11066820, "name": "Seacrest", "catalog": "31" }, { "color": 2458811, "name": "Sky Blue", "catalog": "32" }, { "color": 16692035, "name": "Pumpkin", "catalog": "33" }, { "color": 16773995, "name": "Cream Yellow", "catalog": "34" }, { "color": 13674080, "name": "Khaki", "catalog": "35" }, { "color": 13718528, "name": "Clay Brown", "catalog": "36" }, { "color": 6732361, "name": "Leaf Green", "catalog": "37" }, { "color": 1264198, "name": "Peacock Blue", "catalog": "38" }, { "color": 8882055, "name": "Gray", "catalog": "39" }, { "color": 14208198, "name": "Warm Gray", "catalog": "40" }, { "color": 4412935, "name": "Dark Olive", "catalog": "41" }, { "color": 16636382, "name": "Flesh Pink", "catalog": "42" }, { "color": 16356284, "name": "Pink", "catalog": "43" }, { "color": 14370, "name": "Deep Green", "catalog": "44" }, { "color": 11710420, "name": "Lavender", "catalog": "45" }, { "color": 6843056, "name": "Wisteria Violet", "catalog": "46" }, { "color": 15721401, "name": "Beige", "catalog": "47" }, { "color": 16201830, "name": "Carmine", "catalog": "48" }, { "color": 11881316, "name": "Amber Red", "catalog": "49" }, { "color": 1256218, "name": "Olive Green", "catalog": "50" }, { "color": 13042006, "name": "Dark Fuchsia", "catalog": "51" }, { "color": 16686642, "name": "Tangerine", "catalog": "52" }, { "color": 11067115, "name": "Light Blue", "catalog": "53" }, { "color": 26430, "name": "Emerald Green", "catalog": "54" }, { "color": 5122448, "name": "Purple", "catalog": "55" }, { "color": 3112480, "name": "Moss Green", "catalog": "56" }, { "color": 16764108, "name": "Flesh Pink", "catalog": "57" }, { "color": 16767249, "name": "Harvest Gold", "catalog": "58" }, { "color": 613286, "name": "Electric Blue", "catalog": "59" }, { "color": 15792496, "name": "Lemon Yellow", "catalog": "60" }, { "color": 14938971, "name": "Fresh Green", "catalog": "61" }, { "color": 16750848, "name": "Orange", "catalog": "62" }, { "color": 16773261, "name": "Cream Yellow", "catalog": "63" }, { "color": 16763080, "name": "Applique", "catalog": "64" }];
  }
});

// src/data/pec-blank.js
var pec_blank_default;
var init_pec_blank = __esm({
  "src/data/pec-blank.js"() {
    pec_blank_default = new Uint8Array([0, 0, 0, 0, 0, 0, 240, 255, 255, 255, 255, 15, 8, 0, 0, 0, 0, 16, 4, 0, 0, 0, 0, 32, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 2, 0, 0, 0, 0, 64, 4, 0, 0, 0, 0, 32, 8, 0, 0, 0, 0, 16, 240, 255, 255, 255, 255, 15, 0, 0, 0, 0, 0, 0]);
  }
});

// src/formats/pec.js
function buildUniquePalette(threads) {
  const palette = pec_palette_default.slice();
  const chart = new Array(palette.length).fill(null);
  const seen = /* @__PURE__ */ new Set();
  for (const t of threads) {
    if (seen.has(t.color)) continue;
    seen.add(t.color);
    const idx = nearestIndex(t.color, palette);
    if (idx === null) break;
    palette[idx] = null;
    chart[idx] = t;
  }
  return threads.map((t) => nearestIndex(t.color, chart));
}
function writeValue(w, v, long = false, flag = 0) {
  if (!long && v > -64 && v < 63) w.u8(v & 127);
  else {
    let x = v & 4095;
    x |= 32768;
    x |= flag << 8;
    w.u8(x >> 8 & 255).u8(x & 255);
  }
}
function pecEncode(w, p) {
  let colorTwo = true, jumping = true, init = true, xx = 0, yy = 0;
  for (const s of p.stitches) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    if (s.cmd === CMD.STITCH) {
      if (jumping) {
        if (dx !== 0 && dy !== 0) {
          writeValue(w, 0);
          writeValue(w, 0);
        }
        jumping = false;
      }
      writeValue(w, dx);
      writeValue(w, dy);
    } else if (s.cmd === CMD.JUMP) {
      jumping = true;
      const flag = init ? 16 : 32;
      writeValue(w, dx, true, flag);
      writeValue(w, dy, true, flag);
    } else if (s.cmd === CMD.COLOR_CHANGE) {
      if (jumping) {
        writeValue(w, 0);
        writeValue(w, 0);
        jumping = false;
      }
      w.u8(254).u8(176).u8(colorTwo ? 2 : 1);
      colorTwo = !colorTwo;
    } else if (s.cmd === CMD.END) {
      w.u8(255);
      break;
    }
    init = false;
  }
}
function markBit(g2, x, y) {
  if (x < 0 || x >= 48 || y < 0 || y >= 38) return;
  g2[y * 6 + (x >> 3)] |= 1 << (x & 7);
}
function drawScaled(bd, points, g2, buffer) {
  let dw = bd.maxX - bd.minX, dh = bd.maxY - bd.minY;
  if (dw === 0) dw = 1;
  if (dh === 0) dh = 1;
  const scale = Math.min((48 - buffer) / dw, (g2.length / 6 - buffer) / dh);
  const cx = (bd.maxX + bd.minX) / 2, cy = (bd.maxY + bd.minY) / 2;
  const tx = -cx * scale + 24, ty = -cy * scale + g2.length / 6 / 2;
  for (const s of points) markBit(g2, Math.floor(s.x * scale + tx), Math.floor(s.y * scale + ty));
}
function writePecSection(w, p) {
  fixThreadCount(p);
  const bd = p.bounds();
  const name = (p.meta.name || "Untitled").slice(0, 8);
  w.str("LA:" + name.padEnd(16, " ") + "\r");
  w.bytes([32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 32, 255, 0]);
  w.u8(ICON_W / 8).u8(ICON_H);
  const idxs = buildUniquePalette(p.threads);
  const n = idxs.length;
  if (n !== 0) {
    w.fill(32, 12);
    w.u8(n - 1);
    if (n > 254) throw new RangeError("PEC supports at most 254 colour blocks");
    for (const i of idxs) w.u8(i);
  } else w.bytes([32, 32, 32, 32, 100, 32, 0, 32, 0, 32, 32, 32, 255]);
  for (let i = n; i < 463; i++) w.u8(32);
  const start = w.tell();
  w.u8(0).u8(0).u24le(0).bytes([49, 255, 240]);
  w.u16le(pyRound2(bd.maxX - bd.minX)).u16le(pyRound2(bd.maxY - bd.minY)).u16le(480).u16le(432);
  pecEncode(w, p);
  const len = w.tell() - start, cur = w.tell();
  w.seek(start + 2);
  w.u24le(len);
  w.seek(cur);
  const all = pec_blank_default.slice();
  drawScaled(bd, p.stitches.filter((s) => s.cmd === CMD.STITCH), all, 4);
  w.bytes(all);
  let blockStitches = [];
  const flush = () => {
    const g2 = pec_blank_default.slice();
    drawScaled(bd, blockStitches, g2, 5);
    w.bytes(g2);
    blockStitches = [];
  };
  for (const s of p.stitches) {
    if (s.cmd === CMD.STITCH) blockStitches.push(s);
    else if (s.cmd === CMD.COLOR_CHANGE) flush();
  }
  flush();
  return { indices: idxs, rgbs: p.threads.map((t) => t.color) };
}
function write4(pattern) {
  const p = encode(pattern, caps4);
  const w = new ByteWriter();
  w.str("#PEC0001");
  writePecSection(w, p);
  return w.result();
}
var caps4, ICON_W, ICON_H, pyRound2;
var init_pec = __esm({
  "src/formats/pec.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    init_color();
    init_pec_palette();
    init_pec_blank();
    caps4 = { maxStitch: 2047, maxJump: 2047, stopAsColor: true };
    ICON_W = 48;
    ICON_H = 38;
    pyRound2 = (v) => {
      const f = Math.floor(v);
      const d = v - f;
      return d < 0.5 ? f : d > 0.5 ? f + 1 : f % 2 === 0 ? f : f + 1;
    };
  }
});

// src/formats/pes.js
function headerV1(w, blocks) {
  w.u16le(1).u16le(1).u16le(blocks);
}
function headerV6(w, p, chart, blocks) {
  w.u16le(1).str("02");
  str8(w, p.meta.name);
  str8(w, p.meta.category);
  str8(w, p.meta.author);
  str8(w, p.meta.keywords);
  str8(w, p.meta.comments);
  w.u16le(0).u16le(0).u16le(100).u16le(100).u16le(0).u16le(200).u16le(200).u16le(100).u16le(100).u16le(100);
  w.u16le(7).u16le(19).u16le(1).u16le(1).u16le(0).u16le(100).u16le(1).u16le(0);
  w.u8(0);
  [1, 0, 0, 1, 0, 0].forEach((f) => w.f32le(f));
  w.u16le(0).u16le(0).u16le(0).u16le(chart.length);
  for (const t of chart) {
    str8(w, t.catalog);
    w.u8(t.color >> 16 & 255).u8(t.color >> 8 & 255).u8(t.color & 255).u8(0).u32le(10);
    str8(w, t.name || intToHex(t.color));
    str8(w, t.brand);
    str8(w, "");
  }
  w.u16le(blocks);
}
function commandBlocks(st) {
  const out = [];
  let cur = [];
  for (const s of st) {
    if (cur.length && cur[0].cmd !== s.cmd) {
      out.push(cur);
      cur = [];
    }
    cur.push(s);
  }
  if (cur.length) out.push(cur);
  return out;
}
function segments(p, chartIdx, left, bottom) {
  const res = [];
  let thread = 0, color = chartIdx(thread);
  thread++;
  let sx = 0, sy = 0;
  for (const block of commandBlocks(p.stitches)) {
    const c = block[0].cmd;
    if (c === CMD.JUMP) {
      const last = block[block.length - 1];
      res.push({ pts: [[sx - left, sy - bottom], [last.x - left, last.y - bottom]], color, flag: 1 });
    } else if (c === CMD.COLOR_CHANGE) {
      color = chartIdx(thread);
      thread++;
    } else if (c === CMD.STITCH) {
      const pts = [];
      for (const s of block) {
        sx = s.x;
        sy = s.y;
        pts.push([sx - left, sy - bottom]);
      }
      res.push({ pts, color, flag: 0 });
    }
  }
  return res;
}
function writeBlocks(w, p, chartIdx, bd) {
  const width = bd.maxX - bd.minX, height = bd.maxY - bd.minY;
  str16(w, "CEmbOne");
  for (let i = 0; i < 8; i++) w.u16le(0);
  const tx = 350 + 1300 / 2 - width / 2, ty = 100 + height + 1800 / 2 - height / 2;
  [1, 0, 0, 1, tx, ty].forEach((f) => w.f32le(f));
  w.u16le(1).u16le(0).u16le(0).u16le(Math.trunc(width)).u16le(Math.trunc(height));
  w.fill(0, 8);
  const secPos = w.tell();
  w.u16le(0);
  w.u16le(65535).u16le(0);
  str16(w, "CSewSeg");
  const segs = segments(p, chartIdx, bd.minX, bd.maxY);
  const log = [];
  let prev = -1, first = true, section = 0;
  for (const s of segs) {
    if (!first) w.u16le(32771);
    first = false;
    if (prev !== s.color) {
      log.push([section, s.color]);
      prev = s.color;
    }
    w.u16le(s.flag).u16le(s.color).u16le(s.pts.length);
    for (const [x, y] of s.pts) w.u16le(Math.trunc(x)).u16le(Math.trunc(y));
    section++;
  }
  w.u16le(log.length);
  for (const [a, b2] of log) w.u16le(a).u16le(b2);
  const cur = w.tell();
  w.seek(secPos);
  w.u16le(section);
  w.seek(cur);
  w.u16le(0).u16le(0);
  return log;
}
function write5(pattern, opts = {}) {
  const version = opts.version ?? 1;
  const p = encode(pattern, caps5);
  fixThreadCount(p);
  const bd = p.bounds();
  const w = new ByteWriter();
  w.str(version === 6 ? "#PES0060" : "#PES0001");
  const pecPtr = w.tell();
  w.u32le(0);
  const has = p.stitches.length > 0;
  const chartIdx = version === 6 ? (i) => nearestIndex(p.threads[Math.min(i, p.threads.length - 1)].color, p.threads) : (i) => nearestIndex(p.threads[Math.min(i, p.threads.length - 1)].color, pec_palette_default);
  let log = [];
  if (version === 6) headerV6(w, p, p.threads, has ? 1 : 0);
  else headerV1(w, has ? 1 : 0);
  if (has) {
    w.u16le(65535).u16le(0);
    log = writeBlocks(w, p, chartIdx, bd);
    if (version === 6) {
      w.u32le(0).u32le(0);
      log.forEach((_, i) => w.u32le(i).u32le(0));
    }
  } else {
    w.u16le(0).u16le(0);
  }
  const cur = w.tell();
  w.seek(pecPtr);
  w.u32le(cur);
  w.seek(cur);
  const info = writePecSection(w, p);
  if (version === 6) {
    const idx = [info.indices.length - 1, ...info.indices];
    w.bytes(idx);
    w.fill(32, 128 - idx.length);
    for (let i = 0; i < info.rgbs.length; i++) w.fill(0, 144);
    for (const c of info.rgbs) w.u24le(c);
    w.u16le(0);
  }
  return w.result();
}
var caps5, str8, str16;
var init_pes = __esm({
  "src/formats/pes.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    init_color();
    init_pec_palette();
    init_pec();
    caps5 = caps4;
    str8 = (w, s) => {
      if (s == null || s === "") {
        w.u8(0);
        return;
      }
      s = String(s).slice(0, 255);
      w.u8(s.length).str(s);
    };
    str16 = (w, s) => {
      w.u16le(s.length).str(s);
    };
  }
});

// src/formats/vp3.js
function patch(w, off) {
  const cur = w.tell();
  w.seek(off);
  w.u32be(cur - off - 4);
  w.seek(cur);
}
function write6(pattern) {
  const p = encode(pattern, caps6);
  fixThreadCount(p);
  const blocks = [...colorBlocks(p)];
  const bd = p.bounds();
  const w = new ByteWriter();
  w.str("%vsm%").u8(0);
  s16(w, PRODUCER);
  w.bytes([0, 2, 0]);
  const fileEnd = w.tell();
  w.u32be(0);
  s16(w, "");
  w.u32be(i32(bd.maxX * 100)).u32be(i32(bd.minY * -100)).u32be(i32(bd.minX * 100)).u32be(i32(bd.maxY * -100));
  w.u32be(p.stitches.length - p.count(CMD.END));
  w.u8(0).u8(blocks.length).u8(12).u8(0);
  w.u8(1);
  w.bytes([0, 3, 0]);
  const designEnd = w.tell();
  w.u32be(0);
  const width = bd.maxX - bd.minX, height = bd.maxY - bd.minY;
  const hw = width / 2, hh = height / 2;
  const cx = bd.maxX - hw, cy = bd.maxY - hh;
  w.u32be(i32(cx) * 100).u32be(i32(cy) * -100).u8(0).u8(0).u8(0);
  w.u32be(i32(hw) * -100).u32be(i32(hw) * 100).u32be(i32(hh) * -100).u32be(i32(hh) * 100);
  w.u32be(i32(width) * 100).u32be(i32(height) * 100);
  s16(w, "");
  w.bytes([100, 100]).u32be(4096).u32be(0).u32be(0).u32be(4096);
  w.bytes([120, 120, 80, 80, 1, 0]);
  s16(w, PRODUCER);
  w.u16be(blocks.length);
  blocks.forEach((blk, bi) => {
    const first = bi === 0, st = blk.stitches;
    w.bytes([0, 5, 0]);
    const cbEnd = w.tell();
    w.u32be(0);
    let fx = 0, fy = 0, lx = 0, ly = 0;
    if (st.length) {
      fx = st[0].x;
      fy = st[0].y;
      if (first) {
        fx = 0;
        fy = 0;
      }
      lx = st[st.length - 1].x;
      ly = st[st.length - 1].y;
    }
    w.u32be(i32(fx - cx) * 100).u32be(i32(-(fy - cy)) * 100);
    const t = blk.thread;
    w.bytes([1, 0]).u24be(t.color).bytes([0, 0, 0, 5, 40]);
    s8(w, t.catalog || "");
    s8(w, t.name || intToHex(t.color));
    s8(w, t.brand || "");
    w.u32be(i32(lx - fx) * 100).u32be(i32(-(ly - fy)) * 100);
    w.bytes([0, 1, 0]);
    const sbEnd = w.tell();
    w.u32be(0);
    w.bytes([10, 246, 0]);
    let px = fx, py = fy;
    for (const s of st) {
      if (s.cmd === CMD.END) {
        w.bytes([128, 3]);
        break;
      }
      if (s.cmd === CMD.TRIM) {
        w.bytes([128, 3]);
        continue;
      }
      if (s.cmd !== CMD.STITCH) continue;
      const dx = i32(s.x - px), dy = i32(s.y - py);
      px += dx;
      py += dy;
      if (dx >= -127 && dx <= 127 && dy >= -127 && dy <= 127) w.u8(dx).u8(dy);
      else w.bytes([128, 1]).u16be(dx).u16be(dy).bytes([128, 2]);
    }
    patch(w, sbEnd);
    w.u8(0);
    patch(w, cbEnd);
  });
  patch(w, designEnd);
  patch(w, fileEnd);
  return w.result();
}
var caps6, PRODUCER, s16, s8, i32;
var init_vp3 = __esm({
  "src/formats/vp3.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    caps6 = { maxStitch: 255, maxJump: 3200, stopAsColor: false };
    PRODUCER = "Produced by     Software Ltd";
    s16 = (w, s) => {
      w.u16be(s.length * 2).str16be(s);
    };
    s8 = (w, s) => {
      const b2 = utf8Encode(s);
      w.u16be(b2.length).bytes(b2);
    };
    i32 = (v) => Math.trunc(v);
  }
});

// src/formats/xxx.js
function write7(pattern) {
  const p = encode(pattern, caps7);
  fixThreadCount(p);
  const st = p.stitches, bd = p.bounds();
  const last = st[st.length - 1];
  const w = new ByteWriter();
  w.fill(0, 23).u32le(st.length - 1).fill(0, 12).u32le(p.threads.length).u16le(0);
  w.u16le(Math.trunc(bd.maxX - bd.minX)).u16le(Math.trunc(bd.maxY - bd.minY));
  w.u16le(Math.trunc(last.x)).u16le(Math.trunc(-last.y));
  w.u16le(Math.trunc(-bd.minX)).u16le(Math.trunc(bd.maxY));
  w.fill(0, 66).u16le(0).u16le(0).fill(0, 115).u16le(32).fill(0, 8);
  const ptr = w.tell();
  w.u32le(0);
  let xx = 0, yy = 0;
  for (const s of st) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    if (s.cmd === CMD.COLOR_CHANGE || s.cmd === CMD.STOP) w.u8(127).u8(8).u8(dx).u8(-dy);
    else if (s.cmd === CMD.END) break;
    else if (s.cmd === CMD.STITCH) {
      if (dx > -124 && dx < 124 && dy > -124 && dy < 124) w.u8(dx).u8(-dy);
      else w.u8(125).u16le(dx).u16le(-dy);
    } else if (s.cmd === CMD.TRIM) w.u8(127).u8(3).u8(dx).u8(-dy);
    else if (s.cmd === CMD.JUMP) w.u8(127).u8(1).u8(dx).u8(-dy);
  }
  const end = w.tell();
  w.seek(ptr);
  w.u32le(end);
  w.seek(end);
  w.u8(127).u8(127).u8(2).u8(20);
  w.u8(0).u8(0);
  p.threads.forEach((t) => w.u8(0).u8(t.color >> 16).u8(t.color >> 8).u8(t.color));
  for (let i = p.threads.length; i < 21; i++) w.u32le(0);
  w.u32le(4294967040).u8(0).u8(1);
  return w.result();
}
var caps7;
var init_xxx = __esm({
  "src/formats/xxx.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    caps7 = { maxStitch: 124, maxJump: 124, stopAsColor: false };
  }
});

// src/formats/u01.js
function write8(pattern) {
  const p = encode(pattern, caps8);
  const st = p.stitches, w = new ByteWriter();
  w.fill(48, 128);
  if (!st.length) return w.result();
  const bd = p.bounds(), last = st[st.length - 1];
  w.u16le(Math.trunc(bd.minX)).u16le(-Math.trunc(bd.maxY)).u16le(Math.trunc(bd.maxX)).u16le(-Math.trunc(bd.minY));
  w.u32le(0).u32le(st.length + 2).u16le(Math.trunc(last.x)).u16le(-Math.trunc(last.y));
  while (w.tell() < 256) w.u8(0);
  let xx = 0, yy = 0, needle = 1;
  let started2 = false;
  for (const s of st) {
    const dx = s.x - xx, dy = s.y - yy;
    xx += dx;
    yy += dy;
    let cmd = 128;
    if (dy >= 0) cmd |= 64;
    if (dx <= 0) cmd |= 32;
    const ax = Math.abs(dx), ay = Math.abs(dy);
    if (s.cmd === CMD.STITCH) {
      if (!started2) {
        started2 = true;
        w.u8(232 | needle).u8(0).u8(0);
      }
      w.u8(cmd).u8(ay).u8(ax);
    } else if (s.cmd === CMD.JUMP) w.u8(cmd | 1).u8(ay).u8(ax);
    else if (s.cmd === CMD.STOP) w.u8(cmd | 8).u8(ay).u8(ax);
    else if (s.cmd === CMD.TRIM) w.u8(cmd | 7).u8(ay).u8(ax);
    else if (s.cmd === CMD.COLOR_CHANGE) {
      needle = needle % 15 + 1;
      w.u8(cmd | 8 | needle).u8(ay).u8(ax);
    } else if (s.cmd === CMD.END) break;
  }
  w.bytes([248, 0, 0]);
  return w.result();
}
var caps8;
var init_u01 = __esm({
  "src/formats/u01.js"() {
    init_bytes();
    init_pattern();
    init_encoder();
    caps8 = { maxStitch: 127, maxJump: 127, stopAsColor: false };
  }
});

// src/formats/index.js
var FORMATS;
var init_formats = __esm({
  "src/formats/index.js"() {
    init_dst();
    init_exp();
    init_jef();
    init_pec();
    init_pes();
    init_vp3();
    init_xxx();
    init_u01();
    FORMATS = {
      dst: { label: "Tajima DST", ext: "dst", write, caps },
      exp: { label: "Melco EXP", ext: "exp", write: write2, caps: caps2 },
      jef: { label: "Janome JEF", ext: "jef", write: write3, caps: caps3 },
      pec: { label: "Brother PEC", ext: "pec", write: write4, caps: caps4 },
      pes1: { label: "Brother PES (v1)", ext: "pes", write: (p, o) => write5(p, { ...o, version: 1 }), caps: caps5 },
      pes6: { label: "Brother PES (v6)", ext: "pes", write: (p, o) => write5(p, { ...o, version: 6 }), caps: caps5 },
      vp3: { label: "Husqvarna/Pfaff VP3", ext: "vp3", write: write6, caps: caps6 },
      xxx: { label: "Compucon/Singer XXX", ext: "xxx", write: write7, caps: caps7 },
      u01: { label: "Barudan U01", ext: "u01", write: write8, caps: caps8 }
    };
  }
});

// src/affinity/convert.js
function toEngineShape(raw, dpi, params = {}, { toleranceMm = 0.2 } = {}) {
  const k = pxToDu(dpi);
  const S2 = (p) => [p[0] * k, p[1] * k];
  const paths = [];
  for (const c of raw.curves) {
    let points = null;
    if (c.points && c.points.length >= 2) points = c.points.map(S2);
    else if (c.beziers && c.beziers.length) {
      const segs = c.beziers.map((b2) => ({ p0: S2(b2.p0), c1: S2(b2.c1), c2: S2(b2.c2), p3: S2(b2.p3) }));
      points = flattenSegments(segs, toleranceMm * MM);
    }
    if (!points || points.length < 2) continue;
    const f = points[0], l = points[points.length - 1];
    if (c.closed && Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-6) points = points.slice(0, -1);
    paths.push({ points, nodes: c.nodes && c.nodes.length ? c.nodes.map(S2) : void 0, closed: !!c.closed });
  }
  const visible = (f) => f && f.rgb != null && f.alpha > 0.01;
  return {
    id: raw.nodeId,
    name: raw.name || "",
    paths,
    fill: visible(raw.fill) ? { color: intToHex(raw.fill.rgb) } : null,
    stroke: visible(raw.stroke) ? { color: intToHex(raw.stroke.rgb), width: raw.stroke.weightPx * k } : null,
    params
  };
}
function shapeSignature(raw, dpi) {
  const b2 = raw.bbox ? raw.bbox.map((v) => Math.round(pxToMm(v, dpi) * 10) / 10) : [];
  return [raw.curves.length, ...b2].join(":");
}
var pxToDu, duToPx, mmToPx, pxToMm;
var init_convert = __esm({
  "src/affinity/convert.js"() {
    init_geometry();
    init_pattern();
    init_params();
    pxToDu = (dpi) => MM * 25.4 / dpi;
    duToPx = (dpi) => dpi / (MM * 25.4);
    mmToPx = (mm, dpi) => mm * dpi / 25.4;
    pxToMm = (px, dpi) => px * 25.4 / dpi;
  }
});

// src/affinity/storage.js
function sidecarPath(info) {
  if (info.path) return info.path.replace(/\.[^./\\]+$/, "") + ".embroidery.json";
  const base = (info.desktop || "").replace(/[/\\]$/, "");
  return (base ? base + "/" : "") + "untitled.embroidery.json";
}
function emptyStore() {
  return { version: SIDECAR_VERSION, defaults: {}, export: {}, objects: {} };
}
function loadStore(sdk2, info) {
  const p = sidecarPath(info);
  try {
    if (sdk2.fileExists(p)) {
      const j = JSON.parse(sdk2.readText(p));
      if (j && j.version === SIDECAR_VERSION) return { ...emptyStore(), ...j };
    }
  } catch (e) {
  }
  return emptyStore();
}
function saveStore(sdk2, info, store) {
  sdk2.writeText(sidecarPath(info), JSON.stringify(store, null, 1));
}
function paramsFor(store, id, sig) {
  const byId = store.objects[String(id)];
  if (byId && byId.sig === sig) return { ...store.defaults, ...byId.params };
  const bySig = Object.values(store.objects).find((o) => o.sig === sig);
  return { ...store.defaults, ...byId && byId.params || bySig && bySig.params || {} };
}
function setParams(store, id, sig, params) {
  store.objects[String(id)] = { sig, params: { ...params } };
}
var SIDECAR_VERSION;
var init_storage = __esm({
  "src/affinity/storage.js"() {
    SIDECAR_VERSION = 1;
  }
});

// src/affinity/ui-spec.js
function paramFields(p) {
  const v = { ...DEFAULTS, ...p };
  const n = (id, label, group, unit, min, max, precision = 2) => ({ id, type: "number", label, group, unit, min, max, value: v[id], precision });
  const c = (id, label, group, enabledBy) => ({ id, type: "check", label, group, value: v[id], enabledBy });
  return [
    { id: "type", type: "combo", label: "Stitch type", group: "Object", items: TYPE_ITEMS.map((t) => t[0]), value: typeLabel(v.type) },
    { id: "threadColor", type: "text", label: "Thread colour override (#rrggbb, blank = artwork colour)", group: "Object", value: v.threadColor || "" },
    n("stitchLength", "Stitch length", "Running stitch", "mm", 0.3, 12),
    n("repeats", "Repeats (forward/back passes)", "Running stitch", "none", 1, 9, 0),
    c("bean", "Bean (triple) stitch", "Running stitch"),
    n("beanRepeats", "Extra back-and-forth per stitch", "Running stitch", "none", 1, 4, 0),
    n("fillAngle", "Angle", "Fill", "deg", -360, 360, 1),
    n("rowSpacing", "Row spacing", "Fill", "mm", 0.1, 2, 2),
    n("maxStitchLength", "Max stitch length", "Fill", "mm", 0.5, 12),
    n("stagger", "Stagger (rows before pattern repeats, 0 = off)", "Fill", "none", 0, 12, 0),
    n("expand", "Expand / pull compensation", "Fill", "mm", -3, 3),
    c("fillUnderlay", "Underlay", "Fill"),
    n("fillUnderlayAngle", "Underlay angle (relative to fill)", "Fill", "deg", -360, 360, 1),
    n("fillUnderlaySpacing", "Underlay row spacing", "Fill", "mm", 0.3, 6),
    n("fillUnderlayInset", "Underlay inset", "Fill", "mm", 0, 3),
    n("satinSpacing", "Zig-zag spacing (density)", "Satin", "mm", 0.15, 2),
    n("satinPullComp", "Pull compensation (total extra width)", "Satin", "mm", 0, 2),
    n("satinMinWidth", "Auto: strokes at least this wide become satin", "Satin", "mm", 0.2, 10),
    c("satinCenterWalk", "Underlay: centre walk", "Satin"),
    c("satinContour", "Underlay: contour", "Satin"),
    c("satinZigzag", "Underlay: zig-zag", "Satin"),
    c("shortStitch", "Short stitches on tight curves", "Satin")
  ];
}
function paramsFromDialog(res) {
  const out = {};
  for (const k of Object.keys(res)) {
    if (!(k in DEFAULTS)) continue;
    out[k] = res[k];
  }
  out.type = typeValue(res.type);
  const tc = String(res.threadColor || "").trim();
  out.threadColor = /^#?[0-9a-fA-F]{6}$/.test(tc) ? tc.startsWith("#") ? tc : "#" + tc : null;
  for (const k of ["repeats", "beanRepeats", "stagger"]) if (k in out) out[k] = Math.round(out[k]);
  return out;
}
var TYPE_ITEMS, typeLabel, typeValue, HOOPS, PALETTES, formatItems;
var init_ui_spec = __esm({
  "src/affinity/ui-spec.js"() {
    init_params();
    init_formats();
    TYPE_ITEMS = [
      ["Auto (fill / running / satin by shape)", "auto"],
      ["Running stitch", "running"],
      ["Fill (tatami)", "fill"],
      ["Contour fill (concentric)", "contour"],
      ["Satin column", "satin"],
      ["Manual stitch (nodes = needle points)", "manual"],
      ["Skip this object", "none"]
    ];
    typeLabel = (v) => (TYPE_ITEMS.find((t) => t[1] === v) || TYPE_ITEMS[0])[0];
    typeValue = (l) => (TYPE_ITEMS.find((t) => t[0] === l) || TYPE_ITEMS[0])[1];
    HOOPS = [
      { name: "No hoop check", w: 0, h: 0 },
      { name: "100 x 100 mm", w: 100, h: 100 },
      { name: "126 x 110 mm", w: 126, h: 110 },
      { name: "130 x 180 mm", w: 130, h: 180 },
      { name: "160 x 260 mm", w: 160, h: 260 },
      { name: "200 x 200 mm", w: 200, h: 200 },
      { name: "240 x 150 mm", w: 240, h: 150 }
    ];
    PALETTES = ["None (exact colours)", "Madeira (approx.)", "Isacord (approx.)", "Robison-Anton (approx.)"];
    formatItems = () => Object.entries(FORMATS).map(([k, f]) => ({ key: k, label: `${f.label} (.${f.ext})` }));
  }
});

// src/data/palette-madeira.json
var palette_madeira_default;
var init_palette_madeira = __esm({
  "src/data/palette-madeira.json"() {
    palette_madeira_default = {
      brand: "Madeira",
      approximate: true,
      warning: "Placeholder chart: approximate sRGB for common colour FAMILIES, not official manufacturer data and without catalogue numbers. Replace with the official chart via scripts/import-palette.mjs.",
      threads: [
        {
          name: "White",
          color: "#f5f5f5",
          catalog: null
        },
        {
          name: "Black",
          color: "#101010",
          catalog: null
        },
        {
          name: "Silver Grey",
          color: "#b4b4b4",
          catalog: null
        },
        {
          name: "Charcoal",
          color: "#4a4a4a",
          catalog: null
        },
        {
          name: "Cream",
          color: "#f3e6c0",
          catalog: null
        },
        {
          name: "Beige",
          color: "#d2b48c",
          catalog: null
        },
        {
          name: "Tan",
          color: "#b08a5a",
          catalog: null
        },
        {
          name: "Brown",
          color: "#6b4423",
          catalog: null
        },
        {
          name: "Dark Brown",
          color: "#3b2414",
          catalog: null
        },
        {
          name: "Rust",
          color: "#b5532a",
          catalog: null
        },
        {
          name: "Orange",
          color: "#f28c28",
          catalog: null
        },
        {
          name: "Gold",
          color: "#e0a800",
          catalog: null
        },
        {
          name: "Yellow",
          color: "#f7e017",
          catalog: null
        },
        {
          name: "Lemon",
          color: "#fff47a",
          catalog: null
        },
        {
          name: "Lime Green",
          color: "#8cc63f",
          catalog: null
        },
        {
          name: "Green",
          color: "#2e9e3e",
          catalog: null
        },
        {
          name: "Forest Green",
          color: "#1b5e2f",
          catalog: null
        },
        {
          name: "Olive",
          color: "#6b7a2a",
          catalog: null
        },
        {
          name: "Teal",
          color: "#0e8a8a",
          catalog: null
        },
        {
          name: "Turquoise",
          color: "#2cc4c4",
          catalog: null
        },
        {
          name: "Sky Blue",
          color: "#7ec8f0",
          catalog: null
        },
        {
          name: "Blue",
          color: "#1f5fbf",
          catalog: null
        },
        {
          name: "Royal Blue",
          color: "#1b3fa0",
          catalog: null
        },
        {
          name: "Navy",
          color: "#14214d",
          catalog: null
        },
        {
          name: "Lavender",
          color: "#b9a3e3",
          catalog: null
        },
        {
          name: "Purple",
          color: "#7a3fa0",
          catalog: null
        },
        {
          name: "Magenta",
          color: "#c2187a",
          catalog: null
        },
        {
          name: "Pink",
          color: "#f48fb1",
          catalog: null
        },
        {
          name: "Light Pink",
          color: "#f9cfe0",
          catalog: null
        },
        {
          name: "Red",
          color: "#d81e1e",
          catalog: null
        },
        {
          name: "Burgundy",
          color: "#7a1428",
          catalog: null
        },
        {
          name: "Coral",
          color: "#f2705c",
          catalog: null
        }
      ]
    };
  }
});

// src/data/palette-isacord.json
var palette_isacord_default;
var init_palette_isacord = __esm({
  "src/data/palette-isacord.json"() {
    palette_isacord_default = {
      brand: "Isacord",
      approximate: true,
      warning: "Placeholder chart: approximate sRGB for common colour FAMILIES, not official manufacturer data and without catalogue numbers. Replace with the official chart via scripts/import-palette.mjs.",
      threads: [
        {
          name: "White",
          color: "#f5f5f5",
          catalog: null
        },
        {
          name: "Black",
          color: "#101010",
          catalog: null
        },
        {
          name: "Silver Grey",
          color: "#b4b4b4",
          catalog: null
        },
        {
          name: "Charcoal",
          color: "#4a4a4a",
          catalog: null
        },
        {
          name: "Cream",
          color: "#f3e6c0",
          catalog: null
        },
        {
          name: "Beige",
          color: "#d2b48c",
          catalog: null
        },
        {
          name: "Tan",
          color: "#b08a5a",
          catalog: null
        },
        {
          name: "Brown",
          color: "#6b4423",
          catalog: null
        },
        {
          name: "Dark Brown",
          color: "#3b2414",
          catalog: null
        },
        {
          name: "Rust",
          color: "#b5532a",
          catalog: null
        },
        {
          name: "Orange",
          color: "#f28c28",
          catalog: null
        },
        {
          name: "Gold",
          color: "#e0a800",
          catalog: null
        },
        {
          name: "Yellow",
          color: "#f7e017",
          catalog: null
        },
        {
          name: "Lemon",
          color: "#fff47a",
          catalog: null
        },
        {
          name: "Lime Green",
          color: "#8cc63f",
          catalog: null
        },
        {
          name: "Green",
          color: "#2e9e3e",
          catalog: null
        },
        {
          name: "Forest Green",
          color: "#1b5e2f",
          catalog: null
        },
        {
          name: "Olive",
          color: "#6b7a2a",
          catalog: null
        },
        {
          name: "Teal",
          color: "#0e8a8a",
          catalog: null
        },
        {
          name: "Turquoise",
          color: "#2cc4c4",
          catalog: null
        },
        {
          name: "Sky Blue",
          color: "#7ec8f0",
          catalog: null
        },
        {
          name: "Blue",
          color: "#1f5fbf",
          catalog: null
        },
        {
          name: "Royal Blue",
          color: "#1b3fa0",
          catalog: null
        },
        {
          name: "Navy",
          color: "#14214d",
          catalog: null
        },
        {
          name: "Lavender",
          color: "#b9a3e3",
          catalog: null
        },
        {
          name: "Purple",
          color: "#7a3fa0",
          catalog: null
        },
        {
          name: "Magenta",
          color: "#c2187a",
          catalog: null
        },
        {
          name: "Pink",
          color: "#f48fb1",
          catalog: null
        },
        {
          name: "Light Pink",
          color: "#f9cfe0",
          catalog: null
        },
        {
          name: "Red",
          color: "#d81e1e",
          catalog: null
        },
        {
          name: "Burgundy",
          color: "#7a1428",
          catalog: null
        },
        {
          name: "Coral",
          color: "#f2705c",
          catalog: null
        }
      ]
    };
  }
});

// src/data/palette-robison-anton.json
var palette_robison_anton_default;
var init_palette_robison_anton = __esm({
  "src/data/palette-robison-anton.json"() {
    palette_robison_anton_default = {
      brand: "Robison-Anton",
      approximate: true,
      warning: "Placeholder chart: approximate sRGB for common colour FAMILIES, not official manufacturer data and without catalogue numbers. Replace with the official chart via scripts/import-palette.mjs.",
      threads: [
        {
          name: "White",
          color: "#f5f5f5",
          catalog: null
        },
        {
          name: "Black",
          color: "#101010",
          catalog: null
        },
        {
          name: "Silver Grey",
          color: "#b4b4b4",
          catalog: null
        },
        {
          name: "Charcoal",
          color: "#4a4a4a",
          catalog: null
        },
        {
          name: "Cream",
          color: "#f3e6c0",
          catalog: null
        },
        {
          name: "Beige",
          color: "#d2b48c",
          catalog: null
        },
        {
          name: "Tan",
          color: "#b08a5a",
          catalog: null
        },
        {
          name: "Brown",
          color: "#6b4423",
          catalog: null
        },
        {
          name: "Dark Brown",
          color: "#3b2414",
          catalog: null
        },
        {
          name: "Rust",
          color: "#b5532a",
          catalog: null
        },
        {
          name: "Orange",
          color: "#f28c28",
          catalog: null
        },
        {
          name: "Gold",
          color: "#e0a800",
          catalog: null
        },
        {
          name: "Yellow",
          color: "#f7e017",
          catalog: null
        },
        {
          name: "Lemon",
          color: "#fff47a",
          catalog: null
        },
        {
          name: "Lime Green",
          color: "#8cc63f",
          catalog: null
        },
        {
          name: "Green",
          color: "#2e9e3e",
          catalog: null
        },
        {
          name: "Forest Green",
          color: "#1b5e2f",
          catalog: null
        },
        {
          name: "Olive",
          color: "#6b7a2a",
          catalog: null
        },
        {
          name: "Teal",
          color: "#0e8a8a",
          catalog: null
        },
        {
          name: "Turquoise",
          color: "#2cc4c4",
          catalog: null
        },
        {
          name: "Sky Blue",
          color: "#7ec8f0",
          catalog: null
        },
        {
          name: "Blue",
          color: "#1f5fbf",
          catalog: null
        },
        {
          name: "Royal Blue",
          color: "#1b3fa0",
          catalog: null
        },
        {
          name: "Navy",
          color: "#14214d",
          catalog: null
        },
        {
          name: "Lavender",
          color: "#b9a3e3",
          catalog: null
        },
        {
          name: "Purple",
          color: "#7a3fa0",
          catalog: null
        },
        {
          name: "Magenta",
          color: "#c2187a",
          catalog: null
        },
        {
          name: "Pink",
          color: "#f48fb1",
          catalog: null
        },
        {
          name: "Light Pink",
          color: "#f9cfe0",
          catalog: null
        },
        {
          name: "Red",
          color: "#d81e1e",
          catalog: null
        },
        {
          name: "Burgundy",
          color: "#7a1428",
          catalog: null
        },
        {
          name: "Coral",
          color: "#f2705c",
          catalog: null
        }
      ]
    };
  }
});

// src/affinity/adapter.js
var adapter_exports = {};
__export(adapter_exports, {
  createAdapter: () => createAdapter,
  patternToLines: () => patternToLines
});
function createAdapter(sdk2) {
  function needDoc() {
    const info = sdk2.getDocumentInfo();
    if (!info) {
      sdk2.alertBox("Open a document first.");
      return null;
    }
    return info;
  }
  const tolPx = (info) => mmToPx(TOL_MM, info.dpi);
  function gather(info, scope) {
    return scope === "Selection" ? sdk2.readSelection(tolPx(info)) : sdk2.readAll(tolPx(info));
  }
  function build(info, store, raws, planOpts) {
    const shapes = raws.map((r2) => toEngineShape(r2, info.dpi, paramsFor(store, r2.nodeId, shapeSignature(r2, info.dpi)), { toleranceMm: TOL_MM }));
    const blocks = shapes.flatMap((s) => stitchShape(s));
    const { pattern, stats } = buildPattern(blocks, planOpts);
    pattern.meta.name = (info.title || "Untitled").replace(/\.[^.]*$/, "").slice(0, 16);
    return { pattern, stats, shapes };
  }
  function editParams() {
    const info = needDoc();
    if (!info) return;
    const raws = sdk2.readSelection(tolPx(info));
    if (!raws.length) {
      sdk2.alertBox("Select one or more vector shapes first.");
      return;
    }
    const store = loadStore(sdk2, info);
    const first = paramsFor(store, raws[0].nodeId, shapeSignature(raws[0], info.dpi));
    const res = sdk2.runDialog(`Embroidery params (${raws.length} object${raws.length > 1 ? "s" : ""})`, paramFields(first), 480);
    if (!res) return;
    const patch2 = paramsFromDialog(res);
    for (const r2 of raws) {
      const sig = shapeSignature(r2, info.dpi);
      setParams(store, r2.nodeId, sig, { ...paramsFor(store, r2.nodeId, sig), ...patch2 });
    }
    saveStore(sdk2, info, store);
    sdk2.alertBox(`Saved stitch settings for ${raws.length} object(s) in ${baseOf(info.path || "untitled")}.embroidery.json`);
  }
  function exportEmbroidery() {
    const info = needDoc();
    if (!info) return;
    const store = loadStore(sdk2, info);
    const last = store.export || {};
    const fmts = formatItems();
    const outDir = info.path ? dirOf(info.path) : info.desktop || "";
    const fmtLabel = fmts.find((f) => f.key === last.format)?.label ?? fmts[0].label;
    const defPath = (key) => `${outDir ? outDir + "/" : ""}${(info.title || "design").replace(/\.[^.]*$/, "")}.${FORMATS[key].ext}`;
    const first = sdk2.runDialog("Export embroidery", [
      { id: "format", type: "combo", label: "File format", group: "Output", items: fmts.map((f) => f.label), value: fmtLabel },
      { id: "path", type: "text", label: "Output path (full path incl. file name)", group: "Output", value: last.path || defPath(fmts.find((f) => f.label === fmtLabel).key) },
      { id: "scope", type: "buttons", label: "Export", group: "Output", items: ["Selection", "Whole page"], value: last.scope || "Whole page" },
      { id: "hoop", type: "combo", label: "Hoop size", group: "Machine", items: HOOPS.map((h) => h.name), value: last.hoop || HOOPS[0].name },
      { id: "palette", type: "combo", label: "Snap thread colours to", group: "Machine", items: PALETTES, value: last.palette || PALETTES[0] },
      { id: "optimise", type: "check", label: "Optimise (group colours, shortest travel)", group: "Plan", value: last.optimise ?? true },
      { id: "trimThreshold", type: "number", label: "Trim jumps longer than", group: "Plan", unit: "mm", min: 0.5, max: 50, value: last.trimThreshold ?? PLAN_DEFAULTS.trimThreshold },
      { id: "ties", type: "check", label: "Tie-in / tie-off stitches", group: "Plan", value: last.ties ?? true },
      { id: "threadList", type: "check", label: "Also write thread list (.txt)", group: "Plan", value: last.threadList ?? true }
    ], 480);
    if (!first) return;
    const fmt = fmts.find((f) => f.label === first.format);
    const hoop = HOOPS.find((h) => h.name === first.hoop) || HOOPS[0];
    const pal = PALETTE_DATA[Math.max(0, PALETTES.indexOf(first.palette))];
    const raws = gather(info, first.scope);
    if (!raws.length) {
      sdk2.alertBox(first.scope === "Selection" ? "Nothing selected." : "No vector shapes found on this page.");
      return;
    }
    const { pattern, stats } = build(info, store, raws, {
      optimise: first.optimise,
      trimThreshold: first.trimThreshold,
      tieIn: first.ties,
      tieOff: first.ties,
      palette: pal ? loadPalette(pal) : null
    });
    if (!stats.stitches) {
      sdk2.alertBox("Nothing to stitch: the chosen shapes produced no stitches.");
      return;
    }
    const fits = !hoop.w || stats.widthMm <= hoop.w && stats.heightMm <= hoop.h;
    const summary = [
      { id: "s1", type: "static", label: "Stitches", group: "Design", value: String(stats.stitches) },
      { id: "s2", type: "static", label: "Colours / colour changes", group: "Design", value: `${stats.colors} / ${stats.colorChanges}` },
      { id: "s3", type: "static", label: "Trims / jumps", group: "Design", value: `${stats.trims} / ${stats.jumps}` },
      { id: "s4", type: "static", label: "Size", group: "Design", value: `${stats.widthMm.toFixed(1)} x ${stats.heightMm.toFixed(1)} mm` },
      { id: "s5", type: "static", label: "Hoop", group: "Design", value: hoop.w ? fits ? `fits ${hoop.name}` : `DOES NOT FIT ${hoop.name}` : "not checked" },
      { id: "s6", type: "static", label: "Threads", group: "Design", value: stats.threads.map((t, i) => `${i + 1}:${t.hex}${t.name && t.name !== t.hex ? " " + t.name : ""}`).join("  ") },
      { id: "s7", type: "static", label: "Writes", group: "Design", value: `${fmt.label} -> ${first.path}` }
    ];
    if (!sdk2.runDialog("Export embroidery - confirm", summary, 520)) return;
    const bytes = FORMATS[fmt.key].write(pattern, {});
    sdk2.writeFileBytes(first.path, bytes);
    let extra = "";
    if (first.threadList) {
      const txt = first.path.replace(/\.[^./\\]+$/, "") + "-threads.txt";
      sdk2.writeText(txt, threadReport(pattern, stats, pattern.meta.name));
      extra = `
Thread list: ${txt}`;
    }
    store.export = { format: fmt.label, path: first.path, scope: first.scope, hoop: hoop.name, palette: first.palette, optimise: first.optimise, trimThreshold: first.trimThreshold, ties: first.ties, threadList: first.threadList };
    saveStore(sdk2, info, store);
    sdk2.alertBox(`Wrote ${bytes.length} bytes to ${first.path}${extra}`);
  }
  function preview() {
    const info = needDoc();
    if (!info) return;
    const store = loadStore(sdk2, info);
    const sel = sdk2.readSelection(tolPx(info));
    const raws = sel.length ? sel : sdk2.readAll(tolPx(info));
    if (!raws.length) {
      sdk2.alertBox("No vector shapes to preview.");
      return;
    }
    const { pattern, stats } = build(info, store, raws, { center: false, optimise: store.export?.optimise ?? true });
    sdk2.addPreview(patternToLines(pattern, info.dpi));
    sdk2.alertBox(`Preview drawn on layer "${sdk2.PREVIEW_NAME}": ${stats.stitches} stitches, ${stats.colors} colours.
Run "Clear preview" to remove it.`);
  }
  function clearPreview() {
    if (!needDoc()) return;
    const n = sdk2.removePreview();
    sdk2.alertBox(n ? "Preview removed." : "No preview layer found.");
  }
  function threadList() {
    const info = needDoc();
    if (!info) return;
    const store = loadStore(sdk2, info);
    const raws = gather(info, "Whole page");
    if (!raws.length) {
      sdk2.alertBox("No vector shapes found.");
      return;
    }
    const outDir = info.path ? dirOf(info.path) : info.desktop || "";
    const res = sdk2.runDialog("Thread list", [{ id: "path", type: "text", label: "Write to", group: "Output", value: `${outDir ? outDir + "/" : ""}${baseOf(info.title || "design")}-threads.txt` }]);
    if (!res) return;
    const { pattern, stats } = build(info, store, raws, {});
    const text = threadReport(pattern, stats, pattern.meta.name);
    sdk2.writeText(res.path, text);
    sdk2.alertBox(text + `
Saved to ${res.path}`);
  }
  function menu() {
    const actions = { "Params (edit stitch settings)": editParams, "Export embroidery file": exportEmbroidery, "Preview stitches": preview, "Clear preview": clearPreview, "Thread list": threadList };
    const r2 = sdk2.runDialog("Embroidery", [{ id: "a", type: "combo", label: "Action", group: "", items: Object.keys(actions), value: "Export embroidery file" }], 380);
    if (r2) actions[r2.a]();
  }
  return { editParams, exportEmbroidery, preview, clearPreview, threadList, menu };
}
function patternToLines(pattern, dpi, weightMm = 0.18) {
  const k = duToPx(dpi);
  const lines = [];
  let ti = 0, cur = null;
  const rgb = () => pattern.threads[Math.min(ti, pattern.threads.length - 1)]?.color ?? 8421504;
  const flush = () => {
    if (cur && cur.pts.length > 1) lines.push(cur);
    cur = null;
  };
  for (const s of pattern.stitches) {
    if (s.cmd === CMD.STITCH) {
      if (!cur) cur = { pts: [], rgb: rgb(), weightPx: Math.max(0.5, mmToPx(weightMm, dpi)) };
      cur.pts.push([s.x * k, s.y * k]);
    } else {
      flush();
      if (s.cmd === CMD.COLOR_CHANGE) ti++;
      if (s.cmd === CMD.JUMP) cur = { pts: [[s.x * k, s.y * k]], rgb: rgb(), weightPx: Math.max(0.5, mmToPx(weightMm, dpi)) };
    }
  }
  flush();
  return lines;
}
var PALETTE_DATA, TOL_MM, dirOf, baseOf;
var init_adapter = __esm({
  "src/affinity/adapter.js"() {
    init_stitch();
    init_plan();
    init_formats();
    init_pattern();
    init_palette();
    init_params();
    init_convert();
    init_storage();
    init_ui_spec();
    init_palette_madeira();
    init_palette_isacord();
    init_palette_robison_anton();
    PALETTE_DATA = [null, palette_madeira_default, palette_isacord_default, palette_robison_anton_default];
    TOL_MM = 0.2;
    dirOf = (p) => p.replace(/[/\\][^/\\]*$/, "");
    baseOf = (p) => p.replace(/^.*[/\\]/, "").replace(/\.[^.]*$/, "");
  }
});

// src/affinity/entries/preview.cjs
var sdk = require_sdk();
var { createAdapter: createAdapter2 } = (init_adapter(), __toCommonJS(adapter_exports));
var started = false;
function main() {
  if (started) return;
  started = true;
  try {
    createAdapter2(sdk).preview();
  } catch (e) {
    sdk.alertBox("Embroidery error: " + (e && e.stack ? e.stack : e));
  }
}
module.exports.main = main;
main();
