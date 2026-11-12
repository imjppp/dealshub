/**
 * name: Embroidery Spike 4: dialog
 * description: Diagnostic spike for the affinity-embroidery plugin. Prints what the SDK does; writes embroidery-spike-N.txt to the Desktop.
 * version: 0.1.0
 * author: affinity-embroidery
 */
// Spike 4 - dialog: inputs and reading values back
// Self-contained: Script Editor panel > New Script > paste this whole file > Run (F5 / Ctrl+Return; Cmd+Return on Mac).
// Needs Settings > Scripting > "Enable Affinity Scripting"; spikes 3 and 5 also need "Access the file system" ticked in the
// script's own Settings and your Desktop folder added under Settings > Scripting > File System access.
// Output: shown in an alert AND written to <Desktop>/embroidery-spike-4.txt (in case the alert truncates).
'use strict';
const { ApplicationApi } = require('affinity:application');
const { UiApi } = require('affinity:ui');
const { File } = require('/fs.js');

const lines = [];
const log = (...a) => { const s = a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x, (k, v) => (typeof v === 'bigint' ? v.toString() + 'n' : v)))).join(' '); lines.push(s); try { console.log(s); } catch (e) {} };
const enc = (s) => Uint8Array.from(unescape(encodeURIComponent(s)), (c) => c.charCodeAt(0));
const dec = (u8) => decodeURIComponent(escape(String.fromCharCode.apply(null, Array.from(u8))));
const attempt = (label, fn) => { try { const r = fn(); log(`OK   ${label}`, r === undefined ? '' : r); return r; } catch (e) { log(`FAIL ${label}: ${e && e.message ? e.message : e}`); return undefined; } };
function finish() {
  const text = lines.join('\n');
  try { const f = File.create(ApplicationApi.getUserDesktopPath() + '/embroidery-spike-4.txt', 'wb'); const b = enc(text); f.write(b.buffer, b.byteLength); f.close(); } catch (e) { lines.push('(could not write log file: ' + e.message + ')'); }
  UiApi.alert(text.slice(0, 1800), 'Spike 4');
}

const { Dialog, DialogResult } = require('/dialog.js');
const { UnitType } = require('/units.js');
const { Colour } = require('/colours.js');
const isOk = (r) => (r?.value ?? r) == DialogResult.Ok.value;
function main() {
  const dlg = Dialog.create('Spike 4 - dialog');
  const col = dlg.addColumn();
  const g1 = col.addGroup('Basics');
  const text = g1.addTextBox('Text box', 'hello');
  const combo = g1.addComboBox('Combo', ['alpha', 'beta', 'gamma'], 1);
  const buttons = g1.addButtonSet('Button set', ['One', 'Two'], 0);
  const check = g1.addCheckBox('Check box', true);
  const g2 = col.addGroup('Numbers (unit-value editors)');
  const mm = g2.addUnitValueEditor('Millimetres', UnitType.Millimetre, UnitType.Millimetre, 2.5, 0.1, 50);
  const deg = g2.addUnitValueEditor('Degrees', UnitType.Degree, UnitType.Degree, 45, -360, 360);
  const num = g2.addUnitValueEditor('Plain number', UnitType.Number, UnitType.Number, 4, 0, 99);
  attempt('setPrecision on mm editor', () => mm.setPrecision(2) && 'ok');
  const g3 = col.addGroup('Other');
  const colour = g3.addColourPicker('Colour', Colour.createRGBA8({ r: 255, g: 0, b: 0, alpha: 255 }));
  const staticT = g3.addStaticText('Static', 'read-only text');
  // enable/disable: slave follows the check box
  const slave = g3.addTextBox('Enabled only when the check box is ticked', 'x');
  const upd = () => { slave.isEnabled = check.value; };
  attempt('onValueChangedHandler', () => { check.onValueChangedHandler = upd; upd(); return 'ok'; });
  dlg.initialWidth = 460;
  const result = dlg.runModal();
  log('ok pressed:', isOk(result), 'raw result:', String(result && (result.name ?? result.value ?? result)));
  if (isOk(result)) {
    log('text.text =', text.text);
    log('combo.selectedIndex =', combo.selectedIndex);
    log('buttons.selectedIndex =', buttons.selectedIndex);
    log('check.value =', check.value);
    log('mm.value =', mm.value, '(requested 2.5; the editor reports its OWN unit - confirm it is mm)');
    log('deg.value =', deg.value);
    log('num.value =', num.value);
    attempt('colour.value.rgba8', () => colour.value && colour.value.rgba8);
  }
  log('INTERPRET: the plugin assumes mm editors return mm and degree editors return degrees. If mm.value differs from what you typed, tell me the unit.');
  finish();
}
module.exports.main = main;
try { main(); } catch (e) { log('CRASH: ' + (e && e.stack ? e.stack : e)); finish(); } // the Script Editor expects the script to call main() itself
