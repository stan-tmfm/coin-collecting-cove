// js/util/numFormat.js
// Policy:
//  - < 1e6: plain with commas
//  - 1e6 .. < 1e303: suffixes from the legacy list below
//  - >= 1e303: strict scientific (e.g., 1.234e+305)

import { BigNum } from './bigNum.js';

// Suffixes copied from old CCC formatting (descending exponents).
const SUFFIX_ENTRIES = [
  [300,'NoNg'],[297,'OcNg'],[294,'SpNg'],[291,'SxNg'],[288,'QnNg'],[285,'QdNg'],[282,'TNg'],[279,'DNg'],[276,'UNg'],[273,'Ng'],
  [270,'NoOg'],[267,'OcOg'],[264,'SpOg'],[261,'SxOg'],[258,'QnOg'],[255,'QdOg'],[252,'TOg'],[249,'DOg'],[246,'UOg'],[243,'Og'],
  [240,'NoSg'],[237,'OcSg'],[234,'SpSg'],[231,'SxSg'],[228,'QnSg'],[225,'QdSg'],[222,'TSg'],[219,'DSg'],[216,'USg'],[213,'Sg'],
  [210,'Nosg'],[207,'Ocsg'],[204,'Spsg'],[201,'Sxsg'],[198,'Qnsg'],[195,'Qdsg'],[192,'Tsg'],[189,'Dsg'],[186,'Usg'],[183,'sg'],
  [180,'NoQg'],[177,'OcQg'],[174,'SpQg'],[171,'SxQg'],[168,'QnQg'],[165,'QdQg'],[162,'TQg'],[159,'DQg'],[156,'UQg'],[153,'Qg'],
  [150,'Noqg'],[147,'Ocqg'],[144,'Spqg'],[141,'Sxqg'],[138,'Qnqg'],[135,'Qdqg'],[132,'Tqg'],[129,'Dqg'],[126,'Uqg'],[123,'qg'],
  [120,'NoTg'],[117,'OcTg'],[114,'SpTg'],[111,'SxTg'],[108,'QnTg'],[105,'QdTg'],[102,'TTg'],[99,'DTg'],[96,'UTg'],[93,'Tg'],
  [90,'NoVt'],[87,'OcVt'],[84,'SpVt'],[81,'SxVt'],[78,'QnVt'],[75,'QdVt'],[72,'TVt'],[69,'DVt'],[66,'UVt'],[63,'Vt'],
  [60,'NoDe'],[57,'OcDe'],[54,'SpDe'],[51,'SxDe'],[48,'QnDe'],[45,'QdDe'],[42,'TDe'],[39,'DDe'],[36,'UDe'],[33,'De'],
  [30,'No'],[27,'Oc'],[24,'Sp'],[21,'Sx'],[18,'Qn'],[15,'Qd'],[12,'T'],[9,'B'],[6,'M']
];

const SUFFIX_BY_EXP = new Map(SUFFIX_ENTRIES);

function commaifyInt(s){
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

function addOneDigitString(str){
  // adds 1 to a base-10 string of digits, returns new string
  let carry = 1;
  const arr = str.split('');
  for (let i = arr.length - 1; i >= 0 && carry; i--) {
    let d = arr[i].charCodeAt(0) - 48 + carry;
    carry = d >= 10 ? 1 : 0;
    arr[i] = String.fromCharCode(48 + (d % 10));
  }
  if (carry) arr.unshift('1');
  return arr.join('');
}

export function formatCoin(bn){
  if (!(bn instanceof BigNum)) return String(bn);
  if (bn.isZero()) return '0';

  // Use DECIMAL exponent everywhere (E = e + (p - 1))
  const E = bn.e + (bn.p - 1); // if you added bn.decExp, you can do: const E = bn.decExp;

  // 1) Scientific for >= 1e303
  if (E >= 303) return bn.toScientific(3); // (your BigNum.toScientific already omits the '+')

  // 2) Plain commas for < 1e6
  if (E < 6) return commaifyInt(bn.toPlainIntegerString());

  // 3) Suffix formatting using the legacy table (last tier = 300 → "NoNg")
  const exp = Math.floor(E / 3) * 3;  // e.g., 300 for NoNg
  const suffix = SUFFIX_BY_EXP.get(exp);
  if (!suffix) return bn.toScientific(3); // safety fallback

  // Digits within the 10^exp..10^(exp+3) window
  const d = E - exp;              // 0..2
  const intDigits = d + 1;        // 1..3
  const decimals = (intDigits === 1) ? 3 : (intDigits === 2) ? 2 : 1; // legacy rule
  const totalDigits = intDigits + decimals;

  // Pull + round digits from the significand
  let s = bn.sig.toString().padStart(bn.p, '0');
  if (s.length < totalDigits + 1) s += '0'.repeat(totalDigits + 1 - s.length);

  let head = s.slice(0, totalDigits);
  const nextDigit = s.charCodeAt(totalDigits) || 48; // '0'
  if (nextDigit >= 53) { // round half up
    head = addOneDigitString(head);
  }

  let intStr, fracStr;
  if (head.length > totalDigits) {
    // carry overflow → one more integer digit; decimals become zeros
    intStr = head.slice(0, intDigits + 1);
    fracStr = '0'.repeat(decimals);
  } else {
    intStr = head.slice(0, intDigits);
    fracStr = head.slice(intDigits);
  }

  return `${intStr}${decimals ? '.' + fracStr : ''}${suffix}`;
}