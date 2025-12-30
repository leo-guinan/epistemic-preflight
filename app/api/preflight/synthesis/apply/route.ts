import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import crypto from "crypto";

const applyCommitSchema = z.object({
  commitMessage: z.string(),
  commitNotes: z.string().optional(),
  synthesisCaseId: z.string(),
  claimDiffs: z.array(
    z.object({
      claimId: z.string(),
      claimLabel: z.string(),
      before: z.string(),
      after: z.string(),
      changeType: z.string(),
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
});

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  console.log("[Apply Commit] ===== Commit Application Started =====");
  console.log("[Apply Commit] Timestamp:", new Date().toISOString());

  try {
    const body = await request.json();
    const parsed = applyCommitSchema.parse(body);

    console.log("[Apply Commit] Commit message:", parsed.commitMessage);
    console.log("[Apply Commit] Synthesis case ID:", parsed.synthesisCaseId);
    console.log("[Apply Commit] Claim diffs:", parsed.claimDiffs.length);
    console.log("[Apply Commit] Section inserts:", parsed.sectionInserts.length);

    // Generate commit ID
    const commitId = crypto.randomBytes(16).toString("hex");
    console.log("[Apply Commit] Generated commit ID:", commitId);

    // In a real implementation, you would:
    // 1. Store the commit in a database with all metadata
    // 2. Track original text hashes for reversibility
    // 3. Store claim IDs affected
    // 4. Store rationale snippets
    // 5. Generate a patch/diff file
    // 6. Update the paper content with the changes

    // For now, we'll return the commit ID and metadata
    // In production, this would be stored in a database

    const commitRecord = {
      commitId,
      synthesisCaseId: parsed.synthesisCaseId,
      timestamp: new Date().toISOString(),
      commitMessage: parsed.commitMessage,
      commitNotes: parsed.commitNotes || "",
      claimIdsAffected: parsed.claimDiffs.map((d) => d.claimId),
      claimDiffs: parsed.claimDiffs.map((d) => ({
        claimId: d.claimId,
        originalHash: crypto.createHash("sha256").update(d.before).digest("hex").substring(0, 16),
        modifiedHash: crypto.createHash("sha256").update(d.after).digest("hex").substring(0, 16),
        rationale: d.rationale,
      })),
      sectionInserts: parsed.sectionInserts,
      abstractChanged: parsed.abstractDiff.original !== parsed.abstractDiff.synthesized,
    };

    console.log("[Apply Commit] Commit record created:");
    console.log("[Apply Commit] - Commit ID:", commitRecord.commitId);
    console.log("[Apply Commit] - Claims affected:", commitRecord.claimIdsAffected.length);
    console.log("[Apply Commit] - Abstract changed:", commitRecord.abstractChanged);

    // TODO: Store commitRecord in database
    // await db.commits.insert(commitRecord);

    const totalTime = Date.now() - startTime;
    console.log("[Apply Commit] ===== Commit Application Complete =====");
    console.log("[Apply Commit] Total time:", totalTime, "ms");

    return NextResponse.json({
      commitId,
      synthesisCaseId: parsed.synthesisCaseId,
      timestamp: commitRecord.timestamp,
      message: "Commit applied successfully",
    });
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error("[Apply Commit] ===== Commit Application Error =====");
    console.error("[Apply Commit] Error after", totalTime, "ms");
    console.error("[Apply Commit] Error:", error instanceof Error ? error.message : String(error));
    console.error("[Apply Commit] Stack:", error instanceof Error ? error.stack : "No stack trace");

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to apply commit",
      },
      { status: 500 }
    );
  }
}

