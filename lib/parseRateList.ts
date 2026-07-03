import * as XLSX from "xlsx";
import type { ParseResult, RateRow } from "./types";
import { SIZES } from "./constants";

// ---------------------------------------------------------------------------
// SheetJS parsing + validation (build brief §2, §10 /lib/parseRateList.ts)
//
// The uploaded workbook groups rows into "90 METRE BUNDLES", "180 METRE
// BUNDLES" banner sections and repeats a brand-name-only row above each block.
// Those banner rows carry no Size/Length/MRP and are ignored automatically.
//
// Nothing about brands, wire types or lengths is hardcoded — they are all
// auto-detected from whatever data rows exist. Only the six Size values are a
// fixed product line, and even then unexpected sizes are surfaced as warnings
// rather than dropped.
// ---------------------------------------------------------------------------

/** Normalise a header cell for keyword matching. */
function norm(v: unknown): string {
  return String(v ?? "")
    .toLowerCase()
    .replace(/[^a-z]/g, "");
}

interface ColumnMap {
  brand: number;
  wireType: number;
  size: number;
  length: number;
  mrp: number;
  discount: number;
  netRate: number;
  actualCost: number;
}

/** Locate columns by header keywords so column order can change safely. */
function findColumns(header: unknown[]): ColumnMap | null {
  const map: ColumnMap = {
    brand: -1,
    wireType: -1,
    size: -1,
    length: -1,
    mrp: -1,
    discount: -1,
    netRate: -1,
    actualCost: -1,
  };

  header.forEach((cell, idx) => {
    const h = norm(cell);
    if (!h) return;
    if (map.brand === -1 && h.includes("brand")) map.brand = idx;
    else if (map.wireType === -1 && h.includes("wire") && h.includes("type"))
      map.wireType = idx;
    else if (map.size === -1 && h.includes("size")) map.size = idx;
    else if (map.length === -1 && h.includes("length")) map.length = idx;
    else if (map.mrp === -1 && h.includes("mrp")) map.mrp = idx;
    else if (map.discount === -1 && h.includes("discount")) map.discount = idx;
    else if (map.netRate === -1 && h.includes("net")) map.netRate = idx;
    else if (
      map.actualCost === -1 &&
      (h.includes("actual") || (h.includes("cost") && !h.includes("mrp")))
    )
      map.actualCost = idx;
  });

  // The essential columns must all be present.
  if (
    map.brand === -1 ||
    map.size === -1 ||
    map.length === -1 ||
    map.mrp === -1 ||
    map.discount === -1
  ) {
    return null;
  }
  return map;
}

/** Coerce a cell to a finite number, or null if it isn't numeric. */
function toNum(v: unknown): number | null {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[₹,\s%]/g, "");
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return isFinite(n) ? n : null;
}

/**
 * Normalise a discount value to a whole percent.
 *  - Excel files store it as a fraction (0.41 → 41).
 *  - A hand-typed file might store it as a whole number (41 → 41).
 * Values in (0, 1] are treated as fractions; anything larger is already a %.
 */
function normaliseDiscount(raw: number): number {
  if (raw > 0 && raw <= 1) return raw * 100;
  return raw;
}

