"use client";

import { useState, useEffect } from "react";
import styles from "./SynthesisPreview.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface ClaimShift {
  claimId: string;
  claimLabel: string;
  before: string;
  after: string;
  changeType: "reframed" | "re-scoped" | "unchanged";
}

interface SynthesisPreviewProps {
  claims: Claim[];
  paperContent: string;
  paperFile?: File;
  onApply?: () => void;
  onBack?: () => void;
}

export function SynthesisPreview({
  claims,
  paperContent,
  paperFile,
  onApply,
  onBack,
}: SynthesisPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claimShifts, setClaimShifts] = useState<ClaimShift[]>([]);
  const [originalAbstract, setOriginalAbstract] = useState<string>("");
  const [synthesisAbstract, setSynthesisAbstract] = useState<string>("");
  const [abstractHighlights, setAbstractHighlights] = useState<{
    added: string[];
    softened: string[];
    scopeConditions: string[];
  }>({ added: [], softened: [], scopeConditions: [] });
  const [summary, setSummary] = useState<{
    removed: number;
    rescoped: number;
    reframed: number;
    weakened: number;
  }>({ removed: 0, rescoped: 0, reframed: 0, weakened: 0 });

  useEffect(() => {
    const generateSynthesis = async () => {
      setIsLoading(true);
      console.log("[SynthesisPreview] Starting synthesis generation...");
      console.log("[SynthesisPreview] Claims count:", claims?.length || 0);
      console.log("[SynthesisPreview] Paper content length:", paperContent?.length || 0);
      console.log("[SynthesisPreview] Has file:", !!paperFile);

      // Validate inputs
      if (!paperContent || paperContent.trim().length === 0) {
        console.error("[SynthesisPreview] No paper content provided");
        setError("No paper content provided");
        setIsLoading(false);
        return;
      }

      if (!claims || claims.length === 0) {
        console.error("[SynthesisPreview] No claims provided");
        setError("No claims provided");
        setIsLoading(false);
        return;
      }

      try {
        let response: Response;

        if (paperFile) {
          const formData = new FormData();
          formData.append("file", paperFile);
          formData.append("paperContent", paperContent);
          formData.append("claims", JSON.stringify(claims));

          response = await fetch("/api/preflight/synthesis", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/preflight/synthesis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperContent,
              claims,
            }),
          });
        }

        console.log("[SynthesisPreview] Response status:", response.status);

        if (!response.ok) {
          let errorMessage = "Failed to generate synthesis";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
            console.error("[SynthesisPreview] API error:", errorData);
          } catch (e) {
            // If response isn't JSON, try to get text
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
              console.error("[SynthesisPreview] Error text:", errorText);
            } catch (e2) {
              // If that fails too, use status text
              errorMessage = response.statusText || errorMessage;
              console.error("[SynthesisPreview] Status text:", response.statusText);
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("[SynthesisPreview] Synthesis received:");
        console.log("[SynthesisPreview] - Claim shifts:", data.claimShifts?.length || 0);
        console.log("[SynthesisPreview] - Has abstract:", !!data.synthesisAbstract);

        setClaimShifts(data.claimShifts || []);
        setOriginalAbstract(data.originalAbstract || "");
        setSynthesisAbstract(data.synthesisAbstract || "");
        setAbstractHighlights(data.abstractHighlights || { added: [], softened: [], scopeConditions: [] });
        setSummary(data.summary || { removed: 0, rescoped: 0, reframed: 0, weakened: 0 });
        setError(null);
      } catch (error) {
        console.error("[SynthesisPreview] Error:", error);
        setError(error instanceof Error ? error.message : "Failed to generate synthesis");
      } finally {
        setIsLoading(false);
      }
    };

    generateSynthesis();
  }, [claims, paperContent, paperFile]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Generating Synthesis Preview...</h2>
          <p>Analyzing how your claims would shift under a synthesis framing.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "24px", backgroundColor: "#fee", color: "#c33", borderRadius: "8px" }}>
          <h2 style={{ marginTop: 0 }}>Error Generating Synthesis Preview</h2>
          <p>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: "16px", padding: "8px 16px", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Step 1: Anchor the synthesis */}
      <div className={styles.anchorSection}>
        <h1 className={styles.title}>Synthesis Framing Selected</h1>
        <div className={styles.anchorBox}>
          <p className={styles.anchorText}>
            This reframing does not require you to abandon your core claims.
            It changes where responsibility is enforced and how disagreement is positioned.
          </p>
        </div>
      </div>

      {/* Step 2: Claim-Level Impact */}
      <div className={styles.claimsSection}>
        <h2 className={styles.sectionTitle}>How Your Core Claims Would Shift</h2>
        
        {claimShifts.length > 0 ? (
          <>
            <div className={styles.claimsTable}>
              <div className={styles.tableHeader}>
                <div className={styles.tableCell}>Claim</div>
                <div className={styles.tableCell}>Before</div>
                <div className={styles.tableCell}>Under Synthesis</div>
              </div>
              {claimShifts.map((shift, index) => (
                <div key={shift.claimId} className={styles.tableRow}>
                  <div className={styles.tableCell}>
                    <strong>{shift.claimLabel}</strong>
                  </div>
                  <div className={styles.tableCell}>{shift.before}</div>
                  <div className={styles.tableCell}>{shift.after}</div>
                </div>
              ))}
            </div>

            <div className={styles.summaryBox}>
              <p className={styles.summaryText}>
                <strong>No claims are removed.</strong>{" "}
                {summary.rescoped} claim{summary.rescoped !== 1 ? "s are" : " is"} re-scoped.{" "}
                {summary.reframed} claim{summary.reframed !== 1 ? "s are" : " is"} reframed.{" "}
                {summary.weakened} claim{summary.weakened !== 1 ? "s are" : " is"} weakened.
              </p>
            </div>
          </>
        ) : (
          <p className={styles.noData}>No claim shifts generated yet.</p>
        )}
      </div>

      {/* Step 3: Revised Abstract */}
      {originalAbstract && synthesisAbstract && (
        <div className={styles.abstractSection}>
          <h2 className={styles.sectionTitle}>Revised Abstract</h2>
          <div className={styles.abstractComparison}>
            <div className={styles.abstractColumn}>
              <h3 className={styles.abstractLabel}>Original</h3>
              <div className={styles.abstractText}>{originalAbstract}</div>
            </div>
            <div className={styles.abstractColumn}>
              <h3 className={styles.abstractLabel}>Synthesis Framing</h3>
              <div className={styles.abstractText}>{synthesisAbstract}</div>
              {abstractHighlights.added.length > 0 && (
                <div className={styles.highlights}>
                  <div className={styles.highlightSection}>
                    <strong>Added boundary language:</strong>
                    <ul>
                      {abstractHighlights.added.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {abstractHighlights.softened.length > 0 && (
                <div className={styles.highlights}>
                  <div className={styles.highlightSection}>
                    <strong>Softened absolutes:</strong>
                    <ul>
                      {abstractHighlights.softened.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {abstractHighlights.scopeConditions.length > 0 && (
                <div className={styles.highlights}>
                  <div className={styles.highlightSection}>
                    <strong>Explicit scope conditions:</strong>
                    <ul>
                      {abstractHighlights.scopeConditions.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={styles.actions}>
        <button 
          className={styles.primaryButton}
          onClick={() => onApply?.()}
        >
          Apply this framing to my draft
        </button>
        <div className={styles.secondaryButtons}>
          <button className={styles.secondaryButton}>
            Refine the synthesis (advanced)
          </button>
          <button className={styles.secondaryButton}>
            Export as reviewer response
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => onBack?.()}
          >
            Undo / try another path
          </button>
        </div>
      </div>
    </div>
  );
}

