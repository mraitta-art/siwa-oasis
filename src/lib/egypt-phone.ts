/**
 * Egypt phone handling — the single source of truth.
 *
 * Vendors here write their own number every way we can think of:
 *   +20 12 22597304 · +20 0122 2597304 · 01222597304 · 00201222597304 · 012-2259-7304
 * The number IS the vendor identity (one number = one account), so every written
 * form must collapse to one canonical digit string: "201222597304".
 *
 * Pure module — safe to import from client components and server code alike.
 */

/**
 * Collapse any realistic way a number is typed into canonical international
 * digits (no '+', wa.me-safe). Non-Egyptian numbers pass through untouched
 * once the international prefix ('00') is normalised.
 */
export function normalizePhoneValue(value: unknown): string {
  let digits = String(value ?? '').replace(/\D/g, '');
  if (!digits) return '';
  // International dialling prefix (Egypt's is 00): 00 20 12… → 20 12…
  if (digits.startsWith('00')) digits = digits.slice(2);
  // Local mobile 01X XXXX XXXX (11 digits) → 20 + the 10-digit subscriber part.
  if (digits.length === 11 && digits.startsWith('01')) digits = `2${digits}`;
  // Naked subscriber number, written without the leading 0 at all: 1X XXXX XXXX.
  // Egyptian mobile prefixes are 10/11/12/15 (010·011·012·015).
  if (digits.length === 10 && /^1[0125]/.test(digits)) digits = `20${digits}`;
  // +20 given but the trunk 0 kept inside it: 20 0 1X XXXX XXXX (13 digits).
  if (digits.length === 13 && digits.startsWith('2001')) digits = `20${digits.slice(3)}`;
  return digits;
}

/** True for an Egyptian MOBILE in canonical digits: 20 + 1[0125] + 8 digits. */
export function isEgyptMobile(digits: string): boolean {
  return /^201[0125]\d{8}$/.test(digits);
}

/** Human display: +20 122 259 7304. Anything else renders as +<digits>. */
export function formatPhoneDisplay(digits: string): string {
  if (!digits) return '';
  if (isEgyptMobile(digits)) {
    const local = digits.slice(2); // 10 digits: 1XX XXX XXXX
    return `+20 ${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return `+${digits}`;
}

/**
 * How this number may appear in OLD stored rows: canonical digits, local with
 * the trunk 0, or the bare subscriber part. Lookups match against all of them
 * so a vendor typed one way and an admin saved another still means one account.
 */
export function phoneLookupCandidates(digits: string): string[] {
  const out = [digits];
  if (digits.startsWith('20') && digits.length === 12) {
    out.push(`0${digits.slice(2)}`, digits.slice(2));
  }
  return Array.from(new Set(out.filter(Boolean)));
}

/** SQL expression that reduces a stored column to pure digits for comparison. */
export function digitsOnlySql(column: string): string {
  return (
    `REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(COALESCE(${column}, ''), '+', ''), ' ', ''), '-', ''), '(', ''), ')', '')`
  );
}
