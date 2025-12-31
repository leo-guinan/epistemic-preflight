/**
 * Script to process PDF papers and generate demo JSON files
 * 
 * Usage: pnpm tsx scripts/process-demo-paper.ts <pdf-path> <demo-id> <title> <authors> <year> <venue>
 * 
 * Example:
 * pnpm tsx scripts/process-demo-paper.ts 1706.03762v7.pdf attention "Attention Is All You Need" "Vaswani et al." 2017 "NeurIPS"
 */

import fs from "fs";
import path from "path";
import { processPDF } from "../lib/pdf-processor";
import { mastra } from "../mastra";
import { z } from "zod";
import type { DemoPaper } from "../lib/demo-data-types";

const DEMO_TYPE_MAP: Record<string, "foundational" | "conflict" | "governance"> = {
  attention: "foundational",
  alignment: "governance",
  "stochastic-parrots": "conflict",
};

async function processPaper(
  pdfPath: string,
  demoId: string,
  title: string,
  authors: string,
  year: number,
  venue: string
): Promise<DemoPaper> {
  console.log(`\n📄 Processing ${title}...`);
  console.log(`   PDF: ${pdfPath}`);
  console.log(`   Demo ID: ${demoId}\n`);

  // Step 1: Extract text from PDF
  console.log("Step 1: Extracting text from PDF...");
  const pdfBuffer = fs.readFileSync(pdfPath);
  const processed = await processPDF(pdfBuffer);
  const paperContent = processed.text;
  console.log(`   ✓ Extracted ${paperContent.length} characters\n`);

  // Step 2: Extract claims
  console.log("Step 2: Extracting core claims...");
  const agent = mastra.getAgent("paperAnalysisAgent");
  
  const truncatedContent = paperContent.length > 50000 
    ? paperContent.substring(0, 50000) + "\n\n[... content truncated for analysis ...]"
    : paperContent;

  const claimsPrompt = `Analyze this research paper and extract its core claims. 
    
Paper content:
${truncatedContent}

Return a JSON object with:
1. An array of 3-5 core claims, each with:
   - id: unique identifier
   - text: the claim statement
   - type: "foundational", "downstream", or "supporting"
   - importance: number from 1-10
2. riskSignal: a one-line statement if any claim sits at a known disagreement boundary (optional)

Format your response as valid JSON only.`;

  const claimsResult = await agent.generate(claimsPrompt, {
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

  const claimsData = (claimsResult as any).object || claimsResult;
  const claims = claimsData.claims || [];
  const riskSignal = claimsData.riskSignal;

  console.log(`   ✓ Extracted ${claims.length} claims`);
  claims.forEach((claim: any, i: number) => {
    console.log(`      ${i + 1}. [${claim.type}] ${claim.text.substring(0, 80)}...`);
  });
  console.log();

  // Step 3: Generate full analysis (without comparators for now)
  console.log("Step 3: Generating full analysis...");
  const analysisPrompt = `Analyze how this paper positions relative to the field.

Paper content:
${truncatedContent}

Core claims:
${claims.map((c: any, i: number) => `${i + 1}. ${c.text} (${c.type}, importance: ${c.importance})`).join("\n")}

Provide:
1. overlap: summary of where this overlaps with existing work
2. conflict: summary of where this conflicts with existing work
3. risks: an array of exactly 3 distinct reviewer risks, each as a separate string

Format as valid JSON only.`;

  const analysisResult = await agent.generate(analysisPrompt, {
    structuredOutput: {
      schema: z.object({
        overlap: z.string().optional(),
        conflict: z.string().optional(),
        risks: z.array(z.string()).length(3),
      }),
    },
  });

  const analysisData = (analysisResult as any).object || analysisResult;
  
  // Ensure we have exactly 3 risks
  let risks = analysisData.risks || [];
  if (risks.length === 1 && typeof risks[0] === "string") {
    // Split single risk string into multiple if needed
    const riskText = risks[0];
    const sentences = riskText.split(/[.!?]+/).filter(s => s.trim().length > 20);
    risks = sentences.slice(0, 3);
    if (risks.length < 3) {
      risks = [riskText, riskText, riskText]; // Fallback
    }
  }
  while (risks.length < 3) {
    risks.push("Reviewer may question the paper's positioning relative to existing work.");
  }
  risks = risks.slice(0, 3);

  console.log(`   ✓ Generated analysis with ${risks.length} reviewer risks\n`);

  // Step 4: Generate synthesis preview
  console.log("Step 4: Generating synthesis preview...");
  
  // Extract abstract with better pattern matching
  let originalAbstract = "";
  const abstractPatterns = [
    // Pattern 1: "Abstract" followed by text until next section
    /abstract\s*\n\s*([\s\S]{100,2000}?)(?:\n\s*(?:1\.|introduction|introduction:|background|keywords|index terms|ccs concepts))/i,
    // Pattern 2: "Abstract" with colon
    /abstract\s*:\s*\n?\s*([\s\S]{100,2000}?)(?:\n\s*(?:1\.|introduction|keywords|index terms))/i,
    // Pattern 3: Just look for "Abstract" and take next 2000 chars
    /abstract\s*\n\s*([\s\S]{100,2000})/i,
  ];
  
  for (const pattern of abstractPatterns) {
    const match = paperContent.match(pattern);
    if (match && match[1]) {
      originalAbstract = match[1]
        .trim()
        .replace(/\s+/g, " ") // Normalize whitespace
        .substring(0, 1500); // Limit to reasonable length
      if (originalAbstract.length > 100) {
        break;
      }
    }
  }
  
  // Fallback: use first substantial paragraph
  if (!originalAbstract || originalAbstract.length < 100) {
    const firstParagraph = paperContent
      .split(/\n\s*\n/)
      .find((p) => p.trim().length > 200 && p.trim().length < 1500);
    if (firstParagraph) {
      originalAbstract = firstParagraph.trim().substring(0, 1500);
    } else {
      originalAbstract = paperContent.substring(0, 800).trim();
      // Try to end at a sentence boundary
      const lastPeriod = originalAbstract.lastIndexOf(".");
      if (lastPeriod > 200) {
        originalAbstract = originalAbstract.substring(0, lastPeriod + 1);
      }
    }
  }
  
  console.log(`   ✓ Extracted abstract (${originalAbstract.length} chars)`);

  const synthesisPrompt = `You are analyzing how core claims would shift under a synthesis framing.

Current claims:
${claims.map((c: any, i: number) => `Claim ${String.fromCharCode(65 + i)} (ID: ${c.id}): ${c.text}`).join("\n")}

Paper abstract:
${originalAbstract}

Generate a synthesis reframing that:
- Preserves all core claims
- Shifts responsibility localization to boundaries
- Adds scope conditions where appropriate
- Softens absolutes without weakening the argument

Return:
1. claimShifts: array of objects with claimId, claimLabel ("Claim A", etc.), before, after
2. synthesisAbstract: revised abstract with boundary framing
3. abstractHighlights: { added: [], softened: [], scopeConditions: [] }
4. summary: { rescoped: number, reframed: number, weakened: number }

Format as valid JSON only.`;

  const synthesisResult = await agent.generate(synthesisPrompt, {
    structuredOutput: {
      schema: z.object({
        claimShifts: z.array(
          z.object({
            claimId: z.string(),
            claimLabel: z.string(),
            before: z.string(),
            after: z.string(),
          })
        ),
        synthesisAbstract: z.string(),
        abstractHighlights: z.object({
          added: z.array(z.string()),
          softened: z.array(z.string()),
          scopeConditions: z.array(z.string()),
        }),
        summary: z.object({
          rescoped: z.number(),
          reframed: z.number(),
          weakened: z.number(),
        }),
      }),
    },
  });

  const synthesisData = (synthesisResult as any).object || synthesisResult;
  console.log(`   ✓ Generated synthesis with ${synthesisData.claimShifts?.length || 0} claim shifts\n`);

  // Step 5: Assemble demo paper object
  const demoPaper: DemoPaper = {
    id: demoId,
    title,
    authors,
    year,
    venue,
    description: getDescription(demoId),
    abstract: originalAbstract,
    demoType: DEMO_TYPE_MAP[demoId] || "foundational",
    keyInsights: getKeyInsights(demoId),
    featuredMoment: getFeaturedMoment(demoId),
    coreClaims: claims,
    riskSignal: riskSignal || undefined,
    fullAnalysis: {
      overlap: analysisData.overlap
        ? {
            summary: analysisData.overlap,
            details: [analysisData.overlap],
          }
        : undefined,
      conflict: analysisData.conflict
        ? {
            summary: analysisData.conflict,
            details: [analysisData.conflict],
          }
        : undefined,
      risks,
    },
    synthesisPreview: {
      claimShifts: synthesisData.claimShifts || [],
      originalAbstract,
      synthesisAbstract: synthesisData.synthesisAbstract || originalAbstract,
      abstractHighlights: synthesisData.abstractHighlights || {
        added: [],
        softened: [],
        scopeConditions: [],
      },
      summary: synthesisData.summary || {
        rescoped: 0,
        reframed: 0,
        weakened: 0,
      },
    },
  };

  return demoPaper;
}

function getDescription(demoId: string): string {
  const descriptions: Record<string, string> = {
    attention:
      "The paper that birthed the transformer architecture and modern NLP. This demo shows how to reverse-engineer a field's origin myth by identifying the foundational claims that created an entire research paradigm.",
    alignment:
      "Papers on RLHF and Constitutional AI represent where responsibility gets blurry in AI governance. See how claims shift from 'models are dangerous' to 'governance is solved' and where accountability gets implicitly transferred.",
  };
  return descriptions[demoId] || "";
}

function getKeyInsights(demoId: string): string[] {
  const insights: Record<string, string[]> = {
    attention: [
      "Shows how a few foundational claims can birth an entire research paradigm",
      "Demonstrates dependency graph: which claims collapse if attention ≠ sufficient?",
      "Reveals silent assumptions about data scale, compute, and task distribution",
    ],
    alignment: [
      "Shows how responsibility gets implicitly transferred to reward models and annotators",
      "Demonstrates claim drift from 'models are dangerous' to 'governance is solved'",
      "Illustrates where accountability becomes ambiguous: model? trainer? deployer? user?",
    ],
  };
  return insights[demoId] || [];
}

function getFeaturedMoment(demoId: string) {
  const moments: Record<string, any> = {
    attention: {
      title: "The Origin Myth Decomposed",
      description:
        "See how this paper only really has 2-3 load-bearing claims. Everything else is downstream. This demo shows that we understand foundations better than citation counts do.",
      type: "claim-extraction" as const,
    },
    alignment: {
      title: "Responsibility Localization Shift",
      description:
        "Watch how claims shift from agent-level ('models are dangerous') to boundary-level ('governance boundaries must be enforced'). This reframing preserves all concerns while clarifying where accountability actually lives.",
      type: "boundary" as const,
    },
  };
  return moments[demoId];
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length < 6) {
    console.error("Usage: pnpm tsx scripts/process-demo-paper.ts <pdf-path> <demo-id> <title> <authors> <year> <venue>");
    console.error("\nExample:");
    console.error('  pnpm tsx scripts/process-demo-paper.ts 1706.03762v7.pdf attention "Attention Is All You Need" "Vaswani et al." 2017 "NeurIPS"');
    process.exit(1);
  }

  const [pdfPath, demoId, title, authors, yearStr, venue] = args;
  const year = parseInt(yearStr, 10);

  if (!fs.existsSync(pdfPath)) {
    console.error(`Error: PDF file not found: ${pdfPath}`);
    process.exit(1);
  }

  try {
    const demoPaper = await processPaper(pdfPath, demoId, title, authors, year, venue);

    // Save to JSON file
    const outputPath = path.join(process.cwd(), "data", "demos", `${demoId}.json`);
    fs.writeFileSync(outputPath, JSON.stringify(demoPaper, null, 2));

    console.log(`\n✅ Demo paper saved to: ${outputPath}`);
    console.log(`\n📊 Summary:`);
    console.log(`   - Claims: ${demoPaper.coreClaims.length}`);
    console.log(`   - Reviewer Risks: ${demoPaper.fullAnalysis.risks.length}`);
    console.log(`   - Synthesis Claim Shifts: ${demoPaper.synthesisPreview?.claimShifts.length || 0}`);
  } catch (error) {
    console.error("\n❌ Error processing paper:", error);
    process.exit(1);
  }
}

main();

