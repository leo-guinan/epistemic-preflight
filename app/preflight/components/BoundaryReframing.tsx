"use client";

import { useState, useEffect } from "react";
import styles from "./BoundaryReframing.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface BoundaryShift {
  aspect: string;
  before: string;
  after: string;
}

interface BoundaryReframingProps {
  claims: Claim[];
  paperContent: string;
  paperFile?: File;
  comparators?: Array<File | string>;
}

export function BoundaryReframing({
  claims,
  paperContent,
  paperFile,
  comparators,
}: BoundaryReframingProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [boundaryShifts, setBoundaryShifts] = useState<BoundaryShift[]>([]);
  const [boundaryClarification, setBoundaryClarification] = useState<string>("");
  const [insight, setInsight] = useState<string>("");

  useEffect(() => {
    const generateBoundaryReframing = async () => {
      setIsLoading(true);
      console.log("[Boundary] Starting boundary reframing generation...");

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

          response = await fetch("/api/preflight/boundary", {
            method: "POST",
            body: formData,
          });
        } else {
          response = await fetch("/api/preflight/boundary", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              paperContent,
              claims,
              comparators: comparators?.map(c => typeof c === "string" ? c : c.name),
            }),
          });
        }

        console.log("[Boundary] Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.error || "Failed to generate boundary reframing");
        }

        const data = await response.json();
        console.log("[Boundary] Data received:");
        console.log("[Boundary] - Shifts:", data.boundaryShifts?.length || 0);
        console.log("[Boundary] - Has clarification:", !!data.boundaryClarification);

        setBoundaryShifts(data.boundaryShifts || []);
        setBoundaryClarification(data.boundaryClarification || "");
        setInsight(data.insight || "");
      } catch (error) {
        console.error("[Boundary] Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    generateBoundaryReframing();
  }, [claims, paperContent, paperFile, comparators]);

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Generating Boundary Reframing...</h2>
          <p>Analyzing how shifting the boundary changes your positioning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Step 1: Frame the choice */}
      <div className={styles.headerSection}>
        <h1 className={styles.title}>Reframing the Boundary</h1>
        <div className={styles.subtextBox}>
          <p className={styles.subtext}>
            You're not changing what you argue — you're changing where the argument applies.
          </p>
        </div>
      </div>

      {/* Step 2: Boundary Before / After */}
      {boundaryShifts.length > 0 && (
        <div className={styles.boundarySection}>
          <h2 className={styles.sectionTitle}>Boundary Shift</h2>
          
          <div className={styles.boundaryTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Aspect</div>
              <div className={styles.tableCell}>Before</div>
              <div className={styles.tableCell}>After</div>
            </div>
            {boundaryShifts.map((shift, index) => (
              <div key={index} className={styles.tableRow}>
                <div className={styles.tableCell}>
                  <strong>{shift.aspect}</strong>
                </div>
                <div className={styles.tableCell}>{shift.before}</div>
                <div className={styles.tableCell}>{shift.after}</div>
              </div>
            ))}
          </div>

          {insight && (
            <div className={styles.insightBox}>
              <p className={styles.insightText}>{insight}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Boundary Clarification Section */}
      {boundaryClarification && (
        <div className={styles.clarificationSection}>
          <h2 className={styles.sectionTitle}>Boundary Clarification Section</h2>
          <p className={styles.clarificationSubtext}>
            A short section that could be added early in the paper:
          </p>
          
          <div className={styles.clarificationBox}>
            <div className={styles.clarificationText}>{boundaryClarification}</div>
          </div>
        </div>
      )}

      {/* Step 4: Action Buttons */}
      <div className={styles.actions}>
        <button className={styles.primaryButton}>
          Apply boundary reframing
        </button>
        <div className={styles.secondaryButtons}>
          <button className={styles.secondaryButton}>
            Test boundary against other papers
          </button>
          <button className={styles.secondaryButton}>
            Preview reviewer interpretation
          </button>
          <button className={styles.secondaryButton}>
            Choose another path
          </button>
        </div>
      </div>
    </div>
  );
}

