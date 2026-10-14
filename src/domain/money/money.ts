/**
 * Money is stored as integer minor units (pence, cents, poisha) with an ISO
 * currency code. All conversion between text and minor units is done with
 * string and integer arithmetic — never floating point.
 */
export const CURRENCY_CODES = ["USD", "GBP", "EUR", "BDT"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

/** All supported currencies use two decimal places. */
const DECIMALS = 2;
const MAX_MINOR = 999_999_999_999; // 9,999,999,999.99 — well inside Number's safe integer range

/**
 * Parses user input such as "1,234.56", "1234", "1234.5" into minor units.
 * Returns null for anything else (negative, more than 2 decimals, letters, too large).
 */
export function parseMoneyInput(input: string): number | null {
  const s = input.trim().replace(/,/g, "");
  const m = /^(\d{1,10})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const minor = Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(DECIMALS, "0") || "0");
  return Number.isSafeInteger(minor) && minor <= MAX_MINOR ? minor : null;
}

/** "GBP 1,234.56" — currency code first, unambiguous for international clients. */
export function formatMoney(minor: number, currency: string): string {
  if (!Number.isSafeInteger(minor)) throw new Error("Money amounts must be integer minor units");
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const major = Math.floor(abs / 100);
  const fraction = String(abs % 100).padStart(DECIMALS, "0");
  const grouped = String(major).replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `${sign}${currency} ${grouped}.${fraction}`;
}

/** Minor units → plain input value ("1234.50") for editing forms. */
export function minorToInput(minor: number | null | undefined): string {
  if (minor === null || minor === undefined) return "";
  return `${Math.floor(minor / 100)}.${String(minor % 100).padStart(DECIMALS, "0")}`;
}
