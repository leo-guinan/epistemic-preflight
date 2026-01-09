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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      contributionType &&
      evidenceTypes.length > 0 &&
      claimsAre &&
      targetAudience &&
      riskTolerance &&
      whatsNew.trim() &&
      reviewerAttacks.trim()
    ) {
      onSubmit({
        contributionType,
        evidenceTypeAvailable: evidenceTypes,
        claimsAre,
        targetAudience,
        riskTolerance,
        whatsNew: whatsNew.trim(),
        reviewerAttacks: reviewerAttacks.trim(),
      });
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
          />
        </div>

        <div className={styles.actions}>
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className={styles.backButton}
            >
              Back
            </button>
          )}
          <button
            type="submit"
            disabled={!isFormValid}
            className={styles.submitButton}
          >
            Generate Review Panel
          </button>
        </div>
      </form>
    </div>
  );
}

