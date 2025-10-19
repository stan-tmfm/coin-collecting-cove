// js/util/bigNum.js
// Minimal arbitrary-magnitude decimal for *non-negative* values (great for idle/incremental currencies).
// Representation: value = sig * 10^(e - (p - 1)), where `sig` is a BigInt with exactly `p` digits (unless zero).
// Default precision p=18 keeps ~18 significant digits which is plenty for a game UI and fast for BigInt math.

export class BigNum {
  static DEFAULT_PRECISION = 18; // number of significant digits tracked

  constructor(sig, e, p = BigNum.DEFAULT_PRECISION) {
    // sig: BigInt >= 0; e: integer (can be large); p: precision digits
    this.p = p | 0;
    this.sig = BigInt(sig);
    this.e = Math.trunc(e);
    this.#normalize();
  }

  // --- Constructors ---------------------------------------------------------
  static zero(p = BigNum.DEFAULT_PRECISION) { return new BigNum(0n, 0, p); }

  static fromInt(n, p = BigNum.DEFAULT_PRECISION) {
    if (!Number.isFinite(n) || n < 0) throw new Error('BigNum.fromInt expects a non-negative finite number');
    if (n === 0) return BigNum.zero(p);
    const s = Math.trunc(n).toString();
    // Create with raw sig digits, let normalize fit to precision
    return new BigNum(BigInt(s), s.length - 1, p);
  }

  static fromScientific(str, p = BigNum.DEFAULT_PRECISION) {
    // Accepts forms like "1.23e456", "7e9", or plain integer string "123456".
    if (typeof str !== 'string') str = String(str);
    str = str.trim();
    if (str === '' || str === '0') return BigNum.zero(p);

    let mStr, e;
    const eIdx = str.toLowerCase().indexOf('e');
    if (eIdx >= 0) {
      mStr = str.slice(0, eIdx);
      e = parseInt(str.slice(eIdx + 1), 10) || 0;
    } else {
      mStr = str;
      e = 0;
    }
    // Remove sign, commas
    if (mStr[0] === '+') mStr = mStr.slice(1);
    if (mStr[0] === '-') throw new Error('BigNum only supports non-negative values');
    mStr = mStr.replaceAll(',', '');

    // Split decimal point
    const dot = mStr.indexOf('.');
    let digits = mStr.replace('.', '');
    const decPlaces = (dot >= 0) ? (mStr.length - dot - 1) : 0;

    // Strip leading zeros
    digits = digits.replace(/^0+/, '');
    if (digits.length === 0) return BigNum.zero(p);

    // logical exponent for our (sig, e, p) storage
    const logicalE = (e - decPlaces) + (digits.length - 1);
    return new BigNum(BigInt(digits), logicalE, p);
  }

  static fromStorage(str, p = BigNum.DEFAULT_PRECISION) {
    if (!str) return null;
    // Storage format: "BN:<p>:<sig>:<e>" OR legacy plain scientific like "1.23e45"
    if (typeof str !== 'string') str = String(str);
    if (str.startsWith('BN:')) {
      const [, pStr, sigStr, eStr] = str.split(':');
      const pp = parseInt(pStr, 10) || p;
      return new BigNum(BigInt(sigStr), parseInt(eStr, 10) || 0, pp);
    }
    // Fallback: parse scientific/integer string
    return BigNum.fromScientific(str, p);
  }

  toStorage() { return `BN:${this.p}:${this.sig.toString()}:${this.e}`; }

  clone() { return new BigNum(this.sig, this.e, this.p); }

  isZero() { return this.sig === 0n; }

  // --- Core math ------------------------------------------------------------
  #pow10Cache = new Map();
  #pow10(n) {
    // Only need up to ~p for normalization and alignment
    if (n <= 0) return 1n;
    if (this.#pow10Cache.has(n)) return this.#pow10Cache.get(n);
    let r = 1n;
    for (let i = 0; i < n; i++) r *= 10n;
    this.#pow10Cache.set(n, r);
    return r;
  }

