import { NextRequest, NextResponse } from "next/server";
import { mastra } from "@/mastra";
import { loadVenueSpec } from "@/lib/venue-loader";
import { reviewerReportSchema, metaReviewerReportSchema } from "@/mastra/agents/reviewer-agents";
import type { VenueIntake, ReviewerReport, MetaReviewerReport } from "@/lib/venue-spec-types";
import { z } from "zod";

const venueReviewRequestSchema = z.object({
  paperContent: z.string(),
  claims: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      type: z.string(),
      importance: z.number(),
    })
  ),
  venueId: z.string(),
  venueIntake: z.object({
    contributionType: z.string(),
    evidenceTypeAvailable: z.array(z.string()),
    claimsAre: z.string(),
    targetAudience: z.string(),
    riskTolerance: z.string(),
    whatsNew: z.string(),
    reviewerAttacks: z.string(),
  }),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validated = venueReviewRequestSchema.parse(body);

    const { paperContent, claims, venueId, venueIntake } = validated;

    // Load venue spec
    const venueSpec = loadVenueSpec(venueId);
    if (!venueSpec) {
      return NextResponse.json(
        { error: `Venue ${venueId} not found` },
        { status: 404 }
      );
    }

    // Truncate content if needed
    const maxLength = 50000;
    const truncatedContent = paperContent.length > maxLength
      ? paperContent.substring(0, maxLength) + "\n\n[Content truncated...]"
      : paperContent;

    // Format claims for prompt
    const claimsText = claims
      .map((c, i) => `Claim ${String.fromCharCode(65 + i)}: ${c.text}`)
      .join("\n");

    // Get reviewer agents
    const reviewer1 = mastra.getAgent("reviewer1Agent");
    const reviewer2 = mastra.getAgent("reviewer2Agent");
    const reviewer3 = mastra.getAgent("reviewer3Agent");
    const metaReviewer = mastra.getAgent("metaReviewerAgent");

    // Build reviewer prompts with venue context
    const venueContext = `
VENUE: ${venueSpec.name} (${venueSpec.fieldFamily})
Contribution Norms: ${venueSpec.contributionNorms.publishableUnits.join("; ")}
Common Rejection Reasons: ${venueSpec.commonRejectionReasons.join("; ")}
Expected Evidence: ${JSON.stringify(venueSpec.expectedEvidence)}
Methods Culture: ${venueSpec.methodsCulture}
Tone: ${venueSpec.tonePreferences.formality}, Speculative Tolerance: ${venueSpec.tonePreferences.speculativeTolerance}
`;

    const authorContext = `
AUTHOR INTENT:
- Contribution Type: ${venueIntake.contributionType}
- Evidence Available: ${venueIntake.evidenceTypeAvailable.join(", ")}
- Claims are: ${venueIntake.claimsAre}
- Target Audience: ${venueIntake.targetAudience}
- Risk Tolerance: ${venueIntake.riskTolerance}
- What's New: ${venueIntake.whatsNew}
- Expected Reviewer Attacks: ${venueIntake.reviewerAttacks}
`;

    // Reviewer 1: Methods & Validity
    const reviewer1Prompt = `Review this paper for methodological validity and evidence quality.

${venueContext}
${authorContext}

PAPER CONTENT:
${truncatedContent}

CORE CLAIMS:
${claimsText}

Provide a comprehensive review focusing on:
- Experimental design and rigor
- Statistical validity
- Reproducibility concerns
- Evidence-to-claim alignment
- Missing controls or baselines
- Sample sizes and generalizability

Format your response as valid JSON matching the reviewer report schema.`;

    // Reviewer 2: Related Work & Novelty
    const reviewer2Prompt = `Review this paper for literature coverage and novelty.

${venueContext}
${authorContext}

PAPER CONTENT:
${truncatedContent}

CORE CLAIMS:
${claimsText}

Provide a comprehensive review focusing on:
- Missing citations to key prior work
- Overstated novelty claims
- Insufficient differentiation from existing approaches
- Related work depth and accuracy
- Positioning relative to the field

Format your response as valid JSON matching the reviewer report schema.`;

    // Reviewer 3: Clarity & Framing
    const reviewer3Prompt = `Review this paper for clarity, communication, and scope.

${venueContext}
${authorContext}

PAPER CONTENT:
${truncatedContent}

CORE CLAIMS:
${claimsText}

Provide a comprehensive review focusing on:
- Writing clarity and structure
- Claim precision and scope
- Unclear operationalizations
- Overly broad or narrow framing
- Missing definitions or assumptions
- Audience appropriateness

Format your response as valid JSON matching the reviewer report schema.`;

    // Run reviewers in parallel
    console.log("[Venue Review] Starting reviewer panel...");
    const [r1Result, r2Result, r3Result] = await Promise.all([
      reviewer1.generate(reviewer1Prompt, {
        structuredOutput: { schema: reviewerReportSchema },
      }),
      reviewer2.generate(reviewer2Prompt, {
        structuredOutput: { schema: reviewerReportSchema },
      }),
      reviewer3.generate(reviewer3Prompt, {
        structuredOutput: { schema: reviewerReportSchema },
      }),
    ]);

    const reviewerReports: ReviewerReport[] = [
      {
        reviewerId: "r1",
        reviewerName: "Reviewer 1: Methods & Validity",
        ...(r1Result as any).object,
      },
      {
        reviewerId: "r2",
        reviewerName: "Reviewer 2: Related Work & Novelty",
        ...(r2Result as any).object,
      },
      {
        reviewerId: "r3",
        reviewerName: "Reviewer 3: Clarity & Framing",
        ...(r3Result as any).object,
      },
    ];

    // Meta-reviewer synthesis
    const metaReviewerPrompt = `Synthesize these three reviewer reports into a coherent decision.

${venueContext}

REVIEWER REPORTS:

Reviewer 1 (Methods & Validity):
${JSON.stringify(reviewerReports[0], null, 2)}

Reviewer 2 (Related Work & Novelty):
${JSON.stringify(reviewerReports[1], null, 2)}

Reviewer 3 (Clarity & Framing):
${JSON.stringify(reviewerReports[2], null, 2)}

Provide a meta-review that:
- Identifies consensus and disagreement
- Prioritizes the top 2 most critical changes
- Assesses overall venue fit
- Provides decision likelihood
- Suggests alternative venues if poor fit

Format your response as valid JSON matching the meta-reviewer report schema.`;

    const metaResult = await metaReviewer.generate(metaReviewerPrompt, {
      structuredOutput: { schema: metaReviewerReportSchema },
    });

    const metaReviewerReport: MetaReviewerReport = {
      ...(metaResult as any).object,
    };

    // Calculate decision forecast from reviewer recommendations
    const recommendations = reviewerReports.map((r) => r.recommendation);
    const decisionForecast = {
      accept: recommendations.filter((r) => r === "accept").length / 3,
      weakAccept: recommendations.filter((r) => r === "weak-accept").length / 3,
      weakReject: recommendations.filter((r) => r === "weak-reject").length / 3,
      reject: recommendations.filter((r) => r === "reject").length / 3,
    };

    // Combine all required changes and prioritize
    const allRequiredChanges = reviewerReports.flatMap((report, idx) =>
      report.requiredChanges.map((change) => ({
        ...change,
        reviewerId: `r${idx + 1}`,
      }))
    );

    // Sort by priority and deduplicate
    const topChanges = allRequiredChanges
      .sort((a, b) => a.priority - b.priority)
      .slice(0, 5)
      .map((change, idx) => ({
        ...change,
        rank: idx + 1,
      }));

    return NextResponse.json({
      reviewerReports,
      metaReviewerReport,
      decisionForecast,
      topChanges,
      venueFitScorecard: metaReviewerReport.venueFitScorecard,
    });
  } catch (error) {
    console.error("[Venue Review] Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid request", details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate review" },
      { status: 500 }
    );
  }
}

