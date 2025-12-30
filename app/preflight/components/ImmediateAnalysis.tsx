"use client";

import styles from "./ImmediateAnalysis.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface ImmediateAnalysisProps {
  claims: Claim[];
  riskSignal?: string;
  onContinue: () => void;
}

export function ImmediateAnalysis({
  claims,
  riskSignal,
  onContinue,
}: ImmediateAnalysisProps) {
  const sortedClaims = [...claims].sort((a, b) => b.importance - a.importance);

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "foundational":
        return "Foundational";
      case "downstream":
        return "Downstream";
      case "supporting":
        return "Supporting";
      default:
        return type;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "foundational":
        return "#1a1a1a";
      case "downstream":
        return "#4a4a4a";
      case "supporting":
        return "#6a6a6a";
      default:
        return "#6a6a6a";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>How Your Paper Will Be Read</h1>
        <p className={styles.subtitle}>
          Here's what we found in your paper. This is how reviewers will
          decompose it.
        </p>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>
          Your Core Claims ({claims.length})
        </h2>
        <p className={styles.sectionSubtitle}>
          We think your paper is making these core claims:
        </p>

        <div className={styles.claimsList}>
          {sortedClaims.map((claim, index) => (
            <div key={claim.id} className={styles.claim}>
              <div className={styles.claimHeader}>
                <span className={styles.claimLabel}>
                  Claim {String.fromCharCode(65 + index)}
                </span>
                <div className={styles.claimMeta}>
                  <span
                    className={styles.claimType}
                    style={{ color: getTypeColor(claim.type) }}
                  >
                    {getTypeLabel(claim.type)}
                  </span>
                  <span className={styles.importance}>
                    Importance: {claim.importance}/10
                  </span>
                </div>
              </div>
              <p className={styles.claimText}>{claim.text}</p>
            </div>
          ))}
        </div>
      </div>

      {riskSignal && (
        <div className={styles.riskSection}>
          <div className={styles.riskBadge}>⚠️ Risk Signal</div>
          <p className={styles.riskText}>{riskSignal}</p>
        </div>
      )}

      <div className={styles.nextSteps}>
        <p className={styles.nextStepsText}>
          We're now mapping how this positions you relative to existing
          frameworks.
        </p>
        <button onClick={onContinue} className={styles.continueButton}>
          Continue to Comparator Selection
        </button>
      </div>
    </div>
  );
}

