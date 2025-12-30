"use client";

import { useState } from "react";
import styles from "./AgencyMoment.module.css";

interface Claim {
  id: string;
  text: string;
  type: "foundational" | "downstream" | "supporting";
  importance: number;
}

interface AgencyMomentProps {
  claims: Claim[];
  riskSignal?: string;
}

export function AgencyMoment({ claims, riskSignal }: AgencyMomentProps) {
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);

  const choices = [
    {
      id: "own-disagreement",
      label: "Own this disagreement explicitly",
      description:
        "Acknowledge the conflict and position it as a deliberate choice.",
    },
    {
      id: "reframe-boundary",
      label: "Reframe around a boundary",
      description:
        "Reposition your work to sit at a different epistemic boundary.",
    },
    {
      id: "narrow-claim",
      label: "Narrow a claim",
      description: "Reduce scope to avoid over-claiming.",
    },
    {
      id: "synthesis-framing",
      label: "Explore a synthesis framing",
      description:
        "Position your work as synthesizing rather than competing.",
    },
  ];

  const handleChoiceSelect = (choiceId: string) => {
    setSelectedChoice(choiceId);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>What Would You Like to Do Next?</h1>
      <p className={styles.subtitle}>
        Based on this analysis, you can choose how to proceed. This is your
        decision — we're here to empower your judgment, not replace it.
      </p>

      <div className={styles.choices}>
        {choices.map((choice) => (
          <button
            key={choice.id}
            className={`${styles.choice} ${
              selectedChoice === choice.id ? styles.selected : ""
            }`}
            onClick={() => handleChoiceSelect(choice.id)}
          >
            <div className={styles.choiceHeader}>
              <input
                type="radio"
                name="choice"
                checked={selectedChoice === choice.id}
                onChange={() => handleChoiceSelect(choice.id)}
                className={styles.radio}
              />
              <h3 className={styles.choiceLabel}>{choice.label}</h3>
            </div>
            <p className={styles.choiceDescription}>{choice.description}</p>
          </button>
        ))}
      </div>

      {selectedChoice && (
        <div className={styles.nextSteps}>
          <p className={styles.nextStepsText}>
            Great choice. We can help you implement this reframing. Would you
            like to:
          </p>
          <div className={styles.actionButtons}>
            <button className={styles.actionButton}>
              Get Detailed Guidance
            </button>
            <button className={styles.actionButton}>Download Full Report</button>
            <button className={styles.actionButton}>Start Over</button>
          </div>
        </div>
      )}

      <div className={styles.footer}>
        <p className={styles.footerText}>
          Remember: This analysis shows you where responsibility and
          disagreement actually live. The choice of how to frame your work
          remains yours.
        </p>
      </div>
    </div>
  );
}

