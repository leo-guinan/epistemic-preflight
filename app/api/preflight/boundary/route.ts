import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const boundaryRequestSchema = z.object({
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
  console.log("[Boundary] ===== Boundary Reframing Started =====");

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
          console.error("[Boundary] Failed to parse claims");
        }
      }

      if (comparatorsData) {
        try {
          comparators = JSON.parse(comparatorsData);
        } catch (e) {
          console.error("[Boundary] Failed to parse comparators");
        }
      }

      if (file && file instanceof File) {
        try {
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            const processed = await processPDF(buffer);
            paperContent = processed.text;
          } else {
            paperContent = buffer.toString("utf-8");
          }
        } catch (error) {
          console.error("[Boundary] Error processing file:", error);
          // Fall back to textContent if file processing fails
          if (textContent) {
            paperContent = textContent;
          } else {
            throw new Error("Failed to process file and no text content provided");
          }
        }
      } else if (textContent) {
        paperContent = textContent;
      } else {
        return NextResponse.json(
          { error: "No file or text content provided" },
          { status: 400 }
        );
      }
    } else {
      const body = await request.json();
      const parsed = boundaryRequestSchema.parse(body);
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

    console.log("[Boundary] Paper content length:", paperContent.length);
    console.log("[Boundary] Claims count:", claims.length);

    const agent = mastra.getAgent("paperAnalysisAgent");

    // Identify boundary shift
    const boundaryPrompt = `Analyze how reframing the epistemic boundary would change this paper's positioning.

Paper content:
${paperContent.substring(0, 20000)}

Core claims:
${claims.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text}`).join("\n")}

Identify how shifting the boundary (e.g., from agent-internal to system-boundary, from private to public transition) would change key aspects.

Return a JSON object with:
- boundaryShifts: array of objects, each with:
  - aspect: the aspect being shifted (e.g., "Focus", "Failure mode", "Intervention")
  - before: how it's currently framed
  - after: how it would be framed after boundary shift
- insight: a short sentence explaining the impact (e.g., "All detected conflicts move off the agent-internal axis when reframed this way.")

Format as valid JSON only.`;

    console.log("[Boundary] Generating boundary shifts...");
    const shiftsResult = await agent.generate(boundaryPrompt, {
      structuredOutput: {
        schema: z.object({
          boundaryShifts: z.array(
            z.object({
              aspect: z.string(),
              before: z.string(),
              after: z.string(),
            })
          ),
          insight: z.string(),
        }),
      },
    });

    const shiftsData = (shiftsResult as any).object || shiftsResult;
    console.log("[Boundary] Shifts generated:", shiftsData.boundaryShifts?.length || 0);

    // Generate boundary clarification section
    const clarificationPrompt = `Write a boundary clarification section that could be added early in the paper.

Boundary shifts:
${shiftsData.boundaryShifts?.map((s: any) => `${s.aspect}: ${s.before} → ${s.after}`).join("\n") || "None"}

The section should:
- Make the boundary reframing legible to reviewers
- Explain where the analysis focuses (the new boundary)
- Be concise (2-3 sentences)

Return a JSON object with:
- boundaryClarification: the section text

Format as valid JSON only.`;

    console.log("[Boundary] Generating boundary clarification...");
    const clarificationResult = await agent.generate(clarificationPrompt, {
      structuredOutput: {
        schema: z.object({
          boundaryClarification: z.string(),
        }),
      },
    });

    const clarificationData = (clarificationResult as any).object || clarificationResult;
    console.log("[Boundary] Clarification generated");

    const totalTime = Date.now() - startTime;
    console.log("[Boundary] ===== Complete =====");
    console.log("[Boundary] Total time:", totalTime, "ms");

    return NextResponse.json({
      boundaryShifts: shiftsData.boundaryShifts || [],
      insight: shiftsData.insight || "",
      boundaryClarification: clarificationData.boundaryClarification || "",
    });
  } catch (error) {
    console.error("[Boundary] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate boundary reframing",
        boundaryShifts: [],
        insight: "",
        boundaryClarification: "",
      },
      { status: 500 }
    );
  }
}

