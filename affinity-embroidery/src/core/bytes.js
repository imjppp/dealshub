// Growable byte buffer with the integer helpers the machine formats need.
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
  str(s) { return this.bytes(new TextEncoder().encode(s)); }
  /** UTF-16 big-endian, no terminator. */
  str16be(s) { for (let i = 0; i < s.length; i++) this.u16be(s.charCodeAt(i)); return this; }
  result() { return this.buf.slice(0, this.len); }
}
