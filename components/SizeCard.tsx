"use client";

import * as React from "react";
import { Minus, Plus, ShoppingCart, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useAppStore, useHydrated } from "@/lib/store";
import { METRES_PER_UNIT } from "@/lib/constants";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SizeCardProps {
  size: number;
}

export function SizeCard({ size }: SizeCardProps) {
  const hydrated = useHydrated();
  const rows = useAppStore((s) => s.rows);
  const cartItem = useAppStore((s) =>
    s.cart.find((c) => c.size === size)
  );
  const addToCart = useAppStore((s) => s.addToCart);
  const wireTypeSel = useAppStore((s) => s.wireType);
  const setWireType = useAppStore((s) => s.setWireType);

  const [qty, setQty] = React.useState<number>(1);
  const [dirty, setDirty] = React.useState(false);

  // Once hydrated, seed the stepper from the cart (only until the user edits).
  React.useEffect(() => {
    if (hydrated && cartItem && !dirty) setQty(cartItem.qty);
  }, [hydrated, cartItem, dirty]);

  const inCart = hydrated && !!cartItem;

  // Data-driven wire-type toggle: only brands that actually have more than one
  // wire type for THIS size get a toggle. With a Standard-only file, none show.
  const multiTypeBrands = React.useMemo(() => {
    const byBrand = new Map<string, Set<string>>();
    for (const r of rows) {
      if (r.size !== size) continue;
      (byBrand.get(r.brand) ?? byBrand.set(r.brand, new Set()).get(r.brand)!).add(
        r.wireType
      );
    }
    return [...byBrand.entries()]
      .filter(([, types]) => types.size > 1)
      .map(([brand, types]) => ({ brand, types: [...types].sort() }));
  }, [rows, size]);

  function step(delta: number) {
    setDirty(true);
    setQty((q) => Math.max(1, q + delta));
  }

  function onInput(e: React.ChangeEvent<HTMLInputElement>) {
    setDirty(true);
    const val = e.target.value;
    if (val === "") {
      setQty(1);
      return;
    }
    const n = parseInt(val, 10);
    if (!isNaN(n)) setQty(Math.max(1, n));
  }

  function commit() {
    addToCart(size, qty);
    setDirty(false);
  }

  const metres = qty * METRES_PER_UNIT;

  return (
    <Card className={cn(inCart && "ring-2 ring-accent/60")}>
      <CardContent className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="text-lg font-bold text-navy-800">
              {size} <span className="text-sm font-medium">sq mm</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatNumber(metres)} m &middot; {qty} × 90 m
            </div>
          </div>
          {inCart && (
            <Badge variant="accent" className="gap-1">
              <Check className="h-3 w-3" /> In cart: {cartItem!.qty}
            </Badge>
          )}
        </div>

        {/* Quantity stepper: − / editable input / + */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => step(-1)}
            aria-label={`Decrease ${size} sq mm quantity`}
          >
            <Minus />
          </Button>
          <Input
            type="number"
            min={1}
            inputMode="numeric"
            value={qty}
            onChange={onInput}
            className="h-9 text-center text-base font-semibold"
            aria-label={`${size} sq mm quantity in 90m units`}
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => step(1)}
            aria-label={`Increase ${size} sq mm quantity`}
          >
            <Plus />
          </Button>
        </div>

        {/* Optional per-brand wire-type toggle (hidden when file is single-type) */}
        {multiTypeBrands.map(({ brand, types }) => {
          const selected = wireTypeSel[brand]?.[size] ?? types[0];
          return (
            <div key={brand} className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-medium text-muted-foreground">
                {brand}:
              </span>
              {types.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setWireType(brand, size, t)}
                  className={cn(
                    "rounded border px-2 py-0.5 text-xs font-medium transition-colors",
                    selected === t
                      ? "border-accent bg-accent/15 text-accent-foreground"
                      : "border-input hover:bg-secondary"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          );
        })}

        <Button
          type="button"
          variant={inCart ? "secondary" : "default"}
          onClick={commit}
          className="w-full"
        >
          <ShoppingCart />
          {inCart ? "Update cart" : "Add to Cart"}
        </Button>
      </CardContent>
    </Card>
  );
}
