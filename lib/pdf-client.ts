// Client-side PDF processing using PDF.js
// This processes PDFs in the browser to avoid Vercel's 4.5MB request limit

import * as pdfjsLib from 'pdfjs-dist';

// Set worker source for PDF.js
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ProcessedPDF {
  text: string;
  pageCount: number;
  pages: string[];
}

export async function processPDFClient(file: File): Promise<ProcessedPDF> {
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  const pageCount = pdf.numPages;
  
  const pages: string[] = [];
  let fullText = '';

  // Process each page
  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Extract text items and join them
    const pageText = textContent.items
      .map((item: any) => item.str)
      .join(' ')
      .trim();
    
    pages.push(pageText);
    fullText += `\n\n--- Page ${pageNum} ---\n\n${pageText}`;
  }

  return {
    text: fullText.trim(),
    pageCount,
    pages,
  };
}

