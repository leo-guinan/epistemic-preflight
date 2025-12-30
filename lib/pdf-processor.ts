import pdfParse from "pdf-parse";

export interface ProcessedPDF {
  text: string;
  pageCount: number;
  pages: string[];
}

/**
 * Process a PDF file and extract text content
 * Returns text from all pages, plus individual page texts
 */
export async function processPDF(buffer: Buffer): Promise<ProcessedPDF> {
  console.log("[PDF Processor] Starting PDF processing...");
  console.log("[PDF Processor] Buffer size:", buffer.length, "bytes");

  try {
    const data = await pdfParse(buffer);
    
    console.log("[PDF Processor] PDF parsed successfully");
    console.log("[PDF Processor] Page count:", data.numpages);
    console.log("[PDF Processor] Text length:", data.text.length, "characters");
    console.log("[PDF Processor] First 200 chars:", data.text.substring(0, 200));

    // Split text by pages if available
    const pages: string[] = [];
    if (data.text) {
      // Try to split by page breaks (common patterns)
      const pageTexts = data.text.split(/\f|\n\n\n+/);
      pages.push(...pageTexts.filter((p) => p.trim().length > 0));
      
      // If we didn't get good page splits, just use the full text
      if (pages.length === 0 || pages.length !== data.numpages) {
        console.log("[PDF Processor] Could not split into pages, using full text");
        pages.push(data.text);
      }
    }

    console.log("[PDF Processor] Extracted", pages.length, "page(s)");

    return {
      text: data.text,
      pageCount: data.numpages,
      pages,
    };
  } catch (error) {
    console.error("[PDF Processor] Error processing PDF:", error);
    throw new Error(`Failed to process PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Process PDF pages individually and combine results
 * Useful for large PDFs or when processing fails on full document
 */
export async function processPDFByPages(
  buffer: Buffer,
  maxPagesPerChunk: number = 5
): Promise<string[]> {
  console.log("[PDF Processor] Processing PDF by pages...");
  
  const processed = await processPDF(buffer);
  const chunks: string[] = [];
  
  for (let i = 0; i < processed.pages.length; i += maxPagesPerChunk) {
    const chunk = processed.pages.slice(i, i + maxPagesPerChunk).join("\n\n--- Page Break ---\n\n");
    chunks.push(chunk);
    console.log(`[PDF Processor] Created chunk ${chunks.length} (pages ${i + 1}-${Math.min(i + maxPagesPerChunk, processed.pages.length)})`);
  }
  
  return chunks;
}

