"use client";

import { useState } from "react";
import styles from "./VenueIntake.module.css";
import type {
  ContributionType,
  EvidenceType,
  ClaimType,
  AudienceType,
  RiskTolerance,
} from "@/lib/venue-spec-types";

interface VenueIntakeProps {
  onSubmit: (intake: {
    contributionType: ContributionType;
    evidenceTypeAvailable: EvidenceType[];
    claimsAre: ClaimType;
    targetAudience: AudienceType;
    riskTolerance: RiskTolerance;
    whatsNew: string;
    reviewerAttacks: string;
  }) => void;
  onBack?: () => void;
}

export function VenueIntake({ onSubmit, onBack }: VenueIntakeProps) {
  const [contributionType, setContributionType] = useState<ContributionType | "">("");
  const [evidenceTypes, setEvidenceTypes] = useState<EvidenceType[]>([]);
  const [claimsAre, setClaimsAre] = useState<ClaimType | "">("");
  const [targetAudience, setTargetAudience] = useState<AudienceType | "">("");
  const [riskTolerance, setRiskTolerance] = useState<RiskTolerance | "">("");
  const [whatsNew, setWhatsNew] = useState("");
  const [reviewerAttacks, setReviewerAttacks] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const contributionOptions: ContributionType[] = [
    "theory",
    "method",
    "system",
    "dataset",
    "empirical-study",
    "position",
  ];

  const evidenceOptions: EvidenceType[] = [
    "experiments",
    "user-study",
    "proofs",
    "case-studies",
    "simulations",
    "none-yet",
  ];

  const claimTypeOptions: ClaimType[] = ["diagnostic", "prescriptive", "both"];

  const audienceOptions: AudienceType[] = [
    "technical",
    "socio-technical",
    "policy",
    "mixed",
  ];

  const riskOptions: RiskTolerance[] = ["conservative", "moderate", "bold"];

  const handleEvidenceToggle = (type: EvidenceType) => {
    setEvidenceTypes((prev) =>
      prev.includes(type)
        ? prev.filter((t) => t !== type)
        : [...prev, type]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (
      contributionType &&
      evidenceTypes.length > 0 &&
      claimsAre &&
      targetAudience &&
      riskTolerance &&
      whatsNew.trim() &&
      reviewerAttacks.trim()
    ) {
      setIsSubmitting(true);
      try {
        await onSubmit({
          contributionType,
          evidenceTypeAvailable: evidenceTypes,
          claimsAre,
          targetAudience,
          riskTolerance,
          whatsNew: whatsNew.trim(),
          reviewerAttacks: reviewerAttacks.trim(),
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to submit form");
        setIsSubmitting(false);
      }
    } else {
      setError("Please fill in all required fields");
    }
  };

  const isFormValid =
    contributionType &&
    evidenceTypes.length > 0 &&
    claimsAre &&
    targetAudience &&
    riskTolerance &&
    whatsNew.trim().length > 0 &&
    reviewerAttacks.trim().length > 0;

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Venue Intake</h1>
      <p className={styles.subtitle}>
        Help us understand your paper so we can provide targeted review feedback.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.section}>
          <label className={styles.label}>
            Contribution type <span className={styles.required}>*</span>
          </label>
          <div className={styles.options}>
            {contributionOptions.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="radio"
                  name="contributionType"
                  value={option}
                  checked={contributionType === option}
                  onChange={(e) =>
                    setContributionType(e.target.value as ContributionType)
                  }
                  disabled={isSubmitting}
                />
                <span>{option.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Evidence type available <span className={styles.required}>*</span>
          </label>
          <div className={styles.checkboxGroup}>
            {evidenceOptions.map((option) => (
              <label key={option} className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={evidenceTypes.includes(option)}
                  onChange={() => handleEvidenceToggle(option)}
                  disabled={isSubmitting}
                />
                <span>{option.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Claims are <span className={styles.required}>*</span>
          </label>
          <div className={styles.options}>
            {claimTypeOptions.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="radio"
                  name="claimsAre"
                  value={option}
                  checked={claimsAre === option}
                  onChange={(e) => setClaimsAre(e.target.value as ClaimType)}
                  disabled={isSubmitting}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Target audience <span className={styles.required}>*</span>
          </label>
          <div className={styles.options}>
            {audienceOptions.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="radio"
                  name="targetAudience"
                  value={option}
                  checked={targetAudience === option}
                  onChange={(e) =>
                    setTargetAudience(e.target.value as AudienceType)
                  }
                  disabled={isSubmitting}
                />
                <span>{option.replace("-", " ")}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label className={styles.label}>
            Risk tolerance <span className={styles.required}>*</span>
          </label>
          <div className={styles.options}>
            {riskOptions.map((option) => (
              <label key={option} className={styles.option}>
                <input
                  type="radio"
                  name="riskTolerance"
                  value={option}
                  checked={riskTolerance === option}
                  onChange={(e) =>
                    setRiskTolerance(e.target.value as RiskTolerance)
                  }
                  disabled={isSubmitting}
                />
                <span>{option}</span>
              </label>
            ))}
          </div>
        </div>

        <div className={styles.section}>
          <label htmlFor="whatsNew" className={styles.label}>
            What's new? (1-2 sentences) <span className={styles.required}>*</span>
          </label>
          <textarea
            id="whatsNew"
            value={whatsNew}
            onChange={(e) => setWhatsNew(e.target.value)}
            placeholder="Briefly describe what makes this paper novel or different from existing work..."
            className={styles.textarea}
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.section}>
          <label htmlFor="reviewerAttacks" className={styles.label}>
            What will reviewers attack? (1-2 sentences){" "}
            <span className={styles.required}>*</span>
          </label>
          <textarea
            id="reviewerAttacks"
            value={reviewerAttacks}
            onChange={(e) => setReviewerAttacks(e.target.value)}
            placeholder="What are the weak points reviewers are likely to criticize?"
            className={styles.textarea}
            rows={3}
            disabled={isSubmitting}
          />
        </div>

        <div className={styles.actions}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
              disabled={isSubmitting}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className={styles.submitButton}
          >
            {isSubmitting ? (
              <>
                <span style={{ marginRight: "8px" }}>⏳</span>
                Generating Review Panel...
              </>
            ) : (
              "Generate Review Panel"
            )}
          </button>
          {error && (
            <div style={{ color: "#d32f2f", marginTop: "16px", padding: "12px", backgroundColor: "#ffebee", borderRadius: "6px" }}>
              {error}
            </div>
          )}
          {isSubmitting && (
            <div style={{ marginTop: "16px", padding: "12px", backgroundColor: "#e3f2fd", borderRadius: "6px", color: "#1976d2" }}>
              <p style={{ margin: 0, fontWeight: 500 }}>
                Running multi-agent review panel... This may take 30-60 seconds.
              </p>
              <p style={{ margin: "8px 0 0 0", fontSize: "0.875rem", opacity: 0.8 }}>
                Our reviewers are analyzing your paper against venue-specific norms.
              </p>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}

