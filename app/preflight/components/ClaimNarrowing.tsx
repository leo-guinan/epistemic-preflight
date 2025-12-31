"use client";

import { useState, useEffect } from "react";
import styles from "./ClaimNarrowing.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface NarrowableClaim {
  claimId: string;
  claimLabel: string;
  claimText: string;
  riskLevel: "high" | "medium";
  reason: string;
}

interface ClaimRewrite {
  claimId: string;
  before: string;
  after: string;
  impact: string;
}

interface ClaimNarrowingProps {
  claims: Claim[];
  paperContent: string;
  paperFile?: File;
  onBack?: () => void;
  onApply?: (rewrite: ClaimRewrite) => void;
  onSeeImpact?: () => void;
  onExport?: (rewrite: ClaimRewrite) => void;
}

export function ClaimNarrowing({
  claims,
  paperContent,
  paperFile,
  onBack,
  onApply,
  onSeeImpact,
  onExport,
}: ClaimNarrowingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [narrowableClaims, setNarrowableClaims] = useState<NarrowableClaim[]>([]);
  const [selectedClaimId, setSelectedClaimId] = useState<string | null>(null);
  const [claimRewrite, setClaimRewrite] = useState<ClaimRewrite | null>(null);

  useEffect(() => {
    const identifyNarrowableClaims = async () => {
      setIsLoading(true);
      console.log("[Narrowing] Starting claim narrowing analysis...");
      console.log("[Narrowing] Paper content length:", paperContent?.length || 0);
      console.log("[Narrowing] Claims count:", claims?.length || 0);
      console.log("[Narrowing] Has file:", !!paperFile);

      // Validate inputs
      if (!paperContent || paperContent.trim().length === 0) {
        console.error("[Narrowing] No paper content provided");
        setIsLoading(false);
        return;
      }

      if (!claims || claims.length === 0) {
        console.error("[Narrowing] No claims provided");
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

          response = await fetch("/api/preflight/narrowing", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/preflight/narrowing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperContent,
              claims,
            }),
          });
        }

        console.log("[Narrowing] Response status:", response.status);

        if (!response.ok) {
          let errorMessage = "Failed to identify narrowable claims";
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
        console.log("[Narrowing] Data received:");
        console.log("[Narrowing] - Narrowable claims:", data.narrowableClaims?.length || 0);

        setNarrowableClaims(data.narrowableClaims || []);
        setError(null);
      } catch (error) {
        console.error("[Narrowing] Error:", error);
        setError(error instanceof Error ? error.message : "Failed to identify narrowable claims");
      } finally {
        setIsLoading(false);
      }
    };

    identifyNarrowableClaims();
  }, [claims, paperContent, paperFile]);

  const handleClaimSelect = async (claimId: string) => {
    setSelectedClaimId(claimId);
    console.log("[Narrowing] Generating rewrite for claim:", claimId);

    try {
      let response: Response;

      if (paperFile) {
        const formData = new FormData();
        formData.append("file", paperFile);
        formData.append("paperContent", paperContent);
        formData.append("claimId", claimId);
        formData.append("claims", JSON.stringify(claims));

        response = await fetch("/api/preflight/narrowing/rewrite", {
          method: "POST",
          body: formData,
        });
      } else {
        response = await fetch("/api/preflight/narrowing/rewrite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paperContent,
            claimId,
            claims,
          }),
        });
      }

      if (!response.ok) {
        let errorMessage = "Failed to generate rewrite";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          try {
            const errorText = await response.text();
            errorMessage = errorText || errorMessage;
          } catch (e2) {
            errorMessage = response.statusText || errorMessage;
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setClaimRewrite(data.rewrite || null);
    } catch (error) {
      console.error("[Narrowing] Rewrite error:", error);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Analyzing Claims...</h2>
          <p>Identifying which claims could benefit from narrowing.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div style={{ padding: "24px", backgroundColor: "#fee", color: "#c33", borderRadius: "8px" }}>
          <h2 style={{ marginTop: 0 }}>Error Analyzing Claims</h2>
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
        <h1 className={styles.title}>Narrowing a Claim</h1>
        <div className={styles.subtextBox}>
          <p className={styles.subtext}>
            We'll help you reduce scope while preserving the paper's core contribution.
          </p>
        </div>
      </div>

      {/* Step 2: Identify which claim to narrow */}
      {narrowableClaims.length > 0 && (
        <div className={styles.claimsSection}>
          <h2 className={styles.sectionTitle}>High reviewer scrutiny detected:</h2>
          
          <div className={styles.claimsList}>
            {narrowableClaims.map((claim) => (
              <label key={claim.claimId} className={styles.claimOption}>
                <input
                  type="radio"
                  name="narrowable-claim"
                  checked={selectedClaimId === claim.claimId}
                  onChange={() => handleClaimSelect(claim.claimId)}
                  className={styles.radio}
                />
                <div className={styles.claimContent}>
                  <div className={styles.claimHeader}>
                    <strong className={styles.claimLabel}>{claim.claimLabel}</strong>
                    <span className={`${styles.riskBadge} ${styles[claim.riskLevel]}`}>
                      {claim.riskLevel} risk
                    </span>
                  </div>
                  <p className={styles.claimText}>{claim.claimText}</p>
                  <p className={styles.claimReason}>{claim.reason}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Show Before / After wording */}
      {claimRewrite && (
        <div className={styles.rewriteSection}>
          <h2 className={styles.sectionTitle}>Claim Rewrite Delta</h2>
          
          <div className={styles.rewriteComparison}>
            <div className={styles.rewriteColumn}>
              <h3 className={styles.rewriteLabel}>Before</h3>
              <div className={styles.rewriteText}>{claimRewrite.before}</div>
            </div>
            <div className={styles.rewriteColumn}>
              <h3 className={styles.rewriteLabel}>After</h3>
              <div className={styles.rewriteText}>{claimRewrite.after}</div>
            </div>
          </div>

          {claimRewrite.impact && (
            <div className={styles.impactBox}>
              <p className={styles.impactText}>
                <strong>Contribution preserved.</strong> Scope reduced. Reviewer risk lowered.
              </p>
              <p className={styles.impactDetails}>{claimRewrite.impact}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Action Buttons */}
      {claimRewrite && (
        <div className={styles.actions}>
          <button 
            className={styles.primaryButton}
            onClick={() => {
              if (claimRewrite && onApply) {
                onApply(claimRewrite);
              }
            }}
          >
            Apply narrowed claim
          </button>
          <div className={styles.secondaryButtons}>
            <button 
              className={styles.secondaryButton}
              onClick={() => onSeeImpact?.()}
            >
              See impact on synthesis/conflict
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={() => {
                if (claimRewrite && onExport) {
                  onExport(claimRewrite);
                }
              }}
            >
              Export reviewer-safe version
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={() => onBack?.()}
            >
              Undo / choose another path
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