  #normalize() {
    if (this.sig === 0n) { this.e = 0; return; }
    let s = this.sig;
    const p = this.p;
    const d = s.toString().length; // digit count
    const shift = d - p;

    if (shift > 0) {
      // Too many digits: round to p digits
      const base = this.#pow10(shift);
      let q = s / base;
      const r = s % base;
      if (r * 2n >= base) q += 1n; // round half up
      s = q;
      this.e += shift;
      // Handle carry overflow (e.g., 9.99.. rounds to 10.0)
      if (s.toString().length > p) {
        s = s / 10n;
        this.e += 1;
      }
    } else if (shift < 0) {
      // Too few digits: scale up
      const k = -shift;
      s = s * this.#pow10(k);
      this.e -= k;
    }

    this.sig = s;
  }

  // Align other to this exponent by shifting right its significand (with rounding).
  // Returns BigInt suitable to add to this.sig; does not mutate inputs.
  #alignSig(other) {
    const diff = Math.abs(this.e - other.e);
    if (diff === 0) return other.sig;
    // If exponents differ a lot, the smaller one contributes nothing within precision
    if (diff > this.p + 2) return 0n;
    const base = this.#pow10(diff);
    // Shift right with rounding half up
    let q = other.sig / base;
    const r = other.sig % base;
    if (r * 2n >= base) q += 1n;
    return q;
  }

  add(b) {
    if (!(b instanceof BigNum)) b = BigNum.fromInt(b, this.p);
    if (this.isZero()) return b.clone();
    if (b.isZero()) return this.clone();

    // Use the bigger exponent as the target exponent
    if (this.e >= b.e) {
      const out = new BigNum(this.sig + this.#alignSig(b), this.e, this.p);
      return out; // ctor normalizes
    } else {
      const out = new BigNum(b.sig + b.#alignSig(this), b.e, this.p);
      return out;
    }
  }

  iadd(b) { const r = this.add(b); this.sig = r.sig; this.e = r.e; return this; }

  mulSmall(k) {
    if (k < 0) throw new Error('BigNum only supports non-negative values');
    if (k === 0) return BigNum.zero(this.p);
    if (k === 1) return this.clone();
    const out = new BigNum(this.sig * BigInt(k), this.e, this.p);
    return out; // normalized by ctor
  }

  imulSmall(k) { const r = this.mulSmall(k); this.sig = r.sig; this.e = r.e; return this; }

  cmp(b) {
    if (!(b instanceof BigNum)) b = BigNum.fromInt(b, this.p);
    if (this.isZero() && b.isZero()) return 0;
    if (this.e !== b.e) return this.e > b.e ? 1 : -1;
    if (this.sig === b.sig) return 0;
    return this.sig > b.sig ? 1 : -1;
  }

  // --- Formatting helpers ---------------------------------------------------

  // Decimal exponent E = e + (p - 1)
  get decExp() { return this.e + (this.p - 1); }

  toScientific(digits = 3) {
    if (this.isZero()) return '0';
    const s = this.sig.toString().padStart(this.p, '0');
    const head = s[0];
    const tail = s.slice(1, 1 + digits).replace(/0+$/g, '');
    const mant = tail ? `${head}.${tail}` : head;
    const E = this.e + (this.p - 1);
    // Return without the '+' sign (format like 1e305, not 1e+305)
    return `${mant}e${E}`;
  }

  // Exact integer string for smaller magnitudes (we treat currencies as integers)
  toPlainIntegerString() {
    if (this.isZero()) return '0';
    const s = this.sig.toString().padStart(this.p, '0');
    // Integer digits = floor(log10(sig*10^e)) + 1 = e + p
    const intDigits = this.e + this.p;
    if (intDigits <= 0) return '0';
    if (intDigits <= this.p) return s.slice(0, intDigits).replace(/^0+/, '') || '0';
    return (s + '0'.repeat(intDigits - this.p)).replace(/^0+/, '') || '0';
  }
}
