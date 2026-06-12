/**
 * Currency conversion (WebForgePlan2 §7 — Option A: display USD, charge ZAR).
 *
 * Prices and the wallet are denominated in **USD**. A South African Paystack
 * account can only charge **ZAR**, so at checkout we convert USD→ZAR using a
 * single configurable rate and charge that. This helper is the one source of
 * truth for that conversion.
 *
 * The rate comes from `USD_TO_ZAR` in the environment (a fixed manual rate to
 * start — simple and predictable). Price it slightly above spot to absorb FX
 * drift, since we collect a fixed ZAR amount but carry a USD-denominated wallet
 * liability.
 */

/** Fallback used if USD_TO_ZAR is unset/invalid (kept conservative-high). */
const DEFAULT_USD_TO_ZAR = 17;

/**
 * Sane bounds for the manual USD→ZAR rate. A value outside this band is almost
 * certainly a misconfiguration (e.g. a stray decimal) that would badly over- or
 * under-charge customers, so we reject it and fall back to the default.
 */
const MIN_USD_TO_ZAR = 10;
const MAX_USD_TO_ZAR = 30;

/** The configured USD→ZAR rate. */
export function getUsdToZarRate(): number {
  const raw = process.env.USD_TO_ZAR;
  const parsed = raw ? Number(raw) : NaN;
  if (
    !Number.isFinite(parsed) ||
    parsed < MIN_USD_TO_ZAR ||
    parsed > MAX_USD_TO_ZAR
  ) {
    return DEFAULT_USD_TO_ZAR;
  }
  return parsed;
}

/**
 * Convert USD cents → ZAR cents at the configured rate.
 * Rounds UP to the nearest whole Rand so we never under-collect, then returns
 * cents (always a multiple of 100).
 */
export function usdCentsToZarCents(usdCents: number): number {
  const rate = getUsdToZarRate();
  const zar = (usdCents / 100) * rate; // ZAR major units
  const zarRoundedUp = Math.ceil(zar); // whole Rands
  return zarRoundedUp * 100; // ZAR cents
}

/** Format USD cents as "$1,234.56" (or "$249" when whole). */
export function formatUsd(cents: number): string {
  const major = cents / 100;
  const whole = Number.isInteger(major);
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(major);
}

/** Format ZAR cents as "R1,234". */
export function formatZar(cents: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100);
}
