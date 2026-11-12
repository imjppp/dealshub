/**
 * name: Embroidery Spike 3: file write
 * description: Diagnostic spike for the affinity-embroidery plugin. Prints what the SDK does; writes embroidery-spike-N.txt to the Desktop.
 * version: 0.1.0
 * author: affinity-embroidery
 */
// Spike 3 - file: write a binary file
// Self-contained: Script Editor panel > New Script > paste this whole file > Run (F5 / Ctrl+Return; Cmd+Return on Mac).
// Needs Settings > Scripting > "Enable Affinity Scripting"; spikes 3 and 5 also need "Access the file system" ticked in the
// script's own Settings and your Desktop folder added under Settings > Scripting > File System access.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-3.txt (in case the alert truncates).
'use strict';
const { ApplicationApi } = require('affinity:application');
const { UiApi } = require('affinity:ui');
const { File } = require('/fs.js');

const lines = [];
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '); lines.push(s); try { console.log(s); } catch (e) {} };
const enc = (s) => Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));
const dec = (u8) => decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(u8))));
const attempt = (label, fn) => { try { const r = fn(); log(`OK   ${label}`, r === undefined ? '' : r); return r; } catch (e) { log(`FAIL ${label}: ${e && e.message ? e.message : e}`); return undefined; } };
function finish() {
  const text = lines.join('\n');
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-3.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 3');
}

const { Document } = require('/document.js');
const { FileSystemApi } = require('affinity:fs');
function main() {
  log('permission FileSystem:', attempt('hasPermission', () => require('affinity:application').EnvironmentApi.hasPermission(require('affinity:application').EnvironmentPermission.FileSystem)));
  const dflt = ApplicationApi.getUserDesktopPath() + '/embroidery-spike-3.bin';
  // 1) Is there a SAVE dialog? The d.ts only has UiApi.chooseFile() (open-style) and UiApi.prompt(). Test both.
  const picked = attempt('UiApi.chooseFile() (pick ANY existing file - Cancel is fine)', () => UiApi.chooseFile());
  log('   -> chooseFile is an OPEN dialog: it can pick an existing file/location but cannot name a new one.');
  const path = attempt('UiApi.prompt(path)', () => UiApi.prompt('Where should the 256-byte test file go? (full path incl. name)', 'Spike 3', dflt));
  const target = (path && path.length) ? path : dflt;
  log('target:', target);
  const bytes = new Uint8Array(256); for (let i = 0; i < 256; i++) bytes[i] = i;
  attempt('File.create(path,"wb") + write(ArrayBuffer)', () => { const f = File.create(target, 'wb'); const n = f.write(bytes.buffer, bytes.byteLength); f.flush(); f.close(); return 'wrote ' + n; });
  attempt('exists', () => FileSystemApi.exists(target));
  attempt('size', () => FileSystemApi.getFileSize(target, false));
  attempt('read back and compare', () => { const f = File.create(target, 'rb'); const b = new ArrayBuffer(256); const n = f.read(b, 256); f.close(); const u = new Uint8Array(b); let ok = n === 256; for (let i = 0; i < 256; i++) if (u[i] !== i) ok = false; return 'read ' + n + ' identical=' + ok; });
  attempt('write a subarray view (typed array with byteOffset)', () => { const big = new Uint8Array(512); big.set(bytes, 100); const view = big.subarray(100, 356); const f = File.create(target + '.view', 'wb'); const n = f.write(view, view.byteLength); f.close(); return 'wrote ' + n + ' (expect 256) size=' + FileSystemApi.getFileSize(target + '.view', false); });
  attempt('createDirectories (nested)', () => { FileSystemApi.createDirectories(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-dir/a/b'); return FileSystemApi.isDirectory(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-dir/a/b'); });
  log('INTERPRET: if "wrote" is 256 and the identical=true, DST/PES/... export will work. Delete the files created on the Desktop afterwards.');
  finish();
}
module.exports.main = main;
main(); // the Script Editor expects the script to call main() itself
