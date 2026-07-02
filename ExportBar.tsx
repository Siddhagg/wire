"use client";

import * as React from "react";
import { ImageDown, FileText, Share2, Printer, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exportImage, exportPdf, shareWhatsApp, printQuote } from "@/lib/export";

interface ExportBarProps {
  nodeRef: React.RefObject<HTMLElement>;
  setCapturing: (v: boolean) => void;
  disabled?: boolean;
}

type Job = "image" | "pdf" | "whatsapp" | null;

/** Wait two animation frames so the .capturing class is applied before capture. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) =>
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  );
}

export function ExportBar({ nodeRef, setCapturing, disabled }: ExportBarProps) {
  const [job, setJob] = React.useState<Job>(null);
  const [message, setMessage] = React.useState<string | null>(null);

  async function withCapture<T>(fn: (node: HTMLElement) => Promise<T>): Promise<T | undefined> {
    const node = nodeRef.current;
    if (!node) return;
    setMessage(null);
    setCapturing(true);
    await nextFrame();
    try {
      return await fn(node);
    } finally {
      setCapturing(false);
    }
  }

  async function onImage() {
    setJob("image");
    try {
      await withCapture((node) => exportImage(node));
    } catch {
      setMessage("Could not generate the image. Please try again.");
    } finally {
      setJob(null);
    }
  }

  async function onPdf() {
    setJob("pdf");
    try {
      await withCapture((node) => exportPdf(node));
    } catch {
      setMessage("Could not generate the PDF. Please try again.");
    } finally {
      setJob(null);
    }
  }

  async function onWhatsApp() {
    setJob("whatsapp");
    try {
      const result = await withCapture((node) => shareWhatsApp(node));
      if (result?.method === "downloaded-fallback") {
        setMessage(
          "Image downloaded and WhatsApp opened — attach the downloaded image to your chat."
        );
      }
    } catch {
      setMessage("Could not share. The image may have downloaded instead.");
    } finally {
      setJob(null);
    }
  }

  return (
    <div className="no-print flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" onClick={onImage} disabled={disabled || job !== null}>
          {job === "image" ? <Loader2 className="animate-spin" /> : <ImageDown />}
          Image
        </Button>
        <Button variant="outline" onClick={onPdf} disabled={disabled || job !== null}>
          {job === "pdf" ? <Loader2 className="animate-spin" /> : <FileText />}
          PDF
        </Button>
        <Button variant="outline" onClick={onWhatsApp} disabled={disabled || job !== null}>
          {job === "whatsapp" ? <Loader2 className="animate-spin" /> : <Share2 />}
          WhatsApp
        </Button>
        <Button variant="outline" onClick={printQuote} disabled={disabled}>
          <Printer />
          Print
        </Button>
      </div>
      {message && (
        <p className="text-xs text-muted-foreground">{message}</p>
      )}
    </div>
  );
}
