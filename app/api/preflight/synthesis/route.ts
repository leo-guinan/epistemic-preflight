import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const synthesisRequestSchema = z.object({
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
  console.log("[Synthesis] ===== Synthesis Generation Started =====");
  console.log("[Synthesis] Timestamp:", new Date().toISOString());

  try {
    const contentType = request.headers.get("content-type") || "";
    console.log("[Synthesis] Content-Type:", contentType);

    let paperContent: string;
    let claims: Array<{
      id: string;
      text: string;
      type: "foundational" | "downstream" | "supporting";
      importance: number;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      console.log("[Synthesis] Processing FormData...");
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;
      const claimsData = formData.get("claims") as string | null;

      if (claimsData) {
        try {
          claims = JSON.parse(claimsData);
        } catch (e) {
          console.error("[Synthesis] Failed to parse claims:", e);
        }
      }

      if (file) {
        console.log("[Synthesis] Processing file:", file.name);
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
      console.log("[Synthesis] Processing JSON...");
      const body = await request.json();
      const parsed = synthesisRequestSchema.parse(body);
      
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

    console.log("[Synthesis] Paper content length:", paperContent.length);
    console.log("[Synthesis] Claims count:", claims.length);

    const agent = mastra.getAgent("paperAnalysisAgent");
    console.log("[Synthesis] Agent retrieved");

    // Extract abstract from paper (first ~500 words or until first section)
    const abstractMatch = paperContent.match(
      /(?:abstract|summary)[:\s]*\n?\s*([^\n]{50,1000})/i
    );
    const originalAbstract = abstractMatch
      ? abstractMatch[1].trim()
      : paperContent.substring(0, 500).trim();

    console.log("[Synthesis] Original abstract length:", originalAbstract.length);

    // Generate claim shifts
    const claimShiftsPrompt = `You are analyzing how core claims would shift under a synthesis framing.

Current claims:
${claims.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text} (${c.type})`).join("\n")}

For each claim, show how it would be reframed under a synthesis approach. A synthesis framing:
- Positions work as synthesizing rather than competing
- Changes where responsibility is enforced
- Softens absolutes into scope conditions
- Adds boundary language

Return a JSON object with:
- claimShifts: array of objects, each with:
  - claimId: the claim id
  - claimLabel: "Claim A", "Claim B", etc.
  - before: how the claim reads now (short phrase)
  - after: how it reads under synthesis (short phrase)
  - changeType: "reframed" | "re-scoped" | "unchanged"
- summary: object with counts:
  - removed: number (should be 0)
  - rescoped: number
  - reframed: number
  - weakened: number (should be 0)

Format as valid JSON only.`;

    console.log("[Synthesis] Generating claim shifts...");
    const claimShiftsResult = await agent.generate(claimShiftsPrompt, {
      structuredOutput: {
        schema: z.object({
          claimShifts: z.array(
            z.object({
              claimId: z.string(),
              claimLabel: z.string(),
              before: z.string(),
              after: z.string(),
              changeType: z.enum(["reframed", "re-scoped", "unchanged"]),
            })
          ),
          summary: z.object({
            removed: z.number(),
            rescoped: z.number(),
            reframed: z.number(),
            weakened: z.number(),
          }),
        }),
      },
    });

    const claimShiftsData = (claimShiftsResult as any).object || claimShiftsResult;
    console.log("[Synthesis] Claim shifts generated:", claimShiftsData.claimShifts?.length || 0);

    // Generate synthesis abstract
    const abstractPrompt = `Rewrite this abstract using a synthesis framing:

Original abstract:
${originalAbstract}

A synthesis framing should:
- Add boundary language (e.g., "within current architectures", "absent verification layers")
- Soften absolutes into scope conditions
- Position the work as synthesizing rather than competing
- Make explicit where responsibility is enforced

Return a JSON object with:
- synthesisAbstract: the rewritten abstract
- abstractHighlights: object with arrays:
  - added: phrases showing added boundary language
  - softened: phrases showing softened absolutes
  - scopeConditions: phrases showing explicit scope conditions

Format as valid JSON only.`;

    console.log("[Synthesis] Generating synthesis abstract...");
    const abstractResult = await agent.generate(abstractPrompt, {
      structuredOutput: {
        schema: z.object({
          synthesisAbstract: z.string(),
          abstractHighlights: z.object({
            added: z.array(z.string()),
            softened: z.array(z.string()),
            scopeConditions: z.array(z.string()),
          }),
        }),
      },
    });

    const abstractData = (abstractResult as any).object || abstractResult;
    console.log("[Synthesis] Synthesis abstract generated");

    const totalTime = Date.now() - startTime;
    console.log("[Synthesis] ===== Synthesis Generation Complete =====");
    console.log("[Synthesis] Total time:", totalTime, "ms");

    return NextResponse.json({
      claimShifts: claimShiftsData.claimShifts || [],
      summary: claimShiftsData.summary || { removed: 0, rescoped: 0, reframed: 0, weakened: 0 },
      originalAbstract,
      synthesisAbstract: abstractData.synthesisAbstract || "",
      abstractHighlights: abstractData.abstractHighlights || {
        added: [],
        softened: [],
        scopeConditions: [],
      },
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[Synthesis] ===== Synthesis Generation Error =====");
    console.error("[Synthesis] Error after", totalTime, "ms");
    console.error("[Synthesis] Error:", error instanceof Error ? error.message : String(error));
    console.error("[Synthesis] Stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate synthesis",
        claimShifts: [],
        summary: { removed: 0, rescoped: 0, reframed: 0, weakened: 0 },
        originalAbstract: "",
        synthesisAbstract: "",
        abstractHighlights: { added: [], softened: [], scopeConditions: [] },
      },
      { status: 500 }
    );
  }
}

