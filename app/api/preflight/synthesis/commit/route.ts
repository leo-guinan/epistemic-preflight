import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";
import crypto from "crypto";

const commitPreviewRequestSchema = z.object({
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
  console.log("[Commit Preview] ===== Commit Preview Generation Started =====");
  console.log("[Commit Preview] Timestamp:", new Date().toISOString());

  try {
    const contentType = request.headers.get("content-type") || "";
    console.log("[Commit Preview] Content-Type:", contentType);

    let paperContent: string;
    let claims: Array<{
      id: string;
      text: string;
      type: "foundational" | "downstream" | "supporting";
      importance: number;
    }> = [];

    if (contentType.includes("multipart/form-data")) {
      console.log("[Commit Preview] Processing FormData...");
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const textContent = formData.get("paperContent") as string | null;
      const claimsData = formData.get("claims") as string | null;

      if (claimsData) {
        try {
          claims = JSON.parse(claimsData);
        } catch (e) {
          console.error("[Commit Preview] Failed to parse claims:", e);
        }
      }

      if (file && file instanceof File) {
        try {
          console.log("[Commit Preview] Processing file:", file.name);
          const arrayBuffer = await file.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
            const processed = await processPDF(buffer);
            paperContent = processed.text;
          } else {
            paperContent = buffer.toString("utf-8");
          }
        } catch (error) {
          console.error("[Synthesis Commit] Error processing file:", error);
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
      console.log("[Commit Preview] Processing JSON...");
      const body = await request.json();
      const parsed = commitPreviewRequestSchema.parse(body);
      
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

    console.log("[Commit Preview] Paper content length:", paperContent.length);
    console.log("[Commit Preview] Claims count:", claims.length);

    // Generate synthesis case ID
    const synthesisCaseId = crypto.randomBytes(16).toString("hex");
    console.log("[Commit Preview] Synthesis case ID:", synthesisCaseId);

    const agent = mastra.getAgent("paperAnalysisAgent");
    console.log("[Commit Preview] Agent retrieved");

    // Extract abstract
    const abstractMatch = paperContent.match(
      /(?:abstract|summary)[:\s]*\n?\s*([^\n]{50,1000})/i
    );
    const originalAbstract = abstractMatch
      ? abstractMatch[1].trim()
      : paperContent.substring(0, 500).trim();

    // Generate full commit preview with detailed diffs
    const commitPreviewPrompt = `Generate a complete commit preview for applying a boundary-centered synthesis framing to this paper.

Paper content (first 50000 chars):
${paperContent.substring(0, 50000)}${paperContent.length > 50000 ? '...' : ''}

Current claims:
${claims.map((c, i) => `${String.fromCharCode(65 + i)}. ${c.text} (${c.type}, importance: ${c.importance})`).join("\n")}

Original abstract:
${originalAbstract}

Generate a comprehensive commit preview that includes:

1. changeSummary: object with counts:
   - reframed: number of claims reframed
   - rescoped: number of claims re-scoped
   - abstractUpdated: boolean
   - boundaryParagraphs: number of new boundary paragraphs

2. claimDiffs: array of objects, each with:
   - claimId: the claim id
   - claimLabel: "Claim A", "Claim B", etc.
   - before: the FULL original claim text (not shortened)
   - after: the FULL reframed claim text
   - changeType: "reframed" | "re-scoped" | "unchanged"
   - rationale: a clear explanation of why this change was made (2-3 sentences)

3. sectionInserts: array of objects, each with:
   - section: where this paragraph should be inserted (e.g., "Introduction", "Discussion")
   - content: the full paragraph text
   - badge: a short label (e.g., "New paragraph — boundary framing")

4. abstractDiff: object with:
   - original: the original abstract
   - synthesized: the rewritten abstract with synthesis framing
   - highlights: object with arrays:
     - added: phrases showing added boundary language
     - softened: phrases showing softened absolutes
     - scopeConditions: phrases showing explicit scope conditions

5. commitMessage: suggested commit message (e.g., "Apply boundary-centered synthesis framing")

6. commitNotes: suggested commit notes explaining the reframing

For claim diffs, provide the FULL claim text in both before and after, not just summaries.
For section inserts, provide complete, ready-to-insert paragraphs.
For abstract, ensure the synthesized version is complete and coherent.

Format as valid JSON only.`;

    console.log("[Commit Preview] Generating full commit preview...");
    const result = await agent.generate(commitPreviewPrompt, {
      structuredOutput: {
        schema: z.object({
          changeSummary: z.object({
            reframed: z.number(),
            rescoped: z.number(),
            abstractUpdated: z.boolean(),
            boundaryParagraphs: z.number(),
          }),
          claimDiffs: z.array(
            z.object({
              claimId: z.string(),
              claimLabel: z.string(),
              before: z.string(),
              after: z.string(),
              changeType: z.enum(["reframed", "re-scoped", "unchanged"]),
              rationale: z.string(),
            })
          ),
          sectionInserts: z.array(
            z.object({
              section: z.string(),
              content: z.string(),
              badge: z.string(),
            })
          ),
          abstractDiff: z.object({
            original: z.string(),
            synthesized: z.string(),
            highlights: z.object({
              added: z.array(z.string()),
              softened: z.array(z.string()),
              scopeConditions: z.array(z.string()),
            }),
          }),
          commitMessage: z.string(),
          commitNotes: z.string(),
        }),
      },
    });

    const preview = (result as any).object || result;
    console.log("[Commit Preview] Commit preview generated");
    console.log("[Commit Preview] - Claim diffs:", preview.claimDiffs?.length || 0);
    console.log("[Commit Preview] - Section inserts:", preview.sectionInserts?.length || 0);

    const totalTime = Date.now() - startTime;
    console.log("[Commit Preview] ===== Commit Preview Complete =====");
    console.log("[Commit Preview] Total time:", totalTime, "ms");

    return NextResponse.json({
      ...preview,
      synthesisCaseId,
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[Commit Preview] ===== Commit Preview Error =====");
    console.error("[Commit Preview] Error after", totalTime, "ms");
    console.error("[Commit Preview] Error:", error instanceof Error ? error.message : String(error));
    console.error("[Commit Preview] Stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate commit preview",
      },
      { status: 500 }
    );
  }
}

