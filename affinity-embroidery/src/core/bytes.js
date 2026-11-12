// Growable byte buffer with the integer helpers the machine formats need.
// No TextEncoder/TextDecoder: the Affinity script runtime is not guaranteed to provide them.

/** UTF-8 encode a string to a Uint8Array. */
export function utf8Encode(s) {
  const out = [];
  for (let i = 0; i < s.length; i++) {
    let c = s.codePointAt(i);
    if (c > 0xffff) i++;
    if (c < 0x80) out.push(c);
    else if (c < 0x800) out.push(0xc0 | (c >> 6), 0x80 | (c & 63));
    else if (c < 0x10000) out.push(0xe0 | (c >> 12), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
    else out.push(0xf0 | (c >> 18), 0x80 | ((c >> 12) & 63), 0x80 | ((c >> 6) & 63), 0x80 | (c & 63));
  }
  return Uint8Array.from(out);
}
/** UTF-8 decode (lenient). */
export function utf8Decode(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length;) {
    const c = bytes[i++];
    if (c < 0x80) s += String.fromCharCode(c);
    else if (c < 0xe0) s += String.fromCharCode(((c & 31) << 6) | (bytes[i++] & 63));
    else if (c < 0xf0) { s += String.fromCharCode(((c & 15) << 12) | ((bytes[i] & 63) << 6) | (bytes[i + 1] & 63)); i += 2; }
    else { const cp = ((c & 7) << 18) | ((bytes[i] & 63) << 12) | ((bytes[i + 1] & 63) << 6) | (bytes[i + 2] & 63); i += 3; s += String.fromCodePoint(cp); }
  }
  return s;
}

export class ByteWriter {
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
  _adv(n) { this.pos += n; if (this.pos > this.len) this.len = this.pos; }
  tell() { return this.pos; }
  seek(p) { this.pos = p; }
  u8(v) { this._ensure(1); this.buf[this.pos] = v & 0xff; this._adv(1); return this; }
  u16le(v) { this._ensure(2); this.dv.setUint16(this.pos, v & 0xffff, true); this._adv(2); return this; }
  u16be(v) { this._ensure(2); this.dv.setUint16(this.pos, v & 0xffff, false); this._adv(2); return this; }
  u24le(v) { return this.u8(v).u8(v >> 8).u8(v >> 16); }
  u24be(v) { return this.u8(v >> 16).u8(v >> 8).u8(v); }
  u32le(v) { this._ensure(4); this.dv.setUint32(this.pos, v >>> 0, true); this._adv(4); return this; }
  u32be(v) { this._ensure(4); this.dv.setUint32(this.pos, v >>> 0, false); this._adv(4); return this; }
  f32le(v) { this._ensure(4); this.dv.setFloat32(this.pos, v, true); this._adv(4); return this; }
  bytes(arr) { this._ensure(arr.length); this.buf.set(arr, this.pos); this._adv(arr.length); return this; }
  fill(v, n) { for (let i = 0; i < n; i++) this.u8(v); return this; }
  /** UTF-8 string, no terminator. */
  str(s) { return this.bytes(utf8Encode(s)); }
  /** UTF-16 big-endian, no terminator. */
  str16be(s) { for (let i = 0; i < s.length; i++) this.u16be(s.charCodeAt(i)); return this; }
  result() { return this.buf.slice(0, this.len); }
}
