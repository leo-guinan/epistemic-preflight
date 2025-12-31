"use client";

import { useState, useEffect } from "react";
import styles from "./DisagreementPositioning.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface DisagreementAxis {
  axis: string;
  yourPosition: string;
  comparatorPosition: string;
  isSubstantive: boolean;
}

interface DisagreementPositioningProps {
  claims: Claim[];
  paperContent: string;
  paperFile?: File;
  comparators?: Array<File | string>;
  onBack?: () => void;
}

export function DisagreementPositioning({
  claims,
  paperContent,
  paperFile,
  comparators,
  onBack,
}: DisagreementPositioningProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disagreementAxes, setDisagreementAxes] = useState<DisagreementAxis[]>([]);
  const [disagreementParagraph, setDisagreementParagraph] = useState<string>("");
  const [highlights, setHighlights] = useState<{
    disagreement: string[];
    respect: string[];
    scope: string[];
  }>({ disagreement: [], respect: [], scope: [] });

  useEffect(() => {
    const generateDisagreement = async () => {
      setIsLoading(true);
      console.log("[Disagreement] Starting disagreement positioning generation...");
      console.log("[Disagreement] Paper content length:", paperContent?.length || 0);
      console.log("[Disagreement] Claims count:", claims?.length || 0);
      console.log("[Disagreement] Has file:", !!paperFile);

      // Validate inputs
      if (!paperContent || paperContent.trim().length === 0) {
        console.error("[Disagreement] No paper content provided");
        setIsLoading(false);
        return;
      }

      if (!claims || claims.length === 0) {
        console.error("[Disagreement] No claims provided");
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
          if (comparators && comparators.length > 0) {
            formData.append("comparators", JSON.stringify(comparators.map(c => typeof c === "string" ? c : c.name)));
          }

          response = await fetch("/api/preflight/disagreement", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/preflight/disagreement", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperContent,
              claims,
              comparators: comparators?.map(c => typeof c === "string" ? c : c.name),
            }),
          });
        }

        console.log("[Disagreement] Response status:", response.status);

        if (!response.ok) {
          let errorMessage = "Failed to generate disagreement positioning";
          try {
            const errorData = await response.json();
            errorMessage = errorData.error || errorMessage;
          } catch (e) {
            // If response isn't JSON, try to get text
            try {
              const errorText = await response.text();
              errorMessage = errorText || errorMessage;
            } catch (e2) {
              // If that fails too, use status text
              errorMessage = response.statusText || errorMessage;
            }
          }
          throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log("[Disagreement] Data received:");
        console.log("[Disagreement] - Axes:", data.disagreementAxes?.length || 0);
        console.log("[Disagreement] - Has paragraph:", !!data.disagreementParagraph);

        setDisagreementAxes(data.disagreementAxes || []);
        setDisagreementParagraph(data.disagreementParagraph || "");
        setHighlights(data.highlights || { disagreement: [], respect: [], scope: [] });
        setError(null);
      } catch (error) {
        console.error("[Disagreement] Error:", error);
        setError(error instanceof Error ? error.message : "Failed to generate disagreement positioning");
      } finally {
        setIsLoading(false);
      }
    };

    generateDisagreement();
  }, [claims, paperContent, paperFile, comparators]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Generating Disagreement Positioning...</h2>
          <p>Analyzing where you diverge and how to frame it explicitly.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "24px", backgroundColor: "#fee", color: "#c33", borderRadius: "8px" }}>
          <h2 style={{ marginTop: 0 }}>Error Generating Disagreement Positioning</h2>
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
      {/* Step 1: Frame the choice */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Owning the Disagreement</h1>
        <div className={styles.subtextBox}>
          <p className={styles.subtext}>
            You've chosen to explicitly diverge from existing work. We'll help you do this
            in a way reviewers recognize as deliberate and principled — not accidental or dismissive.
          </p>
        </div>
      </div>

      {/* Step 2: Show the Disagreement Map */}
      {disagreementAxes.length > 0 && (
        <div className={styles.disagreementMap}>
          <h2 className={styles.sectionTitle}>You are diverging on {disagreementAxes.length} core axis{disagreementAxes.length !== 1 ? "es" : ""}:</h2>
          
          {disagreementAxes.map((axis, index) => (
            <div key={index} className={styles.axisCard}>
              <h3 className={styles.axisName}>{axis.axis}</h3>
              <div className={styles.axisComparison}>
                <div className={styles.positionBox}>
                  <div className={styles.positionLabel}>Your position:</div>
                  <div className={styles.positionText}>{axis.yourPosition}</div>
                </div>
                <div className={styles.positionBox}>
                  <div className={styles.positionLabel}>Comparator position:</div>
                  <div className={styles.positionText}>{axis.comparatorPosition}</div>
                </div>
              </div>
              {axis.isSubstantive && (
                <div className={styles.reassuranceBox}>
                  <strong>This disagreement is substantive, not superficial.</strong>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Step 3: Explicit Disagreement Paragraph */}
      {disagreementParagraph && (
        <div className={styles.paragraphSection}>
          <h2 className={styles.sectionTitle}>Explicit Disagreement Paragraph</h2>
          <p className={styles.paragraphSubtext}>
            Ready-to-drop paragraph that owns the disagreement cleanly:
          </p>
          
          <div className={styles.paragraphBox}>
            <div className={styles.paragraphText}>{disagreementParagraph}</div>
          </div>

          {highlights.disagreement.length > 0 && (
            <div className={styles.highlights}>
              <div className={styles.highlightSection}>
                <strong>Where disagreement is stated:</strong>
                <ul>
                  {highlights.disagreement.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {highlights.respect.length > 0 && (
            <div className={styles.highlights}>
              <div className={styles.highlightSection}>
                <strong>Where respect is maintained:</strong>
                <ul>
                  {highlights.respect.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {highlights.scope.length > 0 && (
            <div className={styles.highlights}>
              <div className={styles.highlightSection}>
                <strong>Where scope is clarified:</strong>
                <ul>
                  {highlights.scope.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Action Buttons */}
      <div className={styles.actions}>
        <button className={styles.primaryButton}>
          Insert disagreement framing
        </button>
        <div className={styles.secondaryButtons}>
          <button className={styles.secondaryButton}>
            Adjust tone (stronger / softer)
          </button>
          <button className={styles.secondaryButton}>
            Export as reviewer-facing justification
          </button>
          <button 
            className={styles.secondaryButton}
            onClick={() => onBack?.()}
          >
            Choose another path
          </button>
        </div>
      </div>
    </div>
  );
}

