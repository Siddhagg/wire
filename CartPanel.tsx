"use client";

import * as React from "react";
import Link from "next/link";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAppStore, useHydrated } from "@/lib/store";
import { METRES_PER_UNIT } from "@/lib/constants";
import { formatNumber } from "@/lib/format";

export function CartPanel({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const cart = useAppStore((s) => s.cart);
  const setCartQty = useAppStore((s) => s.setCartQty);
  const removeFromCart = useAppStore((s) => s.removeFromCart);
  const clearCart = useAppStore((s) => s.clearCart);
  const rowsLoaded = useAppStore((s) => s.rows.length > 0);

  const items = hydrated ? cart : [];
  const sorted = [...items].sort((a, b) => a.size - b.size);
  const totalMetres = items.reduce((s, i) => s + i.qty * METRES_PER_UNIT, 0);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b bg-navy-50/60">
        <CardTitle className="flex items-center gap-2 text-navy-800">
          <ShoppingCart className="h-4 w-4" />
          Order Cart
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
        {items.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            className="text-destructive hover:text-destructive"
            onClick={clearCart}
          >
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        {items.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground">
            No sizes added yet. Use the cards to add sizes and quantities.
          </div>
        ) : (
          <ul className="divide-y">
            {sorted.map((item) => (
              <li
                key={item.size}
                className="flex items-center justify-between gap-2 p-3"
              >
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-navy-800">
                    {item.size} sq mm
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatNumber(item.qty * METRES_PER_UNIT)} m
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCartQty(item.size, item.qty - 1)}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <input
                    type="number"
                    min={1}
                    value={item.qty}
                    onChange={(e) => {
                      const n = parseInt(e.target.value, 10);
                      if (!isNaN(n)) setCartQty(item.size, n);
                    }}
                    className="h-7 w-12 rounded-md border border-input bg-card text-center text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    aria-label={`${item.size} sq mm quantity`}
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => setCartQty(item.size, item.qty + 1)}
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => removeFromCart(item.size)}
                    aria-label={`Remove ${item.size} sq mm`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}

        {items.length > 0 && (
          <div className="space-y-3 border-t p-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{items.length} size(s)</span>
              <span>{formatNumber(totalMetres)} m total</span>
            </div>
            <Link
              href="/comparison"
              className={cn(buttonVariants({ variant: "accent" }), "w-full")}
            >
              Compare brands <ArrowRight />
            </Link>
            {!rowsLoaded && (
              <p className="text-center text-xs text-amber-700">
                Upload a rate list to see prices.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
