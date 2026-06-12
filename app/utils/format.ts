/** Formatting helpers for the admin dashboard. */

export function formatCents(
  cents: number | null | undefined,
  currency = "USD",
): string {
  const value = (cents ?? 0) / 100;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  // A date-only string ("2025-01-15") is parsed as UTC midnight by the Date
  // constructor, which can shift to the previous day in negative-offset zones.
  // Anchor it to local midnight so the displayed calendar day is correct.
  const date =
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d)
      ? new Date(`${d}T00:00:00`)
      : new Date(d);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ");
}
