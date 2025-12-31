import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const disagreementRequestSchema = z.object({
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
  comparators: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Disagreement] ===== Disagreement Positioning Started =====");

  try {
    const contentType = request.headers.get("content-type") || "";
    let paperContent: string;
    let claims: Array<{
      id: string;
      text: string;
      type: "foundational" | "downstream" | "supporting";
      importance: number;
    }> = [];
    let comparators: string[] = [];

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;
      const claimsData = formData.get("claims") as string | null;
      const comparatorsData = formData.get("comparators") as string | null;

      if (claimsData) {
        try {
          claims = JSON.parse(claimsData);
        } catch (e) {
          console.error("[Disagreement] Failed to parse claims");
        }
      }

      if (comparatorsData) {
        try {
          comparators = JSON.parse(comparatorsData);
        } catch (e) {
          console.error("[Disagreement] Failed to parse comparators");
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
      const parsed = disagreementRequestSchema.parse(body);
      paperContent = parsed.paperContent || "";
      claims = parsed.claims || [];
      comparators = parsed.comparators || [];

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

    console.log("[Disagreement] Paper content length:", paperContent.length);
    console.log("[Disagreement] Claims count:", claims.length);
    console.log("[Disagreement] Comparators:", comparators.length);

    const agent = mastra.getAgent("paperAnalysisAgent");

    // Identify disagreement axes
    const axesPrompt = `Analyze where this paper explicitly disagrees with comparator work.

Paper content:
${paperContent.substring(0, 20000)}

Comparator papers: ${comparators.length > 0 ? comparators.join(", ") : "None specified"}

Core claims:
${claims.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text}`).join("\n")}

Identify the core axes of disagreement. Return a JSON object with:
- disagreementAxes: array of objects, each with:
  - axis: name of the disagreement axis (e.g., "Responsibility Localization")
  - yourPosition: where this paper positions itself
  - comparatorPosition: where comparator work positions itself
  - isSubstantive: boolean (true if substantive disagreement)

Format as valid JSON only.`;

    console.log("[Disagreement] Generating disagreement axes...");
    const axesResult = await agent.generate(axesPrompt, {
      structuredOutput: {
        schema: z.object({
          disagreementAxes: z.array(
            z.object({
              axis: z.string(),
              yourPosition: z.string(),
              comparatorPosition: z.string(),
              isSubstantive: z.boolean(),
            })
          ),
        }),
      },
    });

    const axesData = (axesResult as any).object || axesResult;
    console.log("[Disagreement] Axes generated:", axesData.disagreementAxes?.length || 0);

    // Generate explicit disagreement paragraph
    const paragraphPrompt = `Write an explicit disagreement paragraph that owns the disagreement cleanly.

Disagreement axes:
${axesData.disagreementAxes?.map((a: any) => `- ${a.axis}: ${a.yourPosition} vs ${a.comparatorPosition}`).join("\n") || "None identified"}

The paragraph should:
- State the disagreement explicitly
- Maintain respect for prior work
- Clarify scope and conditions
- Sound deliberate and principled, not dismissive

Return a JSON object with:
- disagreementParagraph: the ready-to-drop paragraph
- highlights: object with arrays:
  - disagreement: phrases showing where disagreement is stated
  - respect: phrases showing where respect is maintained
  - scope: phrases showing where scope is clarified

Format as valid JSON only.`;

    console.log("[Disagreement] Generating disagreement paragraph...");
    const paragraphResult = await agent.generate(paragraphPrompt, {
      structuredOutput: {
        schema: z.object({
          disagreementParagraph: z.string(),
          highlights: z.object({
            disagreement: z.array(z.string()),
            respect: z.array(z.string()),
            scope: z.array(z.string()),
          }),
        }),
      },
    });

    const paragraphData = (paragraphResult as any).object || paragraphResult;
    console.log("[Disagreement] Paragraph generated");

    const totalTime = Date.now() - startTime;
    console.log("[Disagreement] ===== Complete =====");
    console.log("[Disagreement] Total time:", totalTime, "ms");

    return NextResponse.json({
      disagreementAxes: axesData.disagreementAxes || [],
      disagreementParagraph: paragraphData.disagreementParagraph || "",
      highlights: paragraphData.highlights || {
        disagreement: [],
        respect: [],
        scope: [],
      },
    });
  } catch (error) {
    console.error("[Disagreement] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate disagreement positioning",
        disagreementAxes: [],
        disagreementParagraph: "",
        highlights: { disagreement: [], respect: [], scope: [] },
      },
      { status: 500 }
    );
  }
}

