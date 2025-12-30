import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";
import { processPDF } from "@/lib/pdf-processor";

const rewriteRequestSchema = z.object({
  paperContent: z.string().optional(),
  file: z.string().optional(),
  fileName: z.string().optional(),
  claimId: z.string(),
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
  console.log("[Narrowing Rewrite] ===== Claim Rewrite Started =====");

  try {
    const contentType = request.headers.get("content-type") || "";
    let paperContent: string;
    let claimId: string;
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
      claimId = (formData.get("claimId") as string) || "";

      if (claimsData) {
        try {
          claims = JSON.parse(claimsData);
        } catch (e) {
          console.error("[Narrowing Rewrite] Failed to parse claims");
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
      const parsed = rewriteRequestSchema.parse(body);
      paperContent = parsed.paperContent || "";
      claimId = parsed.claimId;
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

    const selectedClaim = claims.find((c) => c.id === claimId);
    if (!selectedClaim) {
      throw new Error("Claim not found");
    }

    console.log("[Narrowing Rewrite] Rewriting claim:", claimId);
    console.log("[Narrowing Rewrite] Original claim:", selectedClaim.text);

    const agent = mastra.getAgent("paperAnalysisAgent");

    const rewritePrompt = `Narrow this claim to reduce reviewer risk while preserving the core contribution.

Original claim:
${selectedClaim.text}

Context from paper:
${paperContent.substring(0, 10000)}

The narrowed version should:
- Reduce scope/absoluteness
- Add explicit conditions or limitations
- Preserve the core contribution
- Lower reviewer risk
- Sound professional, not defensive

Return a JSON object with:
- rewrite: object with:
  - claimId: the claim id
  - before: the original claim text
  - after: the narrowed claim text
  - impact: a short explanation of how contribution is preserved and risk is reduced

Format as valid JSON only.`;

    console.log("[Narrowing Rewrite] Generating rewrite...");
    const rewriteResult = await agent.generate(rewritePrompt, {
      structuredOutput: {
        schema: z.object({
          rewrite: z.object({
            claimId: z.string(),
            before: z.string(),
            after: z.string(),
            impact: z.string(),
          }),
        }),
      },
    });

    const rewriteData = (rewriteResult as any).object || rewriteResult;
    console.log("[Narrowing Rewrite] Rewrite generated");

    const totalTime = Date.now() - startTime;
    console.log("[Narrowing Rewrite] ===== Complete =====");
    console.log("[Narrowing Rewrite] Total time:", totalTime, "ms");

    return NextResponse.json({
      rewrite: rewriteData.rewrite || null,
    });
  } catch (error) {
    console.error("[Narrowing Rewrite] Error:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to generate claim rewrite",
        rewrite: null,
      },
      { status: 500 }
    );
  }
}

