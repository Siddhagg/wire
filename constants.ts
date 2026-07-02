// The only hardcoded product-line values in the app: the six wire sizes.
// Brands, wire types and lengths are ALWAYS auto-detected from the uploaded
// rate list — never hardcoded — per the build brief §2.

export const SIZES: number[] = [0.75, 1, 1.5, 2.5, 4, 6];

/** One 90m-equivalent unit = 90 metres of wire. */
export const METRES_PER_UNIT = 90;

export const BUSINESS_NAME = "Agarwal Enterprises";
export const TOOL_NAME = "Wire Bundle Estimator";

/** Live per-brand discount adjustment bounds (whole percent). */
export const ADJUST_MIN = -20;
export const ADJUST_MAX = 20;
