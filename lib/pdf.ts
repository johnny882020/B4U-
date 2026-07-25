import "server-only";
import { extractText, getDocumentProxy } from "unpdf";

export interface ExtractedPdf {
  pageCount: number;
  slideText: string;
}

export async function extractPdfText(buffer: ArrayBuffer): Promise<ExtractedPdf> {
  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text, totalPages } = await extractText(pdf, { mergePages: false });

  const pages = Array.isArray(text) ? text : [text];

  const slideText = pages
    .map((pageText, index) => `[Slide ${index + 1}]\n${pageText.trim()}`)
    .join("\n\n---SLIDE BREAK---\n\n");

  return { pageCount: totalPages, slideText };
}
