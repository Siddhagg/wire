"use client";

import { FileSpreadsheet } from "lucide-react";
import { useAppStore, useHydrated } from "@/lib/store";
import { UploadButton } from "@/components/UploadButton";

export function RatesHint() {
  const hydrated = useHydrated();
  const loaded = useAppStore((s) => s.rows.length > 0);

  if (!hydrated || loaded) return null;

  return (
    <div className="flex flex-col items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-900 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-3">
        <FileSpreadsheet className="h-6 w-6 shrink-0 text-amber-600" />
        <div>
          <div className="text-sm font-semibold">No rate list loaded yet</div>
          <div className="text-xs text-amber-800">
            Upload your rate-list Excel to load brand pricing. You can still
            build the cart now — prices appear once a file is loaded.
          </div>
        </div>
      </div>
      <UploadButton label="Upload Rate List" />
    </div>
  );
}
