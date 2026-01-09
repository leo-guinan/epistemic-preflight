"use client";

import { useState } from "react";
import styles from "./VenueReviewResults.module.css";
import type { ReviewerReport, MetaReviewerReport } from "@/lib/venue-spec-types";

interface VenueReviewResultsProps {
  reviewerReports: ReviewerReport[];
  metaReviewerReport: MetaReviewerReport;
  decisionForecast: {
    accept: number;
    weakAccept: number;
    weakReject: number;
    reject: number;
  };
  topChanges: Array<{
    priority: number;
    description: string;
    claimId?: string;
    reviewerId?: string;
  }>;
  venueFitScorecard: {
    overallFit: number;
    reasons: string[];
  };
  onApplyFixes?: () => void;
  onBack?: () => void;
}

export function VenueReviewResults({
  reviewerReports,
  metaReviewerReport,
  decisionForecast,
  topChanges,
  venueFitScorecard,
  onApplyFixes,
  onBack,
}: VenueReviewResultsProps) {
  const [expandedReviewer, setExpandedReviewer] = useState<string | null>(null);

  const getDecisionColor = (probability: number) => {
    if (probability > 0.5) return "#4caf50";
    if (probability > 0.3) return "#ff9800";
    return "#f44336";
  };

  const getRecommendationColor = (rec: string) => {
    switch (rec) {
      case "accept":
        return "#4caf50";
      case "weak-accept":
        return "#8bc34a";
      case "weak-reject":
        return "#ff9800";
      case "reject":
        return "#f44336";
      default:
        return "#666";
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Venue Review Panel Results</h1>
        <p className={styles.subtitle}>
          Simulated reviewer reports based on venue norms and known rejection patterns.
        </p>
      </div>

      {/* Decision Forecast */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Decision Forecast</h2>
        <div className={styles.decisionGrid}>
          <div className={styles.decisionCard}>
            <div className={styles.decisionLabel}>Accept</div>
            <div
              className={styles.decisionBar}
              style={{
                width: `${decisionForecast.accept * 100}%`,
                backgroundColor: getDecisionColor(decisionForecast.accept),
              }}
            />
            <div className={styles.decisionPercent}>
              {(decisionForecast.accept * 100).toFixed(0)}%
            </div>
          </div>
          <div className={styles.decisionCard}>
            <div className={styles.decisionLabel}>Weak Accept</div>
            <div
              className={styles.decisionBar}
              style={{
                width: `${decisionForecast.weakAccept * 100}%`,
                backgroundColor: getDecisionColor(decisionForecast.weakAccept),
              }}
            />
            <div className={styles.decisionPercent}>
              {(decisionForecast.weakAccept * 100).toFixed(0)}%
            </div>
          </div>
          <div className={styles.decisionCard}>
            <div className={styles.decisionLabel}>Weak Reject</div>
            <div
              className={styles.decisionBar}
              style={{
                width: `${decisionForecast.weakReject * 100}%`,
                backgroundColor: getDecisionColor(decisionForecast.weakReject),
              }}
            />
            <div className={styles.decisionPercent}>
              {(decisionForecast.weakReject * 100).toFixed(0)}%
            </div>
          </div>
          <div className={styles.decisionCard}>
            <div className={styles.decisionLabel}>Reject</div>
            <div
              className={styles.decisionBar}
              style={{
                width: `${decisionForecast.reject * 100}%`,
                backgroundColor: getDecisionColor(decisionForecast.reject),
              }}
            />
            <div className={styles.decisionPercent}>
              {(decisionForecast.reject * 100).toFixed(0)}%
            </div>
          </div>
        </div>
      </div>

      {/* Venue Fit Scorecard */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Venue Fit Scorecard</h2>
        <div className={styles.fitCard}>
          <div className={styles.fitScore}>
            <span className={styles.fitLabel}>Overall Fit:</span>
            <span
              className={styles.fitValue}
              style={{
                color: getDecisionColor(venueFitScorecard.overallFit),
              }}
            >
              {(venueFitScorecard.overallFit * 100).toFixed(0)}%
            </span>
          </div>
          <div className={styles.fitReasons}>
            <h3>Why this belongs/doesn't belong:</h3>
            <ul>
              {venueFitScorecard.reasons.map((reason, idx) => (
                <li key={idx}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Top 5 Required Changes */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Top 5 Required Changes</h2>
        <div className={styles.changesList}>
          {topChanges.map((change, idx) => (
            <div key={idx} className={styles.changeItem}>
              <div className={styles.changeHeader}>
                <span className={styles.changeRank}>#{change.priority}</span>
                <span className={styles.changeDescription}>
                  {change.description}
                </span>
              </div>
              {change.claimId && (
                <div className={styles.changeMeta}>
                  Related to: Claim {change.claimId}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Meta-Reviewer Summary */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Meta-Reviewer Summary</h2>
        <div className={styles.metaCard}>
          <div className={styles.metaSection}>
            <h3>Consensus</h3>
            <p>{metaReviewerReport.consensus.agreement}</p>
          </div>
          <div className={styles.metaSection}>
            <h3>Disagreement</h3>
            <p>{metaReviewerReport.consensus.disagreement}</p>
          </div>
          <div className={styles.metaSection}>
            <h3>If you only fix 2 things:</h3>
            <ol>
              {metaReviewerReport.top2Changes.map((change, idx) => (
                <li key={idx}>{change}</li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Individual Reviewer Reports */}
      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Individual Reviewer Reports</h2>
        <div className={styles.reviewersList}>
          {reviewerReports.map((report) => (
            <div key={report.reviewerId} className={styles.reviewerCard}>
              <div
                className={styles.reviewerHeader}
                onClick={() =>
                  setExpandedReviewer(
                    expandedReviewer === report.reviewerId ? null : report.reviewerId
                  )
                }
              >
                <div className={styles.reviewerInfo}>
                  <h3 className={styles.reviewerName}>{report.reviewerName}</h3>
                  <div
                    className={styles.recommendationBadge}
                    style={{
                      backgroundColor: getRecommendationColor(
                        report.recommendation
                      ),
                    }}
                  >
                    {report.recommendation.replace("-", " ").toUpperCase()}
                  </div>
                </div>
                <div className={styles.reviewerScores}>
                  <div className={styles.scoreItem}>
                    <span>Novelty:</span>
                    <span>{report.scoreBreakdown.novelty}/10</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span>Validity:</span>
                    <span>{report.scoreBreakdown.validity}/10</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span>Clarity:</span>
                    <span>{report.scoreBreakdown.clarity}/10</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span>Impact:</span>
                    <span>{report.scoreBreakdown.impact}/10</span>
                  </div>
                  <div className={styles.scoreItem}>
                    <span>Fit:</span>
                    <span>{report.scoreBreakdown.fit}/10</span>
                  </div>
                </div>
                <button className={styles.expandButton}>
                  {expandedReviewer === report.reviewerId ? "−" : "+"}
                </button>
              </div>

              {expandedReviewer === report.reviewerId && (
                <div className={styles.reviewerDetails}>
                  <div className={styles.detailSection}>
                    <h4>Summary</h4>
                    <p>{report.summaryIn3Sentences}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <h4>Main Contribution</h4>
                    <p>{report.mainContribution}</p>
                  </div>
                  <div className={styles.detailSection}>
                    <h4>Strengths</h4>
                    <ul>
                      {report.strengths.map((strength, idx) => (
                        <li key={idx}>{strength}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.detailSection}>
                    <h4>Weaknesses</h4>
                    <ul>
                      {report.weaknesses.map((weakness, idx) => (
                        <li key={idx}>{weakness}</li>
                      ))}
                    </ul>
                  </div>
                  <div className={styles.detailSection}>
                    <h4>Questions for Authors</h4>
                    <ul>
                      {report.questionsForAuthors.map((question, idx) => (
                        <li key={idx}>{question}</li>
                      ))}
                    </ul>
                  </div>
                  {report.claimActions.length > 0 && (
                    <div className={styles.detailSection}>
                      <h4>Claim Actions</h4>
                      <ul>
                        {report.claimActions.map((action, idx) => (
                          <li key={idx}>
                            <strong>{action.action}:</strong> {action.description}
                            {action.claimId && ` (Claim ${action.claimId})`}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        {onBack && (
          <button onClick={onBack} className={styles.backButton}>
            Back
          </button>
        )}
        {onApplyFixes && (
          <button onClick={onApplyFixes} className={styles.applyButton}>
            Apply Fixes to Claim Graph
          </button>
        )}
      </div>
    </div>
  );
}

