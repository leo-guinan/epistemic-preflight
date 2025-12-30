"use client";

import { useState, useEffect } from "react";
import styles from "./FullAnalysis.module.css";

interface FullAnalysisProps {
  paperContent: string;
  comparators: Array<File | string>;
  onComplete: () => void;
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
      try {
        const response = await fetch("/api/preflight/full-analysis", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            paperContent,
            comparators: comparators.map((c) =>
              typeof c === "string" ? c : c.name
            ),
          }),
        });
        const data = await response.json();
        setAnalysis(data);
      } catch (error) {
        console.error("Analysis error:", error);
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
            {analysis.risks?.map((risk: string, index: number) => (
              <div key={index} className={styles.riskItem}>
                <strong>Risk {index + 1}:</strong> {risk}
              </div>
            )) || <p>No significant risks identified.</p>}
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
        <button onClick={onComplete} className={styles.continueButton}>
          Continue to Next Steps
        </button>
      </div>
    </div>
  );
}

