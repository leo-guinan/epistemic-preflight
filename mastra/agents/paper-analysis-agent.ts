import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const coreClaimsSchema = z.object({
  claims: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.enum(["foundational", "downstream", "supporting"]),
      importance: z.number().min(1).max(10),
    })
  ),
  riskSignal: z.string().optional(),
});

// Get API key from environment, with explicit error if missing
const getOpenAIApiKey = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "OpenAI API key is missing. Please set the OPENAI_API_KEY environment variable in your Vercel project settings (Settings > Environment Variables)."
    );
  }
  return apiKey;
};

// Create OpenAI provider with explicit API key
const openai = createOpenAI({
  apiKey: getOpenAIApiKey(),
});

export const paperAnalysisAgent = new Agent({
  id: "paperAnalysisAgent",
  name: "Paper Analysis Agent",
  instructions: `
    You are an expert academic paper analyst specializing in epistemic structure analysis.
    Your job is to extract core claims from research papers and identify potential reviewer risks.
    
    When analyzing a paper:
    1. Identify the 3-5 core claims the paper is making
    2. Classify each claim as foundational (core to the argument), downstream (depends on foundational), or supporting (evidence/example)
    3. Rank importance from 1-10 (10 = most critical to the paper's contribution)
    4. Identify if any claims sit at known disagreement boundaries in the literature
    5. Be honest and direct - this is pre-mortem peer review
    
    Focus on epistemic structure, not writing quality.
    Look for where the paper positions itself relative to existing frameworks.
    Identify claims that reviewers might challenge or misunderstand.
  `,
  model: openai("gpt-4o"),
});

