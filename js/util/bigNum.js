// js/util/bigNum.js
export class BigNum {
  static DEFAULT_PRECISION = 18;
  static MAX_E = 1.7976931348623157e+308; // Number.MAX_VALUE

  constructor(sig, e, p = BigNum.DEFAULT_PRECISION) {
    this.p = p | 0;
    this.sig = BigInt(sig);

    const ee = Number(e);
    if (!Number.isFinite(ee) || ee >= BigNum.MAX_E) {
      this.e = BigNum.MAX_E;
      this.inf = true;
    } else {
      this.e = Math.trunc(ee);
      this.inf = false;
    }
    this.#normalize();
  }

  static zero(p = BigNum.DEFAULT_PRECISION) { return new BigNum(0n, 0, p); }

  static fromInt(n, p = BigNum.DEFAULT_PRECISION) {
    return new BigNum(BigInt(n), 0, p);
  }

  static fromScientific(str, p = BigNum.DEFAULT_PRECISION) {
    const m = String(str).match(/^(\d+(?:\.\d+)?)e([+-]?\d+)$/i);
    if (!m) return new BigNum(BigInt(str), 0, p);
    const [, mant, expStr] = m;
    const e = parseInt(expStr, 10);
    const digits = mant.replace('.', '');
    const shift = mant.includes('.') ? (mant.length - mant.indexOf('.') - 1) : 0;
    const sig = BigInt(digits);
    return new BigNum(sig, e - shift, p);
  }

  static fromStorage(str, p = BigNum.DEFAULT_PRECISION) {
    if (!str) return null;
    if (typeof str !== 'string') str = String(str);
    if (str.startsWith('BN:')) {
      const [, pStr, sigStr, eStr] = str.split(':');
      const pp = parseInt(pStr, 10) || p;
      let eNum = Number(eStr);
      if (!Number.isFinite(eNum)) eNum = BigNum.MAX_E;
      return new BigNum(BigInt(sigStr), eNum, pp);
    }
    return BigNum.fromScientific(str, p);
  }

  toStorage() {
    return `BN:${this.p}:${this.sig.toString()}:${this.inf ? BigNum.MAX_E : this.e}`;
  }

  clone() {
    const c = new BigNum(this.sig, this.e, this.p);
    c.inf = !!this.inf;
    return c;
  }

  isZero() { return !this.inf && this.sig === 0n; }
  isInfinite() { return !!this.inf; }

  // ---------------------------------------------------------------------------
  // PRIVATE HELPERS
  // ---------------------------------------------------------------------------

  // fast power of 10 as BigInt
  #pow10(k) { return k <= 0 ? 1n : 10n ** BigInt(k); }

  // normalize significand to maintain precision p
  #normalize() {
    if (this.inf) return;
    if (this.sig === 0n) { this.e = 0; return; }

    let s = this.sig;
    const p = this.p;
    const d = s.toString().length;
    const shift = d - p;

    if (shift > 0) {
      const base = this.#pow10(shift);
      let q = s / base;
      const r = s % base;
      if (r * 2n >= base) q += 1n; // round half up
      s = q;
      this.e += shift;
      if (this.e >= BigNum.MAX_E) { this.e = BigNum.MAX_E; this.inf = true; return; }
      if (s.toString().length > p) { // carry overflow
        s = s / 10n;
        this.e += 1;
        if (this.e >= BigNum.MAX_E) { this.e = BigNum.MAX_E; this.inf = true; return; }
      }
    } else if (shift < 0) {
      const k = -shift;
      s = s * this.#pow10(k);
      this.e -= k;
    }

    this.sig = s;
  }

  // align other significand for addition
  #alignSig(other) {
    const diff = Math.abs(this.e - other.e);
    if (diff === 0) return other.sig;
    if (diff > this.p + 2) return 0n; // negligible
    const base = this.#pow10(diff);
    let q = other.sig / base;
    const r = other.sig % base;
    if (r * 2n >= base) q += 1n;
    return q;
  }

  // ---------------------------------------------------------------------------
  // ARITHMETIC
  // ---------------------------------------------------------------------------

  add(b) {
    if (!(b instanceof BigNum)) b = BigNum.fromInt(b, this.p);
    if (this.inf || b.inf) {
      const out = this.clone(); out.inf = this.inf || b.inf; out.e = BigNum.MAX_E; return out;
    }
    if (this.isZero()) return b.clone();
    if (b.isZero()) return this.clone();
    if (this.e >= b.e) return new BigNum(this.sig + this.#alignSig(b), this.e, this.p);
    return new BigNum(b.sig + b.#alignSig(this), b.e, this.p);
  }

  iadd(b) { const r = this.add(b); this.sig = r.sig; this.e = r.e; this.inf = r.inf; return this; }

  mulSmall(k) {
    if (k < 0) throw new Error('BigNum only supports non-negative values');
    if (this.inf) return this.clone();
    if (k === 0) return BigNum.zero(this.p);
    if (k === 1) return this.clone();
    const out = new BigNum(this.sig * BigInt(k), this.e, this.p);
    return out;
  }

  imulSmall(k) { const r = this.mulSmall(k); this.sig = r.sig; this.e = r.e; this.inf = r.inf; return this; }

  cmp(b) {
    if (!(b instanceof BigNum)) b = BigNum.fromInt(b, this.p);
    if (this.inf || b.inf) return this.inf === b.inf ? 0 : this.inf ? 1 : -1;
    if (this.isZero() && b.isZero()) return 0;
    if (this.e !== b.e) return this.e > b.e ? 1 : -1;
    if (this.sig === b.sig) return 0;
    return this.sig > b.sig ? 1 : -1;
  }

  // ---------------------------------------------------------------------------
  // FORMATTING
  // ---------------------------------------------------------------------------

  get decExp() {
    return this.inf ? Number.POSITIVE_INFINITY : (this.e + (this.p - 1));
  }

  toScientific(digits = 3) {
    if (this.inf) return 'Infinity';
    if (this.isZero()) return '0';
    const s = this.sig.toString().padStart(this.p, '0');
    const head = s[0];
    const tail = s.slice(1, 1 + digits).replace(/0+$/g, '');
    const mant = tail ? `${head}.${tail}` : head;
    const E = this.e + (this.p - 1);
    return `${mant}e${E}`;
  }

  toPlainIntegerString() {
    if (this.inf) return 'Infinity';
    if (this.isZero()) return '0';
    const s = this.sig.toString().padStart(this.p, '0');
    const intDigits = this.e + this.p;
    if (intDigits <= 0) return '0';
    if (intDigits <= this.p) return s.slice(0, intDigits).replace(/^0+/, '') || '0';
    return (s + '0'.repeat(intDigits - this.p)).replace(/^0+/, '') || '0';
  }
}
