import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const narrowingRequestSchema = z.object({
  paperContent: z.string().optional(),
  file: z.string().optional(),
  fileName: z.string().optional(),
  claims: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["foundational", "downstream", "supporting"]),
      importance: z.number(),
    })
  ),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Narrowing] ===== Claim Narrowing Analysis Started =====");

  try {
    const contentType = request.headers.get("content-type") || "";
    let paperContent: string;
    let claims: Array<{
      id: string;
      text: string;
      type: "foundational" | "downstream" | "supporting";
      importance: number;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;
      const claimsData = formData.get("claims") as string | null;

      if (claimsData) {
        try {
          claims = JSON.parse(claimsData);
        } catch (e) {
          console.error("[Narrowing] Failed to parse claims");
        }
      }

      if (file) {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          const processed = await processPDF(buffer);
          paperContent = processed.text;
        } else {
          paperContent = buffer.toString("utf-8");
        }
      } else if (textContent) {
        paperContent = textContent;
      } else {
        throw new Error("No file or text content provided");
      }
    } else {
      const body = await request.json();
      const parsed = narrowingRequestSchema.parse(body);
      paperContent = parsed.paperContent || "";
      claims = parsed.claims || [];

      if (parsed.file) {
        const buffer = Buffer.from(parsed.file, "base64");
        if (parsed.fileName?.endsWith(".pdf")) {
          const processed = await processPDF(buffer);
          paperContent = processed.text;
        } else {
          paperContent = buffer.toString("utf-8");
        }
      }
    }

    if (!paperContent || paperContent.trim().length === 0) {
      throw new Error("No paper content provided");
    }

    if (claims.length === 0) {
      throw new Error("No claims provided");
    }

    console.log("[Narrowing] Paper content length:", paperContent.length);
    console.log("[Narrowing] Claims count:", claims.length);

    const agent = mastra.getAgent("paperAnalysisAgent");

    // Identify narrowable claims
    const narrowingPrompt = `Identify which claims in this paper would benefit from narrowing to reduce reviewer risk.

Paper content:
${paperContent.substring(0, 20000)}

Current claims:
${claims.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text} (${c.type}, importance: ${c.importance})`).join("\n")}

Identify 1-2 claims that are:
- Over-claiming or too absolute
- High risk for reviewer challenge
- Could be narrowed without losing core contribution

Return a JSON object with:
- narrowableClaims: array of objects, each with:
  - claimId: the claim id
  - claimLabel: "Claim A", "Claim B", etc.
  - claimText: the current claim text
  - riskLevel: "high" | "medium"
  - reason: why this claim would benefit from narrowing

Format as valid JSON only.`;

    console.log("[Narrowing] Identifying narrowable claims...");
    const narrowingResult = await agent.generate(narrowingPrompt, {
      structuredOutput: {
        schema: z.object({
          narrowableClaims: z.array(
            z.object({
              claimId: z.string(),
              claimLabel: z.string(),
              claimText: z.string(),
              riskLevel: z.enum(["high", "medium"]),
              reason: z.string(),
            })
          ),
        }),
      },
    });

    const narrowingData = (narrowingResult as any).object || narrowingResult;
    console.log("[Narrowing] Narrowable claims identified:", narrowingData.narrowableClaims?.length || 0);

    const totalTime = Date.now() - startTime;
    console.log("[Narrowing] ===== Complete =====");
    console.log("[Narrowing] Total time:", totalTime, "ms");

    return NextResponse.json({
      narrowableClaims: narrowingData.narrowableClaims || [],
    });
  } catch (error) {
    console.error("[Narrowing] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to identify narrowable claims",
        narrowableClaims: [],
      },
      { status: 500 }
    );
  }
}

