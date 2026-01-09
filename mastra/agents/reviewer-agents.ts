import { Agent } from "@mastra/core/agent";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";
import type { VenueSpec, VenueIntake, ReviewerReport, MetaReviewerReport } from "@/lib/venue-spec-types";

// Lazy initialization of OpenAI client
const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OpenAI API key is missing");
  }
  return createOpenAI({ apiKey });
};

// Reviewer 1: Methods & Validity (Evidence Hawk)
export const reviewer1Agent = new Agent({
  id: "reviewer1Agent",
  name: "Reviewer 1: Methods & Validity",
  instructions: `
    You are a rigorous peer reviewer specializing in methodological validity and evidence quality.
    Your role is to evaluate whether the paper's claims are supported by appropriate evidence.
    
    Focus on:
    - Experimental design and rigor
    - Statistical validity
    - Reproducibility concerns
    - Evidence-to-claim alignment
    - Missing controls or baselines
    - Sample sizes and generalizability
    
    Be direct but constructive. Identify what evidence is missing or weak.
  `,
  model: () => {
    const openai = getOpenAIClient();
    return openai("gpt-4o");
  },
});

// Reviewer 2: Related Work & Novelty (Prior Art Hawk)
export const reviewer2Agent = new Agent({
  id: "reviewer2Agent",
  name: "Reviewer 2: Related Work & Novelty",
  instructions: `
    You are a peer reviewer specializing in literature coverage and novelty assessment.
    Your role is to evaluate whether the paper properly situates itself in the literature and makes a genuine contribution.
    
    Focus on:
    - Missing citations to key prior work
    - Overstated novelty claims
    - Insufficient differentiation from existing approaches
    - Related work depth and accuracy
    - Positioning relative to the field
    
    Be thorough. Identify what prior work should be cited and how the contribution differs.
  `,
  model: () => {
    const openai = getOpenAIClient();
    return openai("gpt-4o");
  },
});

// Reviewer 3: Clarity & Framing (Communication + Scope Policing)
export const reviewer3Agent = new Agent({
  id: "reviewer3Agent",
  name: "Reviewer 3: Clarity & Framing",
  instructions: `
    You are a peer reviewer specializing in clarity, communication, and scope management.
    Your role is to evaluate whether the paper is clear, well-framed, and appropriately scoped.
    
    Focus on:
    - Writing clarity and structure
    - Claim precision and scope
    - Unclear operationalizations
    - Overly broad or narrow framing
    - Missing definitions or assumptions
    - Audience appropriateness
    
    Be constructive. Help the authors communicate their contribution more clearly.
  `,
  model: () => {
    const openai = getOpenAIClient();
    return openai("gpt-4o");
  },
});

// Meta-Reviewer / Area Chair Agent
export const metaReviewerAgent = new Agent({
  id: "metaReviewerAgent",
  name: "Meta-Reviewer / Area Chair",
  instructions: `
    You are an area chair synthesizing multiple reviewer reports into a coherent decision.
    Your role is to identify consensus, highlight key disagreements, and provide actionable guidance.
    
    Focus on:
    - Finding agreement across reviewers
    - Identifying where reviewers disagree and why
    - Prioritizing the most critical changes
    - Assessing overall venue fit
    - Providing decision likelihood based on current state
    
    Be strategic. Help authors understand what must be fixed vs. what is optional.
  `,
  model: () => {
    const openai = getOpenAIClient();
    return openai("gpt-4o");
  },
});

// Reviewer report schema
export const reviewerReportSchema = z.object({
  summaryIn3Sentences: z.string(),
  mainContribution: z.string(),
  strengths: z.array(z.string()).length(3),
  weaknesses: z.array(z.string()).length(3),
  questionsForAuthors: z.array(z.string()).length(5),
  requiredChanges: z.array(
    z.object({
      priority: z.number().min(1).max(5),
      description: z.string(),
      claimId: z.string().optional(),
      sectionId: z.string().optional(),
    })
  ),
  scoreBreakdown: z.object({
    novelty: z.number().min(1).max(10),
    validity: z.number().min(1).max(10),
    clarity: z.number().min(1).max(10),
    impact: z.number().min(1).max(10),
    fit: z.number().min(1).max(10),
  }),
  recommendation: z.enum(["accept", "weak-accept", "weak-reject", "reject"]),
  confidence: z.number().min(0).max(1),
  claimActions: z.array(
    z.object({
      claimId: z.string().optional(),
      action: z.enum([
        "narrow",
        "scope",
        "add-boundary",
        "needs-empirical-test",
        "missing-prior-art",
        "unclear-operationalization",
        "conflates-levels",
      ]),
      description: z.string(),
    })
  ),
});

// Meta-reviewer report schema
export const metaReviewerReportSchema = z.object({
  consensus: z.object({
    agreement: z.string(),
    disagreement: z.string(),
  }),
  top2Changes: z.array(z.string()).length(2),
  finalDecisionLikelihood: z.object({
    accept: z.number().min(0).max(1),
    weakAccept: z.number().min(0).max(1),
    weakReject: z.number().min(0).max(1),
    reject: z.number().min(0).max(1),
  }),
  suggestedResubmissionTargets: z.array(z.string()).optional(),
  venueFitScorecard: z.object({
    overallFit: z.number().min(0).max(1),
    reasons: z.array(z.string()),
  }),
});

