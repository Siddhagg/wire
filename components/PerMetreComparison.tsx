"use client";

import * as React from "react";
import { useAppStore } from "@/lib/store";
import { SIZES } from "@/lib/constants";
import { clamp } from "@/lib/calc";
import { formatINR, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

/**
 * Cart-independent comparison of each brand's DISCOUNTED price per metre,
 * broken out separately for every coil length the brand stocks. Reflects the
 * live per-brand discount adjustment. This is the pure brand-vs-brand rate view.
 */
export function PerMetreComparison() {
  const rows = useAppStore((s) => s.rows);
  const brands = useAppStore((s) => s.brands);
  const lengthsByBrand = useAppStore((s) => s.lengthsByBrand);
  const brandAdjust = useAppStore((s) => s.brandAdjust);

  // Column layout: for each brand, one sub-column per stocked length.
  const columns = React.useMemo(
    () =>
      brands.flatMap((brand) =>
        (lengthsByBrand[brand] ?? []).map((length) => ({ brand, length }))
      ),
    [brands, lengthsByBrand]
  );

  // perMetre[size][brand][length] discounted ₹/m using the live adjustment.
  function perMetre(brand: string, size: number, length: number): number | null {
    const r = rows.find(
      (x) => x.brand === brand && x.size === size && x.length === length
    );
    if (!r) return null;
    const eff = clamp(r.baseDiscountPct + (brandAdjust[brand] ?? 0), 0, 100);
    return (r.mrp * (1 - eff / 100)) / length;
  }

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-navy-800 text-primary-foreground">
            <th
              rowSpan={2}
              className="sticky left-0 z-10 bg-navy-800 px-3 py-2 text-left font-semibold"
            >
              Size
            </th>
            {brands.map((brand) => {
              const span = (lengthsByBrand[brand] ?? []).length || 1;
              const adj = brandAdjust[brand] ?? 0;
              return (
                <th
                  key={brand}
                  colSpan={span}
                  className="border-l border-white/15 px-3 py-2 text-center font-semibold"
                >
                  {brand}
                  {adj !== 0 && (
                    <span className="ml-1 text-[10px] font-normal text-amber-200">
                      ({adj > 0 ? "+" : ""}
                      {formatPct(adj)})
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
          <tr className="bg-navy-700 text-primary-foreground">
            {columns.map((c, i) => {
              const firstOfBrand =
                i === 0 || columns[i - 1].brand !== c.brand;
              return (
                <th
                  key={`${c.brand}-${c.length}`}
                  className={cn(
                    "px-3 py-1.5 text-right font-medium",
                    firstOfBrand && "border-l border-white/15"
                  )}
                >
                  {c.length} m
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {SIZES.map((size, ri) => {
            // Find the cheapest ₹/m across all brand+length for this size.
            let min = Infinity;
            columns.forEach((c) => {
              const pm = perMetre(c.brand, size, c.length);
              if (pm !== null && pm < min) min = pm;
            });
            return (
              <tr
                key={size}
                className={cn("border-t", ri % 2 ? "bg-muted/30" : "bg-card")}
              >
                <td
                  className={cn(
                    "sticky left-0 z-10 px-3 py-2 font-semibold text-navy-800",
                    ri % 2 ? "bg-muted/30" : "bg-card"
                  )}
                >
                  {size} sq mm
                </td>
                {columns.map((c, i) => {
                  const pm = perMetre(c.brand, size, c.length);
                  const firstOfBrand =
                    i === 0 || columns[i - 1].brand !== c.brand;
                  const isMin = pm !== null && Math.abs(pm - min) < 1e-6;
                  return (
                    <td
                      key={`${c.brand}-${c.length}`}
                      className={cn(
                        "px-3 py-2 text-right tabular-nums",
                        firstOfBrand && "border-l",
                        isMin
                          ? "bg-emerald-100 font-semibold text-emerald-800"
                          : "text-navy-800"
                      )}
                    >
                      {pm === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        `${formatINR(pm)}/m`
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
