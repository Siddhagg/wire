"use client";

import * as React from "react";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/lib/store";
import { ADJUST_MIN, ADJUST_MAX } from "@/lib/constants";
import { formatPct } from "@/lib/format";
import { clamp } from "@/lib/calc";
import { cn } from "@/lib/utils";

export function BrandDiscountRow({ brand }: { brand: string }) {
  const adjust = useAppStore((s) => s.brandAdjust[brand] ?? 0);
  const setBrandAdjust = useAppStore((s) => s.setBrandAdjust);
  const rows = useAppStore((s) => s.rows);

  // Base discount range across this brand's rates (internal context).
  const baseRange = React.useMemo(() => {
    const discs = rows
      .filter((r) => r.brand === brand)
      .map((r) => r.baseDiscountPct);
    if (discs.length === 0) return null;
    const min = Math.min(...discs);
    const max = Math.max(...discs);
    return { min, max };
  }, [rows, brand]);

  const [text, setText] = React.useState(String(adjust));

  // Keep the text field in sync when the slider (or a reset) changes the value.
  React.useEffect(() => {
    setText(String(adjust));
  }, [adjust]);

  function commitText(raw: string) {
    if (raw === "" || raw === "-") {
      setBrandAdjust(brand, 0);
      return;
    }
    const n = Number(raw);
    if (!isNaN(n)) setBrandAdjust(brand, clamp(n, ADJUST_MIN, ADJUST_MAX));
  }

  const tone =
    adjust > 0 ? "text-emerald-700" : adjust < 0 ? "text-destructive" : "text-muted-foreground";

  return (
    <div className="grid grid-cols-1 items-center gap-3 border-b py-4 last:border-b-0 sm:grid-cols-[180px_1fr_auto]">
      <div>
        <div className="font-semibold text-navy-800">{brand}</div>
        {baseRange && (
          <div className="text-xs text-muted-foreground">
            Base{" "}
            {baseRange.min === baseRange.max
              ? formatPct(baseRange.min)
              : `${formatPct(baseRange.min)}–${formatPct(baseRange.max)}`}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        <span className="w-8 text-right text-xs text-muted-foreground">
          {ADJUST_MIN}%
        </span>
        <Slider
          value={[adjust]}
          min={ADJUST_MIN}
          max={ADJUST_MAX}
          step={0.5}
          onValueChange={(v) => setBrandAdjust(brand, v[0])}
          aria-label={`${brand} extra discount adjustment`}
        />
        <span className="w-8 text-xs text-muted-foreground">+{ADJUST_MAX}%</span>
      </div>

      <div className="flex items-center gap-2 justify-self-start sm:justify-self-end">
        <div className="flex items-center rounded-md border border-input bg-card">
          <input
            type="number"
            min={ADJUST_MIN}
            max={ADJUST_MAX}
            step={0.5}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              commitText(e.target.value);
            }}
            onBlur={() => setText(String(adjust))}
            className="h-9 w-16 rounded-md bg-transparent px-2 text-center text-sm font-semibold focus-visible:outline-none"
            aria-label={`${brand} extra discount value`}
          />
          <span className="pr-2 text-sm text-muted-foreground">%</span>
        </div>
        <Badge
          variant={adjust === 0 ? "muted" : adjust > 0 ? "success" : "secondary"}
          className={cn("min-w-[64px] justify-center", adjust < 0 && tone)}
        >
          {adjust > 0 ? "+" : ""}
          {formatPct(adjust)}
        </Badge>
      </div>
    </div>
  );
}
