"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Cable, CheckCircle2, CircleAlert, ShoppingCart, SlidersHorizontal, Table2 } from "lucide-react";
import { UploadButton } from "@/components/UploadButton";
import { GstSelector } from "@/components/GstSelector";
import { useAppStore, useHydrated } from "@/lib/store";
import { BUSINESS_NAME, TOOL_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/", label: "Estimator", icon: ShoppingCart },
  { href: "/comparison", label: "Comparison", icon: Table2 },
  { href: "/discounts", label: "Discounts", icon: SlidersHorizontal },
];

function StatusPill() {
  const hydrated = useHydrated();
  const rows = useAppStore((s) => s.rows);
  const cartCount = useAppStore((s) => s.cart.length);
  const loaded = hydrated && rows.length > 0;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
        loaded
          ? "bg-emerald-500/15 text-emerald-100 ring-1 ring-emerald-400/40"
          : "bg-amber-500/15 text-amber-100 ring-1 ring-amber-400/40"
      )}
      title={loaded ? `${rows.length} rates loaded` : "Upload a rate list to begin"}
    >
      {loaded ? (
        <>
          <CheckCircle2 className="h-3.5 w-3.5" />
          Rate list loaded
        </>
      ) : (
        <>
          <CircleAlert className="h-3.5 w-3.5" />
          No rate list loaded
        </>
      )}
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();

  return (
    <header className="no-print sticky top-0 z-40 border-b border-white/10 bg-navy-800 text-primary-foreground shadow-md">
      <div className="container flex flex-col gap-3 py-3">
        {/* Row 1: brand + controls */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-accent text-accent-foreground shadow">
              <Cable className="h-5 w-5" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-wide">
                {BUSINESS_NAME}
              </div>
              <div className="text-xs text-primary-foreground/70">
                {TOOL_NAME}
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusPill />
            <GstSelector />
            <UploadButton />
          </div>
        </div>

        {/* Row 2: page navigation */}
        <nav className="flex items-center gap-1">
          {NAV.map((item) => {
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-white/15 text-white"
                    : "text-primary-foreground/70 hover:bg-white/10 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
