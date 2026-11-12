// Stitch parameters. User-facing values are in millimetres / degrees; the engine
// works in design units (1 du = 0.1 mm), so everything goes through resolveParams().
export const MM = 10; // du per mm

/** Defaults, in mm and degrees. Every key can be overridden per object. */
export const DEFAULTS = Object.freeze({
  type: 'auto', // auto | running | fill | contour | satin | manual | none
  // thresholds for 'auto'
  satinMinWidth: 1.5, // strokes at least this wide become satin, thinner become running
  // running stitch
  stitchLength: 2.5,
  repeats: 1, // whole-path passes (forward, back, forward ...)
  bean: false, // bean (triple) stitch: every stitch is sewn forward-back-forward
  beanRepeats: 1, // extra back-and-forth per stitch when bean is on (1 = triple)
  runCornerAngle: 30, // degrees; vertices sharper than this always get a stitch
  tolerance: 0.2, // curve flattening tolerance (mm)
  // fill
  fillAngle: 0,
  rowSpacing: 0.25,
  maxStitchLength: 3.0,
  stagger: 4, // rows before the stitch pattern repeats (0/1 = no stagger)
  expand: 0, // grow (+) or shrink (-) the fill outline, mm (pull compensation for fills)
  fillStart: null, // [x,y] mm in document space, optional
  fillEnd: null,
  travelMax: 5, // max distance (mm) bridged with running travel stitches inside the shape
  fillUnderlay: true,
  fillUnderlayAngle: 90, // relative to fillAngle
  fillUnderlaySpacing: 1.5,
  fillUnderlayInset: 0.4,
  fillUnderlayMaxStitch: 3.0,
  // satin
  satinSpacing: 0.4, // distance between zig-zag lines (density = 1/spacing)
  satinPullComp: 0.2, // total extra width (mm), applied half per side
  satinMaxStitch: 12, // rungs longer than this are split
  satinCenterWalk: true,
  satinContour: false,
  satinZigzag: false,
  satinUnderlayInset: 0.4, // mm from each rail
  satinUnderlayStitch: 2.0, // running length of walk / contour underlay
  satinZigzagSpacing: 2.0,
  shortStitch: true,
  shortStitchDistance: 0.35, // mm: rail points closer than this trigger short stitches
  shortStitchInset: 0.2, // fraction of the rung that is cut off
  satinRails: null, // optional explicit [railA, railB] polylines (du), for two-rail columns
  // general
  threadColor: null, // override colour (#rrggbb)
});

/** Merge overrides over defaults.
 * @param {any} [over]
 * @returns {any} */
export function resolveParams(over = {}) {
  const p = { ...DEFAULTS };
  for (const [k, v] of Object.entries(over || {})) if (v !== undefined && k in DEFAULTS) p[k] = v;
  return p;
}
export const du = (mm) => mm * MM;
