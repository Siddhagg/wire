"use client";

import * as React from "react";
import Link from "next/link";
import { ArrowLeft, SlidersHorizontal, Info } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { QuoteDocument } from "@/components/QuoteDocument";
import { ExportBar } from "@/components/ExportBar";
import { UploadButton } from "@/components/UploadButton";
import { PerMetreComparison } from "@/components/PerMetreComparison";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { useAppStore, useHydrated } from "@/lib/store";
import { buildComparison, bestValueIndex } from "@/lib/calc";
import { cn } from "@/lib/utils";

export default function ComparisonPage() {
  const hydrated = useHydrated();

  const rows = useAppStore((s) => s.rows);
  const brands = useAppStore((s) => s.brands);
  const cart = useAppStore((s) => s.cart);
  const brandAdjust = useAppStore((s) => s.brandAdjust);
  const wireType = useAppStore((s) => s.wireType);
  const wireTypesByBrand = useAppStore((s) => s.wireTypesByBrand);
  const lengthPref = useAppStore((s) => s.lengthPref);
  const gstMode = useAppStore((s) => s.gstMode);

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [capturing, setCapturing] = React.useState(false);
  const nodeRef = React.useRef<HTMLDivElement>(null);

  const comparisons = React.useMemo(() => {
    if (!hydrated || rows.length === 0 || cart.length === 0) return [];
    return buildComparison({
      rows,
      brands,
      cart,
      brandAdjust,
      wireType,
      wireTypesByBrand,
      lengthPref,
      gstMode,
    });
  }, [
    hydrated,
    rows,
    brands,
    cart,
    brandAdjust,
    wireType,
    wireTypesByBrand,
    lengthPref,
    gstMode,
  ]);

  // Order rows cheapest-first so the "Best Value" brand sits on top.
  const ordered = React.useMemo(() => {
    const withIdx = comparisons.map((c) => c);
    return [...withIdx].sort((a, b) => {
      if (a.incomplete !== b.incomplete) return a.incomplete ? 1 : -1;
      return a.gst.total - b.gst.total;
    });
  }, [comparisons]);

  const bestIdx = bestValueIndex(ordered);

  function toggle(brand: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(brand)) next.delete(brand);
      else next.add(brand);
      return next;
    });
  }

  const noRates = hydrated && rows.length === 0;
  const emptyCart = hydrated && cart.length === 0;
  const showQuote = hydrated && !noRates && !emptyCart;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-6">
        <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy-800">Brand Comparison</h1>
            <p className="text-sm text-muted-foreground">
              Every brand priced for your full cart — cheapest coil length per
              brand, with live discounts and GST.
            </p>
          </div>
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft /> Back to Estimator
          </Link>
        </div>

        {!hydrated && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {/* Cart-independent per-metre rate comparison across all brands. */}
        {hydrated && !noRates && (
          <Card className="mb-6">
            <CardHeader className="border-b">
              <CardTitle className="text-navy-800">
                Discounted rate per metre — brand comparison
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Each brand&apos;s net ₹/metre after discount, shown separately
                for every coil length. Cheapest per size is highlighted. Reflects
                the live discount adjustments.
              </p>
            </CardHeader>
            <CardContent className="pt-4">
              <PerMetreComparison />
            </CardContent>
          </Card>
        )}

        {noRates && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-8 text-center">
            <Info className="h-8 w-8 text-amber-600" />
            <div className="text-sm font-semibold text-amber-900">
              No rate list loaded
            </div>
            <p className="max-w-md text-xs text-amber-800">
              Upload your rate-list Excel to compare brand pricing for your
              order.
            </p>
            <UploadButton />
          </div>
        )}

        {!noRates && emptyCart && (
          <div className="flex flex-col items-center gap-3 rounded-lg border bg-card p-8 text-center">
            <Info className="h-8 w-8 text-muted-foreground" />
            <div className="text-sm font-semibold text-navy-800">
              Your cart is empty
            </div>
            <p className="max-w-md text-xs text-muted-foreground">
              Add wire sizes and quantities in the Estimator, then come back to
              compare.
            </p>
            <Link href="/" className={cn(buttonVariants({ variant: "default" }))}>
              <ArrowLeft /> Go to Estimator
            </Link>
          </div>
        )}

        {showQuote && (
          <div className="space-y-4">
            <div className="no-print flex flex-wrap items-center justify-between gap-3">
              <ExportBar nodeRef={nodeRef} setCapturing={setCapturing} />
              <Link
                href="/discounts"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                <SlidersHorizontal /> Adjust discounts
              </Link>
            </div>

            <p className="no-print text-xs text-muted-foreground">
              Tip: click the arrow beside a brand to compare its coil lengths
              (e.g. 90 m vs 300 m) and pin a pack size.
            </p>

            <div className={cn(capturing && "capturing")}>
              <QuoteDocument
                ref={nodeRef}
                comparisons={ordered}
                cart={cart}
                bestIdx={bestIdx}
                gstMode={gstMode}
                expanded={expanded}
                onToggle={toggle}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
