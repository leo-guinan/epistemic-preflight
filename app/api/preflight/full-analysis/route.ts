import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const fullAnalysisRequestSchema = z.object({
  paperContent: z.string().optional(),
  file: z.string().optional(), // base64 encoded file
  fileName: z.string().optional(),
  comparators: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Full Analysis] ===== Full Analysis Request Started =====");
  console.log("[Full Analysis] Timestamp:", new Date().toISOString());

  try {
    // Check if this is FormData (file upload) or JSON
    const contentType = request.headers.get("content-type") || "";
    console.log("[Full Analysis] Content-Type:", contentType);

    let paperContent: string;
    let fileName: string | undefined;
    let comparators: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      console.log("[Full Analysis] Processing FormData upload...");
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;
      const comparatorsData = formData.get("comparators");

      if (comparatorsData) {
        try {
          comparators = JSON.parse(comparatorsData as string);
        } catch (e) {
          console.log("[Full Analysis] Could not parse comparators from form data");
        }
      }

      if (file) {
        console.log("[Full Analysis] File received:", file.name, "Size:", file.size, "bytes");
        fileName = file.name;

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          console.log("[Full Analysis] Processing PDF file...");
          const processed = await processPDF(buffer);
          paperContent = processed.text;
          console.log("[Full Analysis] PDF processed, text length:", paperContent.length);
        } else {
          console.log("[Full Analysis] Processing as text file...");
          paperContent = buffer.toString("utf-8");
        }
      } else if (textContent) {
        console.log("[Full Analysis] Using text content from form data");
        paperContent = textContent;
      } else {
        throw new Error("No file or text content provided");
      }
    } else {
      console.log("[Full Analysis] Processing JSON request...");
      const body = await request.json();
      const parsed = fullAnalysisRequestSchema.parse(body);
      
      comparators = parsed.comparators || [];
      
      if (parsed.file) {
        console.log("[Full Analysis] Processing base64 encoded file...");
        const buffer = Buffer.from(parsed.file, "base64");
        
        if (parsed.fileName?.endsWith(".pdf")) {
          console.log("[Full Analysis] Processing PDF from base64...");
          const processed = await processPDF(buffer);
          paperContent = processed.text;
          console.log("[Full Analysis] PDF processed, text length:", paperContent.length);
        } else {
          paperContent = buffer.toString("utf-8");
        }
        fileName = parsed.fileName;
      } else if (parsed.paperContent) {
        console.log("[Full Analysis] Using paperContent from JSON");
        paperContent = parsed.paperContent;
      } else {
        throw new Error("No paperContent or file provided");
      }
    }

    if (!paperContent || paperContent.trim().length === 0) {
      throw new Error("No text content extracted from the provided file");
    }
    
    console.log("[Full Analysis] Comparators:", comparators.length);

    console.log("[Full Analysis] Paper content length:", paperContent.length, "characters");
    console.log("[Full Analysis] Comparators:", comparators?.length || 0);
    console.log("[Full Analysis] Getting agent...");

    const agent = mastra.getAgent("paperAnalysisAgent");
    console.log("[Full Analysis] Agent retrieved successfully");

    // Truncate if too long, but keep more context
    const maxLength = 50000;
    const truncatedContent = paperContent.length > maxLength 
      ? paperContent.substring(0, maxLength) + "\n\n[Content truncated for analysis...]"
      : paperContent;
    
    console.log("[Full Analysis] Content length for analysis:", truncatedContent.length, "characters");

    const prompt = `Perform a full epistemic analysis comparing this paper to existing work.

Paper content:
${truncatedContent}

${comparators && comparators.length > 0 ? `Comparator papers: ${comparators.join(', ')}` : 'No comparator papers provided.'}

Provide a comprehensive analysis with:
1. overlap: Where the paper genuinely overlaps with existing work (single string)
2. conflict: Where it directly conflicts (single string)
3. novel: Where it's orthogonal or novel (single string)
4. risks: Top 3 reviewer risks as an array of exactly 3 strings. Each risk should be a separate, distinct concern that reviewers might raise. Format as: ["Risk 1 description", "Risk 2 description", "Risk 3 description"]
5. reframing: 1-2 reframing suggestions as an array of strings. Each suggestion should be a distinct alternative framing approach.

IMPORTANT: The "risks" field must be an array with exactly 3 separate risk strings. Do not combine multiple risks into one string.

Format your response as valid JSON only.`;

    console.log("[Full Analysis] Sending request to agent...");
    console.log("[Full Analysis] Prompt length:", prompt.length, "characters");
    
    const agentStartTime = Date.now();

    // Use generate() for V2 models with structuredOutput
    const result = await agent.generate(prompt, {
      structuredOutput: {
        schema: z.object({
          overlap: z.string(),
          conflict: z.string(),
          novel: z.string(),
          risks: z.array(z.string()),
          reframing: z.array(z.string()),
        }),
      },
    });

    const agentTime = Date.now() - agentStartTime;
    console.log("[Full Analysis] Agent response received in", agentTime, "ms");

    // Result is already the full output for Mastra format
    let analysis = (result as any).object || result;

    console.log("[Full Analysis] Analysis extracted:");
    console.log("[Full Analysis] - Overlap:", analysis?.overlap ? "Present" : "None");
    console.log("[Full Analysis] - Conflict:", analysis?.conflict ? "Present" : "None");
    console.log("[Full Analysis] - Novel:", analysis?.novel ? "Present" : "None");
    console.log("[Full Analysis] - Risks type:", typeof analysis?.risks);
    console.log("[Full Analysis] - Risks value:", JSON.stringify(analysis?.risks));
    console.log("[Full Analysis] - Risks count:", analysis?.risks?.length || 0);
    console.log("[Full Analysis] - Reframing count:", analysis?.reframing?.length || 0);

    // Post-process risks to ensure we have an array of strings
    if (analysis?.risks) {
      if (typeof analysis.risks === 'string') {
        // If risks came as a single string, try to split it
        console.log("[Full Analysis] Risks came as string, attempting to split...");
        // Try splitting by common patterns
        const splitRisks = analysis.risks
          .split(/\n\n+|(?=\d+\.\s*Risk|\*\*Risk|\d+\)\s*Risk)/i)
          .map((r: string) => r.trim())
          .filter((r: string) => r.length > 0);
        
        if (splitRisks.length > 0) {
          analysis.risks = splitRisks.slice(0, 3); // Take first 3
          console.log("[Full Analysis] Split risks into", analysis.risks.length, "items");
        } else {
          // If splitting didn't work, wrap in array
          analysis.risks = [analysis.risks];
        }
      } else if (Array.isArray(analysis.risks)) {
        // Ensure all items are strings
        analysis.risks = analysis.risks
          .map((r: any) => typeof r === 'string' ? r : String(r))
          .filter((r: string) => r.trim().length > 0)
          .slice(0, 3); // Ensure max 3
        console.log("[Full Analysis] Processed risks array, final count:", analysis.risks.length);
      }
    } else {
      analysis.risks = [];
    }

    // Log final risks
    if (analysis.risks && analysis.risks.length > 0) {
      analysis.risks.forEach((risk: string, index: number) => {
        console.log(`[Full Analysis] Risk ${index + 1} (${risk.length} chars):`, risk.substring(0, 100) + "...");
      });
    }

    const totalTime = Date.now() - startTime;
    console.log("[Full Analysis] ===== Full Analysis Complete =====");
    console.log("[Full Analysis] Total time:", totalTime, "ms");
    console.log("[Full Analysis] Agent time:", agentTime, "ms");

    return NextResponse.json({
      overlap: analysis?.overlap || "No significant overlaps identified.",
      conflict: analysis?.conflict || "No direct conflicts identified.",
      novel: analysis?.novel || "Novel contributions identified.",
      risks: analysis?.risks || [],
      reframing: analysis?.reframing || [],
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[Full Analysis] ===== Full Analysis Error =====");
    console.error("[Full Analysis] Error after", totalTime, "ms");
    console.error("[Full Analysis] Error type:", error instanceof Error ? error.constructor.name : typeof error);
    console.error("[Full Analysis] Error message:", error instanceof Error ? error.message : String(error));
    console.error("[Full Analysis] Error stack:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to perform full analysis",
        overlap: "",
        conflict: "",
        novel: "",
        risks: [],
        reframing: [],
      },
      { status: 500 }
    );
  }
}

