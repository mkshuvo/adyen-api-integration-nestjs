// Basic IBAN validation (mod-97) per ISO 13616
export function isValidIban(ibanRaw: string): boolean {
  if (!ibanRaw) return false;
  const iban = ibanRaw.replace(/\s+/g, '').toUpperCase();
  if (!/^[A-Z0-9]+$/.test(iban)) return false;
  if (iban.length < 15 || iban.length > 34) return false;
  // Move first 4 chars to end
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  // Replace letters with numbers (A=10 .. Z=35)
  const expanded = rearranged
    .split('')
    .map((ch) => (ch >= 'A' && ch <= 'Z' ? (ch.charCodeAt(0) - 55).toString() : ch))
    .join('');
  // Compute mod 97 iteratively to avoid big integers
  let remainder = 0;
  for (let i = 0; i < expanded.length; i++) {
    const digit = expanded.charCodeAt(i) - 48; // '0' => 0
    if (digit < 0 || digit > 9) {
      // it's part of a multi-digit number from A..Z mapping; handle generically
      const code = expanded[i];
      remainder = mod97Concat(remainder, code);
    } else {
      remainder = (remainder * 10 + digit) % 97;
    }
  }
  return remainder === 1;
}

function mod97Concat(prev: number, s: string): number {
  let r = prev;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i) - 48;
    r = (r * 10 + c) % 97;
  }
  return r;
}
