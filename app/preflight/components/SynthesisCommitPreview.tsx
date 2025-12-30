"use client";

import { useState, useEffect } from "react";
import styles from "./SynthesisCommitPreview.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface ClaimDiff {
  claimId: string;
  claimLabel: string;
  before: string;
  after: string;
  changeType: "reframed" | "re-scoped" | "unchanged";
  rationale: string;
}

interface SectionInsert {
  section: string;
  content: string;
  badge: string;
}

interface CommitPreview {
  changeSummary: {
    reframed: number;
    rescoped: number;
    abstractUpdated: boolean;
    boundaryParagraphs: number;
  };
  claimDiffs: ClaimDiff[];
  sectionInserts: SectionInsert[];
  abstractDiff: {
    original: string;
    synthesized: string;
    highlights: {
      added: string[];
      softened: string[];
      scopeConditions: string[];
    };
  };
  commitMessage: string;
  commitNotes: string;
  synthesisCaseId: string;
}

interface SynthesisCommitPreviewProps {
  claims: Claim[];
  paperContent: string;
  paperFile?: File;
  onCommit: (commitId: string) => void;
  onCancel: () => void;
}

export function SynthesisCommitPreview({
  claims,
  paperContent,
  paperFile,
  onCommit,
  onCancel,
}: SynthesisCommitPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [preview, setPreview] = useState<CommitPreview | null>(null);
  const [editableCommitMessage, setEditableCommitMessage] = useState("");
  const [editableCommitNotes, setEditableCommitNotes] = useState("");
  const [expandedClaims, setExpandedClaims] = useState<Set<string>>(new Set());

  useEffect(() => {
    const generateCommitPreview = async () => {
      setIsLoading(true);
      console.log("[CommitPreview] Generating commit preview...");

      try {
        let response: Response;

        if (paperFile) {
          const formData = new FormData();
          formData.append("file", paperFile);
          formData.append("paperContent", paperContent);
          formData.append("claims", JSON.stringify(claims));

          response = await fetch("/api/preflight/synthesis/commit", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/preflight/synthesis/commit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperContent,
              claims,
            }),
          });
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to generate commit preview");
        }

        const data = await response.json();
        console.log("[CommitPreview] Commit preview received");
        setPreview(data);
        setEditableCommitMessage(data.commitMessage || "Apply boundary-centered synthesis framing");
        setEditableCommitNotes(data.commitNotes || "");
      } catch (error) {
        console.error("[CommitPreview] Error:", error);
        alert(error instanceof Error ? error.message : "Failed to generate commit preview");
      } finally {
        setIsLoading(false);
      }
    };

    generateCommitPreview();
  }, [claims, paperContent, paperFile]);

  const toggleClaimExpansion = (claimId: string) => {
    const newExpanded = new Set(expandedClaims);
    if (newExpanded.has(claimId)) {
      newExpanded.delete(claimId);
    } else {
      newExpanded.add(claimId);
    }
    setExpandedClaims(newExpanded);
  };

  const handleCommit = async () => {
    if (!preview) return;

    try {
      const response = await fetch("/api/preflight/synthesis/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commitMessage: editableCommitMessage,
          commitNotes: editableCommitNotes,
          synthesisCaseId: preview.synthesisCaseId,
          claimDiffs: preview.claimDiffs,
          sectionInserts: preview.sectionInserts,
          abstractDiff: preview.abstractDiff,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || "Failed to apply commit");
      }

      const data = await response.json();
      onCommit(data.commitId);
    } catch (error) {
      console.error("[CommitPreview] Commit error:", error);
      alert(error instanceof Error ? error.message : "Failed to apply commit");
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Preparing Commit Preview...</h2>
          <p>Analyzing all changes that will be applied.</p>
        </div>
      </div>
    );
  }

  if (!preview) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <p>Failed to generate commit preview. Please try again.</p>
          <button onClick={onCancel} className={styles.secondaryButton}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Phase 1: Header */}
      <div className={styles.header}>
        <h1 className={styles.title}>Synthesis Commit Preview</h1>
        <p className={styles.subtitle}>
          This commit applies a boundary-centered synthesis framing.
          <br />
          No claims are removed. Scope and responsibility attribution are adjusted.
        </p>
      </div>

      {/* Phase 2: Change Summary */}
      <div className={styles.changeSummary}>
        <h2 className={styles.sectionTitle}>This commit will:</h2>
        <ul className={styles.willDoList}>
          {preview.changeSummary.reframed > 0 && (
            <li>Reframe {preview.changeSummary.reframed} claim{preview.changeSummary.reframed !== 1 ? "s" : ""} (scope + responsibility)</li>
          )}
          {preview.changeSummary.rescoped > 0 && (
            <li>Re-scope {preview.changeSummary.rescoped} claim{preview.changeSummary.rescoped !== 1 ? "s" : ""} (architecture + context qualifiers)</li>
          )}
          {preview.changeSummary.abstractUpdated && (
            <li>Update the abstract</li>
          )}
          {preview.changeSummary.boundaryParagraphs > 0 && (
            <li>Add {preview.changeSummary.boundaryParagraphs} boundary clarification paragraph{preview.changeSummary.boundaryParagraphs !== 1 ? "s" : ""}</li>
          )}
        </ul>

        <h2 className={styles.sectionTitle}>This commit will not:</h2>
        <ul className={styles.willNotList}>
          <li>Remove claims</li>
          <li>Alter experimental results</li>
          <li>Change your core thesis</li>
        </ul>
      </div>

      {/* Phase 3: Claim-Level Diffs */}
      {preview.claimDiffs.length > 0 && (
        <div className={styles.claimDiffsSection}>
          <h2 className={styles.sectionTitle}>Claim-Level Changes</h2>
          {preview.claimDiffs.map((diff) => (
            <div key={diff.claimId} className={styles.claimDiffCard}>
              <div
                className={styles.claimDiffHeader}
                onClick={() => toggleClaimExpansion(diff.claimId)}
              >
                <div className={styles.claimDiffTitle}>
                  <strong>{diff.claimLabel}</strong> — {diff.changeType === "reframed" ? "Reframed" : diff.changeType === "re-scoped" ? "Re-scoped" : "Unchanged"}
                </div>
                <div className={styles.expandIcon}>
                  {expandedClaims.has(diff.claimId) ? "−" : "+"}
                </div>
              </div>
              {expandedClaims.has(diff.claimId) && (
                <div className={styles.claimDiffContent}>
                  <div className={styles.diffComparison}>
                    <div className={styles.diffBefore}>
                      <div className={styles.diffLabel}>Before</div>
                      <div className={styles.diffText}>{diff.before}</div>
                    </div>
                    <div className={styles.diffAfter}>
                      <div className={styles.diffLabel}>After</div>
                      <div className={styles.diffText}>{diff.after}</div>
                    </div>
                  </div>
                  <div className={styles.diffRationale}>
                    <strong>Change rationale:</strong> {diff.rationale}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Phase 4: Section-Level Inserts */}
      {preview.sectionInserts.length > 0 && (
        <div className={styles.sectionInsertsSection}>
          <h2 className={styles.sectionTitle}>New Paragraphs</h2>
          {preview.sectionInserts.map((insert, index) => (
            <div key={index} className={styles.sectionInsertCard}>
              <div className={styles.sectionInsertHeader}>
                <span className={styles.sectionInsertBadge}>{insert.badge}</span>
                <span className={styles.sectionInsertLocation}>New: {insert.section}</span>
              </div>
              <div className={styles.sectionInsertContent}>{insert.content}</div>
            </div>
          ))}
        </div>
      )}

      {/* Phase 5: Abstract Diff */}
      {preview.abstractDiff && (
        <div className={styles.abstractDiffSection}>
          <h2 className={styles.sectionTitle}>Abstract Changes</h2>
          <div className={styles.abstractComparison}>
            <div className={styles.abstractColumn}>
              <h3 className={styles.abstractLabel}>Original</h3>
              <div className={styles.abstractText}>{preview.abstractDiff.original}</div>
            </div>
            <div className={styles.abstractColumn}>
              <h3 className={styles.abstractLabel}>Synthesized</h3>
              <div className={styles.abstractText}>{preview.abstractDiff.synthesized}</div>
              {preview.abstractDiff.highlights && (
                <div className={styles.abstractHighlights}>
                  {preview.abstractDiff.highlights.added.length > 0 && (
                    <div className={styles.highlightSection}>
                      <strong>Added boundary language:</strong>
                      <ul>
                        {preview.abstractDiff.highlights.added.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {preview.abstractDiff.highlights.softened.length > 0 && (
                    <div className={styles.highlightSection}>
                      <strong>Softened absolutes:</strong>
                      <ul>
                        {preview.abstractDiff.highlights.softened.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {preview.abstractDiff.highlights.scopeConditions.length > 0 && (
                    <div className={styles.highlightSection}>
                      <strong>Explicit scope conditions:</strong>
                      <ul>
                        {preview.abstractDiff.highlights.scopeConditions.map((item, i) => (
                          <li key={i}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 6: Commit Metadata */}
      <div className={styles.commitMetadata}>
        <h2 className={styles.sectionTitle}>Commit Metadata</h2>
        <div className={styles.metadataField}>
          <label htmlFor="commitMessage">Commit message (editable):</label>
          <input
            id="commitMessage"
            type="text"
            value={editableCommitMessage}
            onChange={(e) => setEditableCommitMessage(e.target.value)}
            className={styles.commitInput}
          />
        </div>
        <div className={styles.metadataField}>
          <label htmlFor="commitNotes">Commit notes (optional):</label>
          <textarea
            id="commitNotes"
            value={editableCommitNotes}
            onChange={(e) => setEditableCommitNotes(e.target.value)}
            className={styles.commitTextarea}
            rows={3}
          />
        </div>
        <div className={styles.attribution}>
          <p>
            <strong>Attribution:</strong>
            <br />
            Changes generated with synthesis case {preview.synthesisCaseId.substring(0, 8)}…
            <br />
            Final authority retained by author.
          </p>
        </div>
      </div>

      {/* Phase 7: Final Decision */}
      <div className={styles.finalActions}>
        <button onClick={handleCommit} className={styles.commitButton}>
          Commit these changes
        </button>
        <div className={styles.secondaryActions}>
          <button className={styles.secondaryButton}>
            Download patch / tracked changes
          </button>
          <button onClick={onCancel} className={styles.secondaryButton}>
            Return without committing
          </button>
        </div>
      </div>
    </div>
  );
}

