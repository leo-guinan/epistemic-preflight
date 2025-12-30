import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const analyzeRequestSchema = z.object({
  paperContent: z.string().min(1).optional(),
  file: z.string().optional(), // base64 encoded file
  fileName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[API] ===== Analysis Request Started =====");
  console.log("[API] Timestamp:", new Date().toISOString());

  try {
    // Check if this is FormData (file upload) or JSON
    const contentType = request.headers.get("content-type") || "";
    console.log("[API] Content-Type:", contentType);

    let paperContent: string;
    let fileName: string | undefined;

    if (contentType.includes("multipart/form-data")) {
      console.log("[API] Processing FormData upload...");
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;

      if (file) {
        console.log("[API] File received:", file.name, "Size:", file.size, "bytes");
        console.log("[API] File type:", file.type);
        fileName = file.name;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          console.log("[API] Processing PDF file...");
          const processed = await processPDF(buffer);
          paperContent = processed.text;
          console.log("[API] PDF processed successfully");
          console.log("[API] Extracted text length:", paperContent.length, "characters");
          console.log("[API] Number of pages:", processed.pageCount);
        } else {
          console.log("[API] Processing as text file...");
          paperContent = buffer.toString("utf-8");
          console.log("[API] Text extracted, length:", paperContent.length, "characters");
        }
      } else if (textContent) {
        console.log("[API] Using text content from form data");
        paperContent = textContent;
      } else {
        throw new Error("No file or text content provided");
      }
    } else {
      console.log("[API] Processing JSON request...");
      const body = await request.json();
      const parsed = analyzeRequestSchema.parse(body);
      
      if (parsed.file) {
        console.log("[API] Processing base64 encoded file...");
        const buffer = Buffer.from(parsed.file, "base64");
        
        if (parsed.fileName?.endsWith(".pdf")) {
          console.log("[API] Processing PDF from base64...");
          const processed = await processPDF(buffer);
          paperContent = processed.text;
          console.log("[API] PDF processed, text length:", paperContent.length);
        } else {
          paperContent = buffer.toString("utf-8");
        }
        fileName = parsed.fileName;
      } else if (parsed.paperContent) {
        console.log("[API] Using paperContent from JSON");
        paperContent = parsed.paperContent;
      } else {
        throw new Error("No paperContent or file provided");
      }
    }

    if (!paperContent || paperContent.trim().length === 0) {
      throw new Error("No text content extracted from the provided file");
    }

    console.log("[API] Paper content length:", paperContent.length, "characters");
    console.log("[API] First 500 characters:", paperContent.substring(0, 500));
    console.log("[API] Getting agent...");

    const agent = mastra.getAgent("paperAnalysisAgent");
    console.log("[API] Agent retrieved successfully");

    // Truncate if too long, but keep more context
    const maxLength = 50000; // Increased from 8000
    const truncatedContent = paperContent.length > maxLength 
      ? paperContent.substring(0, maxLength) + "\n\n[Content truncated for analysis...]"
      : paperContent;
    
    console.log("[API] Content length for analysis:", truncatedContent.length, "characters");

    const prompt = `Analyze this research paper and extract its core claims. 
    
Paper content:
${truncatedContent}

Return a JSON object with:
1. An array of 3-5 core claims, each with:
   - id: unique identifier
   - text: the claim statement
   - type: "foundational", "downstream", or "supporting"
   - importance: number from 1-10
2. riskSignal: a one-line statement if any claim sits at a known disagreement boundary (optional)

Format your response as valid JSON only.`;

    console.log("[API] Sending request to agent...");
    console.log("[API] Prompt length:", prompt.length, "characters");
    
    const agentStartTime = Date.now();
    
    // Use generate() for V2 models with structuredOutput
    const result = await agent.generate(prompt, {
      structuredOutput: {
        schema: z.object({
          claims: z.array(
            z.object({
              id: z.string(),
              text: z.string(),
              type: z.enum(["foundational", "downstream", "supporting"]),
              importance: z.number().min(1).max(10),
            })
          ),
          riskSignal: z.string().optional(),
        }),
      },
    });

    const agentTime = Date.now() - agentStartTime;
    console.log("[API] Agent response received in", agentTime, "ms");
    console.log("[API] Result type:", typeof result);
    console.log("[API] Result keys:", Object.keys(result || {}));

    // Result is already the full output for Mastra format
    const analysis = (result as any).object || result;
    
    console.log("[API] Analysis extracted:");
    console.log("[API] - Claims count:", analysis?.claims?.length || 0);
    console.log("[API] - Risk signal:", analysis?.riskSignal ? "Present" : "None");
    
    if (analysis?.claims) {
      analysis.claims.forEach((claim: any, index: number) => {
        console.log(`[API] Claim ${index + 1}:`, {
          id: claim.id,
          type: claim.type,
          importance: claim.importance,
          textPreview: claim.text?.substring(0, 100) + "...",
        });
      });
    }

    const totalTime = Date.now() - startTime;
    console.log("[API] ===== Analysis Complete =====");
    console.log("[API] Total time:", totalTime, "ms");
    console.log("[API] Agent time:", agentTime, "ms");

    return NextResponse.json({
      claims: analysis?.claims || [],
      riskSignal: analysis?.riskSignal,
      extractedText: paperContent, // Return extracted text so frontend can store it
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[API] ===== Analysis Error =====");
    console.error("[API] Error after", totalTime, "ms");
    console.error("[API] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[API] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[API] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to analyze paper",
        claims: [],
      },
      { status: 500 }
    );
  }
}

