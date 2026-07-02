// Export helpers — image (PNG), PDF, WhatsApp share, print (build brief §8).
// All dynamically import the heavy libs so they never bloat the initial bundle
// and never run during SSR.

import { BUSINESS_NAME } from "./constants";

function fileStamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

const baseName = () =>
  `${BUSINESS_NAME.replace(/\s+/g, "-")}-wire-quote-${fileStamp()}`;

/** Render a DOM node to a high-DPI canvas via html2canvas. */
async function renderCanvas(node: HTMLElement): Promise<HTMLCanvasElement> {
  const html2canvas = (await import("html2canvas")).default;
  return html2canvas(node, {
    scale: Math.min(2, window.devicePixelRatio || 1) * 1.5,
    backgroundColor: "#ffffff",
    useCORS: true,
    logging: false,
    windowWidth: node.scrollWidth,
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("Canvas is empty"))),
      "image/png",
      1
    );
  });
}

function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so the download has a chance to start.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** §8.1 — download the quote view as a PNG. */
export async function exportImage(node: HTMLElement): Promise<void> {
  const canvas = await renderCanvas(node);
  const blob = await canvasToBlob(canvas);
  triggerDownload(blob, `${baseName()}.png`);
}

/** Build a PDF Blob from the quote node (A4, multi-page if tall). */
async function buildPdf(node: HTMLElement): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const canvas = await renderCanvas(node);
  const imgData = canvas.toDataURL("image/png", 1);

  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const margin = 8;
  const usableW = pageW - margin * 2;

  const imgH = (canvas.height * usableW) / canvas.width;

  if (imgH <= pageH - margin * 2) {
    pdf.addImage(imgData, "PNG", margin, margin, usableW, imgH);
  } else {
    // Slice the tall canvas across multiple A4 pages.
    const pageContentH = pageH - margin * 2;
    const pxPerMm = canvas.width / usableW;
    const sliceHpx = pageContentH * pxPerMm;
    let renderedH = 0;
    let page = 0;

    while (renderedH < canvas.height) {
      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      sliceCanvas.height = Math.min(sliceHpx, canvas.height - renderedH);
      const ctx = sliceCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          renderedH,
          canvas.width,
          sliceCanvas.height,
          0,
          0,
          canvas.width,
          sliceCanvas.height
        );
      }
      const sliceData = sliceCanvas.toDataURL("image/png", 1);
      const sliceHmm = sliceCanvas.height / pxPerMm;
      if (page > 0) pdf.addPage();
      pdf.addImage(sliceData, "PNG", margin, margin, usableW, sliceHmm);
      renderedH += sliceCanvas.height;
      page++;
    }
  }

  return pdf.output("blob");
}

/** §8.2 — download the quote view as a clean PDF document. */
export async function exportPdf(node: HTMLElement): Promise<void> {
  const blob = await buildPdf(node);
  triggerDownload(blob, `${baseName()}.pdf`);
}

export interface ShareResult {
  method: "shared" | "downloaded-fallback";
}

/**
 * §8.3 — WhatsApp share.
 *  - Where the Web Share API supports files (Android Chrome, iOS Safari), open
 *    the native share sheet with the generated PNG so the user picks WhatsApp.
 *  - Otherwise (desktop), download the image and open a wa.me link with a
 *    pre-filled note. Auto-attaching a file to WhatsApp from a website is not
 *    technically possible, so the user attaches the just-downloaded file.
 */
export async function shareWhatsApp(node: HTMLElement): Promise<ShareResult> {
  const note = "Sharing wire bundle quote — see attached.";
  const canvas = await renderCanvas(node);
  const blob = await canvasToBlob(canvas);
  const file = new File([blob], `${baseName()}.png`, { type: "image/png" });

  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean;
  };

  if (
    typeof nav.share === "function" &&
    typeof nav.canShare === "function" &&
    nav.canShare({ files: [file] })
  ) {
    try {
      await nav.share({
        files: [file],
        title: `${BUSINESS_NAME} — Wire Bundle Quote`,
        text: note,
      });
      return { method: "shared" };
    } catch (err) {
      // User cancelled or share failed — fall through to the download path.
      if ((err as Error)?.name === "AbortError") {
        return { method: "shared" };
      }
    }
  }

  // Desktop fallback: download the file + open WhatsApp with a pre-filled note.
  triggerDownload(blob, file.name);
  const waUrl = `https://wa.me/?text=${encodeURIComponent(note)}`;
  window.open(waUrl, "_blank", "noopener,noreferrer");
  return { method: "downloaded-fallback" };
}

/** §8.4 — print using the dedicated @media print stylesheet. */
export function printQuote(): void {
  window.print();
}
