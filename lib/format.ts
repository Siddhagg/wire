// Formatting helpers — Indian Rupee display and percentages.

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

const inrPlain = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

/** Format a number as ₹ with Indian digit grouping. */
export function formatINR(value: number): string {
  if (!isFinite(value)) return "₹0";
  return inr.format(Math.round(value * 100) / 100);
}

/** Format a number with Indian grouping but no currency symbol. */
export function formatNumber(value: number): string {
  if (!isFinite(value)) return "0";
  return inrPlain.format(Math.round(value * 100) / 100);
}

/** Format a whole-percent value, trimming trailing zeros (e.g. 41, 42.5). */
export function formatPct(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded % 1 === 0 ? rounded.toFixed(0) : rounded.toString()}%`;
}

/** Today's date, human readable (e.g. "2 July 2026"). */
export function formatToday(date: Date = new Date()): string {
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
