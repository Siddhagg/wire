"use client";

import * as React from "react";
import Link from "next/link";
import { Lock, RotateCcw, ArrowLeft, Info } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";
import { BrandDiscountRow } from "@/components/BrandDiscountRow";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { UploadButton } from "@/components/UploadButton";
import { useAppStore, useHydrated } from "@/lib/store";
import { cn } from "@/lib/utils";

export default function DiscountsPage() {
  const hydrated = useHydrated();
  const brands = useAppStore((s) => s.brands);
  const resetAdjustments = useAppStore((s) => s.resetAdjustments);

  const hasBrands = hydrated && brands.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      <main className="container py-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy-800">
              Discount Control Panel
            </h1>
            <p className="text-sm text-muted-foreground">
              Fine-tune each brand&apos;s discount on top of the rate-list base.
              Changes apply to the comparison instantly.
            </p>
          </div>
          <Link href="/comparison" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft /> Back to Comparison
          </Link>
        </div>

        {/* Internal-only warning banner */}
        <div className="mb-4 flex items-center gap-2 rounded-lg border border-navy-300 bg-navy-800 px-4 py-2.5 text-sm text-primary-foreground">
          <Lock className="h-4 w-4 shrink-0 text-amber-300" />
          <span>
            <span className="font-semibold">Internal control.</span> These
            adjustments affect quoted prices — not for customer view.
          </span>
        </div>

        {!hydrated && (
          <div className="rounded-lg border bg-card p-8 text-center text-sm text-muted-foreground">
            Loading…
          </div>
        )}

        {hydrated && !hasBrands && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 p-8 text-center">
            <Info className="h-8 w-8 text-amber-600" />
            <div className="text-sm font-semibold text-amber-900">
              No brands to adjust yet
            </div>
            <p className="max-w-md text-xs text-amber-800">
              Upload a rate list and the brands from that file will appear here
              for discount tuning.
            </p>
            <UploadButton />
          </div>
        )}

        {hasBrands && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b">
              <CardTitle className="text-navy-800">
                Extra Discount Adjustment
                <span className="ml-2 text-xs font-normal text-muted-foreground">
                  −20% to +20% · additive on MRP
                </span>
              </CardTitle>
              <Button variant="outline" size="sm" onClick={resetAdjustments}>
                <RotateCcw className="h-3.5 w-3.5" /> Reset all to 0
              </Button>
            </CardHeader>
            <CardContent className="pt-0">
              {brands.map((brand) => (
                <BrandDiscountRow key={brand} brand={brand} />
              ))}
            </CardContent>
          </Card>
        )}

        <p className="mt-4 text-xs text-muted-foreground">
          Positive = extra discount beyond the base rate. Negative = claw back
          some of the base discount. The net discount ({" "}
          <span className="font-medium">base + adjustment</span>) is applied to
          MRP, not compounded on the already-discounted rate.
        </p>

        {/* TODO: Supabase persistence layer — Phase 2
            When a backend is added, brand discount adjustments (and the full
            rate list) would be written/read here instead of localStorage. */}
      </main>
    </div>
  );
}
