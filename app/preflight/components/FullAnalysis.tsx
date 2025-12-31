"use client";

import { useState, useEffect } from "react";
import styles from "./FullAnalysis.module.css";

interface FullAnalysisProps {
  paperContent: string;
  comparators: Array<File | string>;
  onComplete: (analysis?: any) => void;
}

export function FullAnalysis({
  paperContent,
  comparators,
  onComplete,
}: FullAnalysisProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [analysis, setAnalysis] = useState<any>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    const fetchAnalysis = async () => {
      setIsLoading(true);
      console.log("[FullAnalysis] Starting full analysis...");
      console.log("[FullAnalysis] Paper content length:", paperContent?.length || 0);
      console.log("[FullAnalysis] Comparators:", comparators.length);
      
      try {
        // If paperContent is empty, we need to check if we have a file to send
        // For now, we'll send what we have - the API will handle file extraction if needed
        if (!paperContent || paperContent.trim().length === 0) {
          console.warn("[FullAnalysis] Warning: paperContent is empty. Make sure file was uploaded.");
        }

        const response = await fetch("/api/preflight/full-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paperContent: paperContent || "", // Send empty string if not available - API will handle it
            comparators: comparators.map((c) =>
              typeof c === "string" ? c : c.name
            ),
          }),
        });

        console.log("[FullAnalysis] Response status:", response.status);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("[FullAnalysis] API error:", errorData);
          throw new Error(errorData.error || "Failed to perform full analysis");
        }

        const data = await response.json();
        console.log("[FullAnalysis] Analysis received:");
        console.log("[FullAnalysis] - Overlap:", data.overlap ? "Present" : "None");
        console.log("[FullAnalysis] - Conflict:", data.conflict ? "Present" : "None");
        console.log("[FullAnalysis] - Risks type:", typeof data.risks);
        console.log("[FullAnalysis] - Risks is array:", Array.isArray(data.risks));
        console.log("[FullAnalysis] - Risks count:", data.risks?.length || 0);
        if (data.risks && Array.isArray(data.risks)) {
          data.risks.forEach((risk: string, index: number) => {
            console.log(`[FullAnalysis] Risk ${index + 1} (${risk?.length || 0} chars):`, risk?.substring(0, 100));
          });
        } else {
          console.log("[FullAnalysis] Risks value:", data.risks);
        }
        setAnalysis(data);
      } catch (error) {
        console.error("[FullAnalysis] Analysis error:", error);
        setAnalysis(null); // Set to null to show error state
      } finally {
        setIsLoading(false);
      }
    };

    fetchAnalysis();
  }, [paperContent, comparators]);

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <h2>Analyzing your paper...</h2>
          <p>Mapping claims, identifying overlaps, and assessing reviewer risks.</p>
        </div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Analysis Error</h2>
          <p>Unable to complete analysis. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Preflight Summary</h1>
      <p className={styles.subtitle}>
        Complete analysis of how your paper positions relative to existing work.
      </p>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <h3>Where You Overlap</h3>
          <p>{analysis.overlap || "No significant overlaps identified."}</p>
        </div>

        <div className={styles.summaryCard}>
          <h3>Where You Conflict</h3>
          <p>{analysis.conflict || "No direct conflicts identified."}</p>
        </div>

        <div className={styles.summaryCard}>
          <h3>Where You're Novel</h3>
          <p>{analysis.novel || "Novel contributions identified."}</p>
        </div>
      </div>

      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection("risks")}
        >
          <h2>Top 3 Reviewer Risks</h2>
          <span className={styles.expandIcon}>
            {expandedSections.has("risks") ? "−" : "+"}
          </span>
        </button>
        {expandedSections.has("risks") && (
          <div className={styles.sectionContent}>
            {analysis.risks && Array.isArray(analysis.risks) && analysis.risks.length > 0 ? (
              analysis.risks.map((risk: string, index: number) => (
                <div key={index} className={styles.riskItem}>
                  <strong>Risk {index + 1}:</strong> {risk}
                </div>
              ))
            ) : (
              <p>No significant risks identified.</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.section}>
        <button
          className={styles.sectionHeader}
          onClick={() => toggleSection("reframing")}
        >
          <h2>Reframing Suggestions</h2>
          <span className={styles.expandIcon}>
            {expandedSections.has("reframing") ? "−" : "+"}
          </span>
        </button>
        {expandedSections.has("reframing") && (
          <div className={styles.sectionContent}>
            {analysis.reframing?.map((suggestion: string, index: number) => (
              <div key={index} className={styles.suggestionItem}>
                {suggestion}
              </div>
            )) || <p>No reframing suggestions at this time.</p>}
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <button onClick={() => onComplete(analysis)} className={styles.continueButton}>
          Continue to Next Steps
        </button>
      </div>
    </div>
  );
}