export function parseWorkbook(data: ArrayBuffer): ParseResult {
  const warnings: string[] = [];
  const errors: string[] = [];
  const rows: RateRow[] = [];

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(data, { type: "array" });
  } catch (e) {
    return {
      rows: [],
      brands: [],
      wireTypesByBrand: {},
      lengthsByBrand: {},
      warnings: [],
      errors: ["Could not read the file. Is it a valid .xlsx workbook?"],
    };
  }

  // Prefer a sheet literally named like "Rate List"; else the first sheet that
  // actually contains the expected headers.
  const sheetNames = wb.SheetNames;
  let chosen: { name: string; grid: unknown[][]; cols: ColumnMap } | null = null;

  for (const name of sheetNames) {
    const grid = XLSX.utils.sheet_to_json<unknown[]>(wb.Sheets[name], {
      header: 1,
      defval: null,
      blankrows: false,
    });
    // Scan the first few rows for a header line.
    for (let r = 0; r < Math.min(grid.length, 8); r++) {
      const cols = findColumns(grid[r] ?? []);
      if (cols) {
        chosen = { name, grid: grid.slice(r + 1), cols };
        break;
      }
    }
    if (chosen && /rate\s*list/i.test(name)) break; // strong preference
    if (chosen) break;
  }

  if (!chosen) {
    return {
      rows: [],
      brands: [],
      wireTypesByBrand: {},
      lengthsByBrand: {},
      warnings: [],
      errors: [
        "Could not find the rate-list columns (Brand, Size, Length, MRP, Discount). Please use the provided rate-list template.",
      ],
    };
  }

  const { grid, cols } = chosen;
  const sizeSet = new Set(SIZES);
  let skippedBanners = 0;

  for (const raw of grid) {
    const brand = String(raw[cols.brand] ?? "").trim();
    const size = toNum(raw[cols.size]);
    const length = toNum(raw[cols.length]);
    const mrp = toNum(raw[cols.mrp]);
    const discountRaw = toNum(raw[cols.discount]);

    // Banner / section rows: a brand (or section title) with no numeric data.
    const isDataRow =
      brand !== "" &&
      size !== null &&
      length !== null &&
      length > 0 &&
      mrp !== null &&
      mrp > 0;

    if (!isDataRow) {
      if (brand !== "" || size !== null) skippedBanners++;
      continue;
    }

    const wireType =
      cols.wireType !== -1
        ? String(raw[cols.wireType] ?? "").trim() || "Standard"
        : "Standard";

    const baseDiscountPct =
      discountRaw !== null ? normaliseDiscount(discountRaw) : 0;

    if (discountRaw === null) {
      warnings.push(`Missing discount for ${brand} ${size}sqmm ${length}m — treated as 0%.`);
    }
    if (!sizeSet.has(size!)) {
      warnings.push(`Unexpected size ${size} for ${brand} (${length}m) — kept, but outside the standard 6 sizes.`);
    }

    const actualCost =
      cols.actualCost !== -1 ? toNum(raw[cols.actualCost]) ?? undefined : undefined;

    // Recompute net rate from MRP + normalised discount so it stays consistent
    // even if the file's Net Rate column is stale or blank.
    const netRate = mrp! * (1 - baseDiscountPct / 100);

    rows.push({
      brand,
      wireType,
      size: size!,
      length: length!,
      mrp: mrp!,
      baseDiscountPct,
      netRate,
      actualCost,
    });
  }

  if (rows.length === 0) {
    errors.push("No valid rate rows found in the file.");
  }
  if (skippedBanners > 0) {
    warnings.push(`Ignored ${skippedBanners} banner/section row(s).`);
  }

  // Auto-detect brands, wire types and lengths from the data.
  const brands: string[] = [];
  const wireTypesByBrand: Record<string, Set<string>> = {};
  const lengthsByBrand: Record<string, Set<number>> = {};

  for (const row of rows) {
    if (!brands.includes(row.brand)) brands.push(row.brand);
    (wireTypesByBrand[row.brand] ??= new Set()).add(row.wireType);
    (lengthsByBrand[row.brand] ??= new Set()).add(row.length);
  }

  return {
    rows,
    brands,
    wireTypesByBrand: Object.fromEntries(
      Object.entries(wireTypesByBrand).map(([b, s]) => [b, [...s].sort()])
    ),
    lengthsByBrand: Object.fromEntries(
      Object.entries(lengthsByBrand).map(([b, s]) => [b, [...s].sort((a, c) => a - c)])
    ),
    warnings,
    errors,
  };
}

/** Convenience wrapper used by the upload button (reads a File → ArrayBuffer). */
export async function parseRateListFile(file: File): Promise<ParseResult> {
  const buffer = await file.arrayBuffer();
  return parseWorkbook(buffer);
}
