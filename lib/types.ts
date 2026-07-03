// Core domain types for the Wire Bundle Costing tool.

/** A single parsed row from the uploaded rate-list Excel. */
export interface RateRow {
  brand: string;
  wireType: string;
  /** One of the fixed product-line sizes: 0.75, 1, 1.5, 2.5, 4, 6 (sq mm). */
  size: number;
  /** Coil/bundle length in metres as printed (varies by brand). */
  length: number;
  /** Printed / list price for this exact Brand+WireType+Size+Length. */
  mrp: number;
  /** Base negotiated discount as a whole percent (e.g. 41 means 41% off). */
  baseDiscountPct: number;
  /** Net rate from the file = MRP × (1 − Discount). Kept for reference only. */
  netRate: number;
  /** Real landing cost — internal margin visibility only, never in exports. */
  actualCost?: number;
}

/** Result of parsing + validating an uploaded rate list. */
export interface ParseResult {
  rows: RateRow[];
  brands: string[];
  /** brand -> sorted list of wire types available for that brand. */
  wireTypesByBrand: Record<string, string[]>;
  /** brand -> sorted list of lengths available for that brand. */
  lengthsByBrand: Record<string, number[]>;
  warnings: string[];
  errors: string[];
}

/** A line in the estimator cart. Quantity is in 90m-equivalent units. */
export interface CartItem {
  size: number;
  qty: number;
}

export type GstMode = 0 | 18;

/** Resolved pricing for one brand+size at one length variant. */
export interface VariantCost {
  length: number;
  mrp: number;
  /** Effective discount after the live brand adjustment, whole percent. */
  effectiveDiscountPct: number;
  baseDiscountPct: number;
  adjustmentPct: number;
  /** Net rate per coil after the effective discount. */
  netRatePerCoil: number;
  perMeter: number;
  /** Total cost for the requested metres of this size. */
  cost: number;
}

/** The chosen (headline) variant for a brand+size plus all its alternatives. */
export interface BrandSizeCost {
  size: number;
  qty: number;
  metres: number;
  wireType: string;
  chosen: VariantCost | null;
  variants: VariantCost[];
  /** True when the chosen variant was picked by the user (not "cheapest"). */
  userPinned: boolean;
}

/** GST breakdown for a subtotal. */
export interface GstBreakdown {
  subtotal: number;
  cgst: number;
  sgst: number;
  gstTotal: number;
  total: number;
  mode: GstMode;
}

/** Everything needed to render one brand row of the comparison table. */
export interface BrandComparison {
  brand: string;
  sizes: BrandSizeCost[];
  subtotal: number;
  gst: GstBreakdown;
  /** True when this brand has no rates for any cart size. */
  incomplete: boolean;
}
