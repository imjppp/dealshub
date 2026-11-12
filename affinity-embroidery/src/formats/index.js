// Format registry.
import * as dst from './dst.js';
import * as exp from './exp.js';
import * as jef from './jef.js';
import * as pec from './pec.js';
import * as pes from './pes.js';
import * as vp3 from './vp3.js';
import * as xxx from './xxx.js';
import * as u01 from './u01.js';

/** @type {Record<string,{label:string, ext:string, write:(p:any,o?:any)=>Uint8Array, opts?:any, caps:any}>} */
export const FORMATS = {
  dst: { label: 'Tajima DST', ext: 'dst', write: dst.write, caps: dst.caps },
  exp: { label: 'Melco EXP', ext: 'exp', write: exp.write, caps: exp.caps },
  jef: { label: 'Janome JEF', ext: 'jef', write: jef.write, caps: jef.caps },
  pec: { label: 'Brother PEC', ext: 'pec', write: pec.write, caps: pec.caps },
  pes1: { label: 'Brother PES (v1)', ext: 'pes', write: (p, o) => pes.write(p, { ...o, version: 1 }), caps: pes.caps },
  pes6: { label: 'Brother PES (v6)', ext: 'pes', write: (p, o) => pes.write(p, { ...o, version: 6 }), caps: pes.caps },
  vp3: { label: 'Husqvarna/Pfaff VP3', ext: 'vp3', write: vp3.write, caps: vp3.caps },
  xxx: { label: 'Compucon/Singer XXX', ext: 'xxx', write: xxx.write, caps: xxx.caps },
  u01: { label: 'Barudan U01', ext: 'u01', write: u01.write, caps: u01.caps },
};

export function writeFormat(key, pattern, opts) {
  const f = FORMATS[key];
  if (!f) throw new Error('Unknown format: ' + key);
  return f.write(pattern, opts);
}
