"use client";

import * as React from "react";
import { Upload, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/lib/store";
import { parseRateListFile } from "@/lib/parseRateList";

interface UploadButtonProps {
  variant?: "default" | "accent" | "outline" | "secondary";
  className?: string;
  label?: string;
}

export function UploadButton({
  variant = "accent",
  className,
  label = "Upload Rate List (.xlsx)",
}: UploadButtonProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const loadRates = useAppStore((s) => s.loadRates);
  const [busy, setBusy] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);
  const [tone, setTone] = React.useState<"error" | "warn" | "ok">("ok");

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMessage(null);
    try {
      const result = await parseRateListFile(file);
      if (result.errors.length > 0) {
        setTone("error");
        setMessage(result.errors.join(" "));
      } else {
        loadRates(result, file.name);
        const brandCount = result.brands.length;
        const rowCount = result.rows.length;
        if (result.warnings.length > 0) {
          setTone("warn");
          setMessage(
            `Loaded ${rowCount} rates across ${brandCount} brands. ${result.warnings.length} note(s).`
          );
        } else {
          setTone("ok");
          setMessage(`Loaded ${rowCount} rates across ${brandCount} brands.`);
        }
      }
    } catch (err) {
      setTone("error");
      setMessage("Could not read that file. Please upload a valid .xlsx.");
    } finally {
      setBusy(false);
      // Reset so re-uploading the same file name fires change again.
      if (inputRef.current) inputRef.current.value = "";
      // Auto-clear a success message after a few seconds.
      window.setTimeout(() => setMessage(null), 6000);
    }
  }

  return (
    <div className="flex flex-col items-stretch gap-1">
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={handleFile}
        className="hidden"
      />
      <Button
        type="button"
        variant={variant}
        className={className}
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        {busy ? <Loader2 className="animate-spin" /> : <Upload />}
        {busy ? "Reading…" : label}
      </Button>
      {message && (
        <span
          className={
            tone === "error"
              ? "text-xs text-destructive"
              : tone === "warn"
              ? "text-xs text-amber-700"
              : "text-xs text-emerald-700"
          }
        >
          {message}
        </span>
      )}
    </div>
  );
}
