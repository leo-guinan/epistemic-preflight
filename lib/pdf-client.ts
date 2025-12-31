// Client-side PDF processing using PDF.js
// This processes PDFs in the browser to avoid Vercel's 4.5MB request limit
// Uses dynamic import to avoid SSR issues

export interface ProcessedPDF {
  text: string;
  pageCount: number;
  pages: string[];
}

export async function processPDFClient(file: File): Promise<ProcessedPDF> {
  // Dynamic import - only loads in browser, not during SSR
  if (typeof window === 'undefined') {
    throw new Error('PDF processing is only available in the browser');
  }

  // Dynamically import pdfjs-dist only when needed (client-side)
  const pdfjsLib = await import('pdfjs-dist');
  
  // Set worker source for PDF.js
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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

