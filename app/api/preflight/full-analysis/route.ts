import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";

const fullAnalysisRequestSchema = z.object({
  paperContent: z.string().min(1),
  comparators: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperContent, comparators } = fullAnalysisRequestSchema.parse(body);

    const agent = mastra.getAgent("paperAnalysisAgent");

    const prompt = `Perform a full epistemic analysis comparing this paper to existing work.

Paper content:
${paperContent.substring(0, 8000)} ${paperContent.length > 8000 ? '...' : ''}

${comparators && comparators.length > 0 ? `Comparator papers: ${comparators.join(', ')}` : 'No comparator papers provided.'}

Provide a comprehensive analysis with:
1. overlap: Where the paper genuinely overlaps with existing work
2. conflict: Where it directly conflicts
3. novel: Where it's orthogonal or novel
4. risks: Top 3 reviewer risks (array of strings)
5. reframing: 1-2 reframing suggestions (array of strings)

Format your response as valid JSON only.`;

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

    // Handle both Mastra format and AI SDK v5 format
    const analysis = (result as any).object || result;

    return NextResponse.json({
      overlap: analysis?.overlap || "No significant overlaps identified.",
      conflict: analysis?.conflict || "No direct conflicts identified.",
      novel: analysis?.novel || "Novel contributions identified.",
      risks: analysis?.risks || [],
      reframing: analysis?.reframing || [],
    });
  } catch (error) {
    console.error("Full analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to perform full analysis",
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

