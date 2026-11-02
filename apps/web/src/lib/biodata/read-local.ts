"use client";

/**
 * AMX-206 — read a biodata entirely in the visitor's browser (nothing is uploaded):
 *  1. PDF with a text layer → pdf.js text (fast, near-exact);
 *  2. scanned PDF / photo → Tesseract OCR (Hindi + English).
 * Language data for OCR is fetched once from the CDN and cached by the browser.
 */
import { type BiodataFields, parseBiodata } from "./parse";

async function pdfText(file: File): Promise<{ text: string; firstPage: HTMLCanvasElement | null }> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  const doc = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
  const lines: string[] = [];
  for (let i = 1; i <= Math.min(doc.numPages, 3); i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // Rebuild lines from text items by their vertical position.
    const rows = new Map<number, string[]>();
    for (const it of content.items as { str: string; transform: number[] }[]) {
      const y = Math.round(it.transform[5]);
      rows.set(y, [...(rows.get(y) ?? []), it.str]);
    }
    [...rows.entries()].sort((a, b) => b[0] - a[0]).forEach(([, parts]) => lines.push(parts.join(" ")));
  }
  let firstPage: HTMLCanvasElement | null = null;
  if (lines.join("").trim().length < 40) {
    // No real text layer (scanned PDF): render page 1 for OCR.
    const page = await doc.getPage(1);
    const viewport = page.getViewport({ scale: 2 });
    firstPage = document.createElement("canvas");
    firstPage.width = viewport.width;
    firstPage.height = viewport.height;
    await page.render({ canvasContext: firstPage.getContext("2d")!, viewport }).promise;
  }
  return { text: lines.join("\n"), firstPage };
}

async function ocr(image: File | HTMLCanvasElement, onProgress?: (pct: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  // English first: with Hindi as the primary model Tesseract drops the digit 1 (reads it as a danda).
  const worker = await createWorker(["eng", "hin"], 1, {
    logger: (m: { status: string; progress: number }) => m.status === "recognizing text" && onProgress?.(Math.round(m.progress * 100)),
  });
  try {
    const { data } = await worker.recognize(image);
    return data.text;
  } finally {
    await worker.terminate();
  }
}

export async function readBiodataLocally(file: File, onProgress?: (pct: number) => void): Promise<BiodataFields> {
  if (file.type === "application/pdf") {
    const { text, firstPage } = await pdfText(file);
    if (!firstPage) return parseBiodata(text);
    return parseBiodata(await ocr(firstPage, onProgress));
  }
  return parseBiodata(await ocr(file, onProgress));
}
