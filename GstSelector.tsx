"use client";

import { useAppStore, useHydrated } from "@/lib/store";
import type { GstMode } from "@/lib/types";
import { cn } from "@/lib/utils";

const OPTIONS: { value: GstMode; label: string }[] = [
  { value: 0, label: "0%" },
  { value: 18, label: "18%" },
];

export function GstSelector({ className }: { className?: string }) {
  const hydrated = useHydrated();
  const gstMode = useAppStore((s) => s.gstMode);
  const setGstMode = useAppStore((s) => s.setGstMode);
  const active = hydrated ? gstMode : 0;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className="text-xs font-medium text-primary-foreground/80">
        GST
      </span>
      <div className="inline-flex rounded-md border border-white/20 bg-white/10 p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setGstMode(opt.value)}
            className={cn(
              "rounded px-3 py-1 text-xs font-semibold transition-colors",
              active === opt.value
                ? "bg-accent text-accent-foreground shadow-sm"
                : "text-primary-foreground/80 hover:bg-white/10"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
