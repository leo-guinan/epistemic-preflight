"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import type { DemoPaper } from "@/lib/demo-data-types";
import { fathomEvents } from "@/lib/fathom-tracking";
import styles from "./DemoView.module.css";

interface DemoViewProps {
  demo: DemoPaper;
}

export default function DemoView({ demo }: DemoViewProps) {
  const [activeSection, setActiveSection] = useState<
    "claims" | "analysis" | "synthesis"
  >("claims");

  // Track demo view on mount
  useEffect(() => {
    fathomEvents.demoViewed(demo.id);
    // Store demo ID in sessionStorage to attribute signups
    sessionStorage.setItem('last_viewed_demo', demo.id);
  }, [demo.id]);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/demos" className={styles.backLink}>
          ← Back to Demos
        </Link>
        <h1 className={styles.title}>{demo.title}</h1>
        <div className={styles.meta}>
          <span className={styles.authors}>{demo.authors}</span>
          <span className={styles.venue}>{demo.venue} ({demo.year})</span>
        </div>
        {demo.featuredMoment && (
          <div className={styles.featuredMoment}>
            <h3>{demo.featuredMoment.title}</h3>
            <p>{demo.featuredMoment.description}</p>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className={styles.nav}>
        <button
          className={`${styles.navButton} ${
            activeSection === "claims" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("claims")}
        >
          Core Claims
        </button>
        <button
          className={`${styles.navButton} ${
            activeSection === "analysis" ? styles.active : ""
          }`}
          onClick={() => setActiveSection("analysis")}
        >
          Full Analysis
        </button>
        {demo.synthesisPreview && (
          <button
            className={`${styles.navButton} ${
              activeSection === "synthesis" ? styles.active : ""
            }`}
            onClick={() => setActiveSection("synthesis")}
          >
            Synthesis Framing
          </button>
        )}
      </div>

      {/* Content */}
      <div className={styles.content}>
        {activeSection === "claims" && (
          <ClaimsSection demo={demo} />
        )}
        {activeSection === "analysis" && (
          <AnalysisSection demo={demo} />
        )}
        {activeSection === "synthesis" && demo.synthesisPreview && (
          <SynthesisSection demo={demo} />
        )}
      </div>

      {/* Footer CTA */}
      <div className={styles.footer}>
        <div className={styles.ctaBox}>
          <h2>Ready to analyze your own paper?</h2>
          <p>
            See how your claims map to the field, identify review risks, and
            explore reframing options.
          </p>
          <Link href="/preflight" className={styles.ctaButton}>
            Start Your Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}

function ClaimsSection({ demo }: { demo: DemoPaper }) {
  const sortedClaims = [...demo.coreClaims].sort(
    (a, b) => b.importance - a.importance
  );

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
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Core Claims</h2>
      <p className={styles.sectionSubtitle}>
        These are the load-bearing claims that structure the paper's argument:
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

      {demo.riskSignal && (
        <div className={styles.riskBox}>
          <div className={styles.riskBadge}>⚠️ Risk Signal</div>
          <p className={styles.riskText}>{demo.riskSignal}</p>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ demo }: { demo: DemoPaper }) {
  const analysis = demo.fullAnalysis;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Full Arena Analysis</h2>
      <p className={styles.sectionSubtitle}>
        How this paper positions relative to the field:
      </p>

      <div className={styles.analysisGrid}>
        {analysis.overlap && (
          <div className={styles.analysisCard}>
            <h3 className={styles.cardTitle}>Overlap</h3>
            <p className={styles.cardSummary}>{analysis.overlap.summary}</p>
            <ul className={styles.cardList}>
              {analysis.overlap.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        {analysis.conflict && (
          <div className={styles.analysisCard}>
            <h3 className={styles.cardTitle}>Conflict</h3>
            <p className={styles.cardSummary}>{analysis.conflict.summary}</p>
            <ul className={styles.cardList}>
              {analysis.conflict.details.map((detail, i) => (
                <li key={i}>{detail}</li>
              ))}
            </ul>
          </div>
        )}

        <div className={styles.analysisCard}>
          <h3 className={styles.cardTitle}>Reviewer Risks</h3>
          <ul className={styles.risksList}>
            {analysis.risks.map((risk, i) => (
              <li key={i} className={styles.riskItem}>
                <span className={styles.riskNumber}>{i + 1}</span>
                <span className={styles.riskText}>{risk}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function SynthesisSection({ demo }: { demo: DemoPaper }) {
  const synthesis = demo.synthesisPreview!;

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Synthesis Framing Preview</h2>
      <p className={styles.sectionSubtitle}>
        How claims shift when reframed around boundaries rather than agents:
      </p>

      {synthesis.claimShifts.length > 0 && (
        <>
          <div className={styles.claimsTable}>
            <div className={styles.tableHeader}>
              <div className={styles.tableCell}>Claim</div>
              <div className={styles.tableCell}>Before</div>
              <div className={styles.tableCell}>Under Synthesis</div>
            </div>
            {synthesis.claimShifts.map((shift) => (
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
              {synthesis.summary.rescoped} claim
              {synthesis.summary.rescoped !== 1 ? "s are" : " is"} re-scoped.{" "}
              {synthesis.summary.reframed} claim
              {synthesis.summary.reframed !== 1 ? "s are" : " is"} reframed.{" "}
              {synthesis.summary.weakened} claim
              {synthesis.summary.weakened !== 1 ? "s are" : " is"} weakened.
            </p>
          </div>
        </>
      )}

      {synthesis.originalAbstract && synthesis.synthesisAbstract && (
        <div className={styles.abstractSection}>
          <h3 className={styles.abstractTitle}>Revised Abstract</h3>
          <div className={styles.abstractComparison}>
            <div className={styles.abstractColumn}>
              <h4 className={styles.abstractLabel}>Original</h4>
              <div className={styles.abstractText}>
                {synthesis.originalAbstract}
              </div>
            </div>
            <div className={styles.abstractColumn}>
              <h4 className={styles.abstractLabel}>Synthesis Framing</h4>
              <div className={styles.abstractText}>
                {synthesis.synthesisAbstract}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

