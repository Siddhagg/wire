import type {
  RateRow,
  CartItem,
  GstMode,
  VariantCost,
  BrandSizeCost,
  BrandComparison,
  GstBreakdown,
} from "./types";
import { METRES_PER_UNIT } from "./constants";

// ---------------------------------------------------------------------------
// Core calculation logic (build brief §3, §7)
//
//   per_meter_rate(variant) = netRate(variant) / length
//   cost_for_metres         = per_meter_rate × (qty_90m_units × 90)
//
// Discount shown = Excel base discount + live brand adjustment, applied
// ADDITIVELY on the MRP (not compounded on the already-discounted rate):
//
//   effectiveDiscount% = clamp(baseDiscount% + adjustment%, 0, 100)
//   netRate            = MRP × (1 − effectiveDiscount% / 100)
// ---------------------------------------------------------------------------

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

/** Metres required for a quantity given in 90m-equivalent units. */
export function metresForQty(qty90Units: number): number {
  return qty90Units * METRES_PER_UNIT;
}

/** Build the priced variant for a single rate row at a given metre demand. */
function priceVariant(
  row: RateRow,
  adjustmentPct: number,
  metres: number
): VariantCost {
  const effectiveDiscountPct = clamp(row.baseDiscountPct + adjustmentPct, 0, 100);
  const netRatePerCoil = row.mrp * (1 - effectiveDiscountPct / 100);
  const perMeter = netRatePerCoil / row.length;
  return {
    length: row.length,
    mrp: row.mrp,
    effectiveDiscountPct,
    baseDiscountPct: row.baseDiscountPct,
    adjustmentPct,
    netRatePerCoil,
    perMeter,
    cost: perMeter * metres,
  };
}

/**
 * Resolve the cost for one brand + size.
 *
 * @param rows            all rate rows
 * @param brand           brand name
 * @param size            wire size (sq mm)
 * @param wireType        selected wire type for this brand+size
 * @param qty             quantity in 90m-equivalent units
 * @param adjustmentPct   live brand discount adjustment (whole percent)
 * @param preferredLength user-pinned length, or "cheapest" for auto-select
 */
export function costForBrandSize(
  rows: RateRow[],
  brand: string,
  size: number,
  wireType: string,
  qty: number,
  adjustmentPct: number,
  preferredLength: number | "cheapest"
): BrandSizeCost {
  const metres = metresForQty(qty);

  const matching = rows.filter(
    (r) => r.brand === brand && r.size === size && r.wireType === wireType
  );

  const variants = matching
    .map((r) => priceVariant(r, adjustmentPct, metres))
    .sort((a, b) => a.perMeter - b.perMeter);

  let chosen: VariantCost | null = null;
  let userPinned = false;

  if (variants.length > 0) {
    if (preferredLength !== "cheapest") {
      const pinned = variants.find((v) => v.length === preferredLength);
      if (pinned) {
        chosen = pinned;
        userPinned = true;
      }
    }
    // Default (or fallback when the pinned length isn't stocked for this size):
    // the cheapest per-metre variant.
    if (!chosen) chosen = variants[0];
  }

  return { size, qty, metres, wireType, chosen, variants, userPinned };
}

/** Apply GST to a pre-tax subtotal, splitting 18% into CGST 9% + SGST 9%. */
export function applyGst(subtotal: number, mode: GstMode): GstBreakdown {
  if (mode === 18) {
    const half = subtotal * 0.09;
    return {
      subtotal,
      cgst: half,
      sgst: half,
      gstTotal: half * 2,
      total: subtotal + half * 2,
      mode,
    };
  }
  return { subtotal, cgst: 0, sgst: 0, gstTotal: 0, total: subtotal, mode };
}

export interface ComparisonInput {
  rows: RateRow[];
  brands: string[];
  cart: CartItem[];
  /** brand -> live discount adjustment (whole percent). */
  brandAdjust: Record<string, number>;
  /** brand -> size -> chosen wire type (defaults handled by resolver). */
  wireType: Record<string, Record<number, string>>;
  /** brand -> pinned length, or "cheapest". */
  lengthPref: Record<string, number | "cheapest">;
  gstMode: GstMode;
  wireTypesByBrand: Record<string, string[]>;
}

/** Default wire type for a brand+size: the currently-selected one, else the
 *  brand's first available wire type (usually "Standard"). */
export function resolveWireType(
  input: Pick<ComparisonInput, "wireType" | "wireTypesByBrand">,
  brand: string,
  size: number
): string {
  const selected = input.wireType[brand]?.[size];
  if (selected) return selected;
  const available = input.wireTypesByBrand[brand];
  return available && available.length > 0 ? available[0] : "Standard";
}

/** Build the full comparison — one entry per brand — for the current cart. */
export function buildComparison(input: ComparisonInput): BrandComparison[] {
  const { rows, brands, cart, brandAdjust, lengthPref, gstMode } = input;

  return brands.map((brand) => {
    const adjust = brandAdjust[brand] ?? 0;
    const pref = lengthPref[brand] ?? "cheapest";

    const sizes: BrandSizeCost[] = cart.map((item) => {
      const wireType = resolveWireType(input, brand, item.size);
      return costForBrandSize(
        rows,
        brand,
        item.size,
        wireType,
        item.qty,
        adjust,
        pref
      );
    });

    const subtotal = sizes.reduce(
      (sum, s) => sum + (s.chosen ? s.chosen.cost : 0),
      0
    );
    const incomplete = sizes.some((s) => s.chosen === null);

    return {
      brand,
      sizes,
      subtotal,
      gst: applyGst(subtotal, gstMode),
      incomplete,
    };
  });
}

/** Index of the cheapest complete brand (for the "Best Value" badge), or -1. */
export function bestValueIndex(comparisons: BrandComparison[]): number {
  let best = -1;
  let bestTotal = Infinity;
  comparisons.forEach((c, i) => {
    if (c.incomplete || c.sizes.length === 0) return;
    if (c.gst.total < bestTotal) {
      bestTotal = c.gst.total;
      best = i;
    }
  });
  return best;
}
