/**
 * Finnish business ID (Y-tunnus) normalisation and check-digit validation.
 * Mirrors the backend's src/lib/businessId.ts so the buyer sees the error
 * before submitting; the backend validates again.
 *
 * Check digit rule (VNa 288/2001 § 3): weight the seven body digits by
 * 7, 9, 10, 5, 8, 4, 2; remainder = sum mod 11. Remainder 0 → check digit 0,
 * remainder 1 → no valid ID exists, otherwise check digit = 11 - remainder.
 */

const WEIGHTS = [7, 9, 10, 5, 8, 4, 2];

/**
 * Returns the ID in canonical `1234567-8` form, or null when it is not a valid
 * Y-tunnus. Accepts a missing hyphen, surrounding spaces, the older 6-digit
 * body (zero-padded) and the VAT form `FI12345678`.
 */
export function normalizeBusinessId(input: string): string | null {
  const compact = input.replace(/\s/g, "").toUpperCase().replace(/^FI/, "");
  const match = /^(\d{6,7})-?(\d)$/.exec(compact);
  if (!match) return null;

  const body = match[1].padStart(7, "0");
  const checkDigit = Number(match[2]);

  const sum = body
    .split("")
    .reduce((acc, digit, i) => acc + Number(digit) * WEIGHTS[i], 0);
  const remainder = sum % 11;
  if (remainder === 1) return null;

  const expected = remainder === 0 ? 0 : 11 - remainder;
  return expected === checkDigit ? `${body}-${checkDigit}` : null;
}
