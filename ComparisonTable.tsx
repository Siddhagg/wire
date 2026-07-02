"use client";

import * as React from "react";
import { ChevronDown, Trophy, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import type { BrandComparison, VariantCost, CartItem } from "@/lib/types";
import { formatINR, formatNumber, formatPct } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Human-readable discount label, e.g. "41% + 3% = 44% off". */
export function discountLabel(v: VariantCost): string {
  const base = formatPct(v.baseDiscountPct);
  const eff = formatPct(v.effectiveDiscountPct);
  if (v.adjustmentPct === 0) return `${base} off`;
  const sign = v.adjustmentPct > 0 ? "+" : "−";
  const adj = formatPct(Math.abs(v.adjustmentPct));
  return `${base} ${sign} ${adj} = ${eff} off`;
}

/** MRP-equivalent cost for the requested metres (for the struck-through price). */
function mrpCost(v: VariantCost, metres: number): number {
  return (v.mrp / v.length) * metres;
}

interface ComparisonTableProps {
  comparisons: BrandComparison[];
  cart: CartItem[];
  bestIdx: number;
  gstMode: 0 | 18;
  expanded: Set<string>;
  onToggle: (brand: string) => void;
}

export function ComparisonTable({
  comparisons,
  cart,
  bestIdx,
  gstMode,
  expanded,
  onToggle,
}: ComparisonTableProps) {
  const sortedCart = [...cart].sort((a, b) => a.size - b.size);

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-navy-800 text-left text-primary-foreground">
            <th className="sticky left-0 z-10 bg-navy-800 px-3 py-2.5 font-semibold">
              Brand
            </th>
            {sortedCart.map((item) => (
              <th
                key={item.size}
                className="whitespace-nowrap px-3 py-2.5 text-right font-semibold"
              >
                {item.size} sq mm
                <div className="text-[11px] font-normal text-primary-foreground/70">
                  {formatNumber(item.qty * 90)} m
                </div>
              </th>
            ))}
            <th className="whitespace-nowrap px-3 py-2.5 text-right font-semibold">
              Grand Total
              {gstMode === 18 && (
                <div className="text-[11px] font-normal text-primary-foreground/70">
                  incl. 18% GST
                </div>
              )}
            </th>
          </tr>
        </thead>
        <tbody>
          {comparisons.map((c, idx) => {
            const isBest = idx === bestIdx;
            const isOpen = expanded.has(c.brand);
            return (
              <React.Fragment key={c.brand}>
                <tr
                  className={cn(
                    "border-t transition-colors",
                    isBest ? "bg-emerald-50" : idx % 2 ? "bg-muted/30" : "bg-card"
                  )}
                >
                  {/* Brand cell */}
                  <td
                    className={cn(
                      "sticky left-0 z-10 px-3 py-2.5 align-top",
                      isBest
                        ? "bg-emerald-50"
                        : idx % 2
                        ? "bg-muted/30"
                        : "bg-card"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => onToggle(c.brand)}
                        className="no-print grid h-5 w-5 place-items-center rounded hover:bg-secondary"
                        aria-label={`Toggle ${c.brand} length breakdown`}
                      >
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            isOpen && "rotate-180"
                          )}
                        />
                      </button>
                      <span className="font-semibold text-navy-800">
                        {c.brand}
                      </span>
                      {isBest && (
                        <Badge variant="success" className="gap-1">
                          <Trophy className="h-3 w-3" /> Best Value
                        </Badge>
                      )}
                    </div>
                    {c.incomplete && (
                      <div className="mt-1 text-[11px] text-amber-700">
                        Missing some sizes
                      </div>
                    )}
                  </td>

                  {/* Per-size cells */}
                  {sortedCart.map((item) => {
                    const sc = c.sizes.find((s) => s.size === item.size);
                    const chosen = sc?.chosen ?? null;
                    if (!chosen || !sc) {
                      return (
                        <td
                          key={item.size}
                          className="px-3 py-2.5 text-right align-top text-muted-foreground"
                        >
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={item.size}
                        className="px-3 py-2.5 text-right align-top"
                      >
                        <div className="font-semibold text-navy-800">
                          {formatINR(chosen.cost)}
                        </div>
                        <div className="text-[11px] text-muted-foreground line-through">
                          {formatINR(mrpCost(chosen, sc.metres))}
                        </div>
                        <div className="text-[11px] font-medium text-emerald-700">
                          {discountLabel(chosen)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          via {chosen.length} m
                          {sc.userPinned ? " (pinned)" : ""}
                        </div>
                      </td>
                    );
                  })}

                  {/* Grand total cell */}
                  <td
                    className={cn(
                      "px-3 py-2.5 text-right align-top",
                      isBest && "font-semibold"
                    )}
                  >
                    {gstMode === 18 ? (
                      <div className="space-y-0.5">
                        <div className="text-[11px] text-muted-foreground">
                          Subtotal {formatINR(c.gst.subtotal)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          CGST 9% {formatINR(c.gst.cgst)}
                        </div>
                        <div className="text-[11px] text-muted-foreground">
                          SGST 9% {formatINR(c.gst.sgst)}
                        </div>
                        <div
                          className={cn(
                            "text-base font-bold",
                            isBest ? "text-emerald-700" : "text-navy-800"
                          )}
                        >
                          {formatINR(c.gst.total)}
                        </div>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "text-base font-bold",
                          isBest ? "text-emerald-700" : "text-navy-800"
                        )}
                      >
                        {formatINR(c.gst.total)}
                      </div>
                    )}
                  </td>
                </tr>

                {/* Expandable all-length-variants detail (screen only) */}
                {isOpen && (
                  <tr className="no-print border-t bg-navy-50/40">
                    <td colSpan={sortedCart.length + 2} className="px-3 py-3">
                      <BrandLengthDetail brand={c.brand} comparison={c} cart={sortedCart} />
                    </td>
                  </tr>
                )}
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** The per-brand expandable panel: pick a length + see every variant side by side. */
function BrandLengthDetail({
  brand,
  comparison,
  cart,
}: {
  brand: string;
  comparison: BrandComparison;
  cart: CartItem[];
}) {
  const lengthsByBrand = useAppStore((s) => s.lengthsByBrand);
  const lengthPref = useAppStore((s) => s.lengthPref);
  const setLengthPref = useAppStore((s) => s.setLengthPref);

  const lengths = lengthsByBrand[brand] ?? [];
  const pref = lengthPref[brand] ?? "cheapest";

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-navy-800">
          <Pin className="mr-1 inline h-3 w-3" />
          Pack length for {brand}:
        </span>
        <button
          type="button"
          onClick={() => setLengthPref(brand, "cheapest")}
          className={cn(
            "rounded border px-2.5 py-1 text-xs font-medium transition-colors",
            pref === "cheapest"
              ? "border-accent bg-accent/15"
              : "border-input hover:bg-secondary"
          )}
        >
          Cheapest / m (auto)
        </button>
        {lengths.map((len) => (
          <button
            key={len}
            type="button"
            onClick={() => setLengthPref(brand, len)}
            className={cn(
              "rounded border px-2.5 py-1 text-xs font-medium transition-colors",
              pref === len
                ? "border-accent bg-accent/15"
                : "border-input hover:bg-secondary"
            )}
          >
            {len} m coil
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="text-left text-muted-foreground">
              <th className="px-2 py-1 font-medium">Size</th>
              {lengths.map((len) => (
                <th key={len} className="px-2 py-1 text-right font-medium">
                  {len} m
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cart.map((item) => {
              const sc = comparison.sizes.find((s) => s.size === item.size);
              return (
                <tr key={item.size} className="border-t">
                  <td className="px-2 py-1 font-medium text-navy-800">
                    {item.size} sq mm
                  </td>
                  {lengths.map((len) => {
                    const v = sc?.variants.find((x) => x.length === len);
                    const isChosen = sc?.chosen?.length === len;
                    if (!v) {
                      return (
                        <td key={len} className="px-2 py-1 text-right text-muted-foreground">
                          —
                        </td>
                      );
                    }
                    return (
                      <td
                        key={len}
                        className={cn(
                          "px-2 py-1 text-right",
                          isChosen && "rounded bg-emerald-100 font-semibold text-emerald-800"
                        )}
                      >
                        <div>{formatINR(v.cost)}</div>
                        <div className="text-[10px] text-muted-foreground">
                          {formatINR(v.perMeter)}/m
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
