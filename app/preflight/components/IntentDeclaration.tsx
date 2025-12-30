"use client";

import { useState } from "react";
import styles from "./IntentDeclaration.module.css";

type PaperIntent =
  | "introduce-theory"
  | "synthesize-frameworks"
  | "empirical-contribution"
  | "not-sure";

interface IntentDeclarationProps {
  onSubmit: (intent: PaperIntent, venue?: string) => void;
}

export function IntentDeclaration({ onSubmit }: IntentDeclarationProps) {
  const [intent, setIntent] = useState<PaperIntent | null>(null);
  const [venue, setVenue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (intent) {
      onSubmit(intent, venue || undefined);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>What are you trying to do with this paper?</h1>
      <p className={styles.subtitle}>
        This helps us personalize the analysis to your goals.
      </p>

      <form onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.options}>
          <label className={styles.option}>
            <input
              type="radio"
              name="intent"
              value="introduce-theory"
              checked={intent === "introduce-theory"}
              onChange={(e) => setIntent(e.target.value as PaperIntent)}
            />
            <span>Introduce a new theory</span>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="intent"
              value="synthesize-frameworks"
              checked={intent === "synthesize-frameworks"}
              onChange={(e) => setIntent(e.target.value as PaperIntent)}
            />
            <span>Synthesize existing frameworks</span>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="intent"
              value="empirical-contribution"
              checked={intent === "empirical-contribution"}
              onChange={(e) => setIntent(e.target.value as PaperIntent)}
            />
            <span>Make an empirical contribution</span>
          </label>

          <label className={styles.option}>
            <input
              type="radio"
              name="intent"
              value="not-sure"
              checked={intent === "not-sure"}
              onChange={(e) => setIntent(e.target.value as PaperIntent)}
            />
            <span>Not sure yet</span>
          </label>
        </div>

        <div className={styles.venueSection}>
          <label htmlFor="venue" className={styles.venueLabel}>
            Target venue (optional)
          </label>
          <input
            id="venue"
            type="text"
            value={venue}
            onChange={(e) => setVenue(e.target.value)}
            placeholder="e.g., Nature, PNAS, Journal of..."
            className={styles.venueInput}
          />
        </div>

        <button
          type="submit"
          disabled={!intent}
          className={styles.submitButton}
        >
          Continue
        </button>
      </form>
    </div>
  );
}

