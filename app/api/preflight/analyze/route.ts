import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { z } from "zod";

const analyzeRequestSchema = z.object({
  paperContent: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { paperContent } = analyzeRequestSchema.parse(body);

    const agent = mastra.getAgent("paperAnalysisAgent");

    const prompt = `Analyze this research paper and extract its core claims. 
    
Paper content:
${paperContent.substring(0, 8000)} ${paperContent.length > 8000 ? '...' : ''}

Return a JSON object with:
1. An array of 3-5 core claims, each with:
   - id: unique identifier
   - text: the claim statement
   - type: "foundational", "downstream", or "supporting"
   - importance: number from 1-10
2. riskSignal: a one-line statement if any claim sits at a known disagreement boundary (optional)

Format your response as valid JSON only.`;

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

    // Handle both Mastra format and AI SDK v5 format
    const analysis = (result as any).object || result;

    return NextResponse.json({
      claims: analysis?.claims || [],
      riskSignal: analysis?.riskSignal,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      {
        error: "Failed to analyze paper",
        claims: [],
      },
      { status: 500 }
    );
  }
}

