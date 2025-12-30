"use client";

import styles from "./SynthesisCommitted.module.css";

interface SynthesisCommittedProps {
  commitId: string;
  onPreviewDraft: () => void;
  onTestReviewers: () => void;
  onExportSubmission: () => void;
  onCreateReviewerResponse: () => void;
}

export function SynthesisCommitted({
  commitId,
  onPreviewDraft,
  onTestReviewers,
  onExportSubmission,
  onCreateReviewerResponse,
}: SynthesisCommittedProps) {
  return (
    <div className={styles.container}>
      <div className={styles.confirmation}>
        <div className={styles.checkmark}>✓</div>
        <h1 className={styles.title}>Synthesis Applied</h1>
        <p className={styles.message}>
          Your draft now reflects a boundary-centered synthesis framing.
          <br />
          All changes are reversible and tracked.
        </p>
        <div className={styles.commitInfo}>
          <p>
            <strong>Commit ID:</strong> {commitId.substring(0, 8)}…
          </p>
        </div>
      </div>

      <div className={styles.nextOptions}>
        <h2 className={styles.optionsTitle}>What would you like to do next?</h2>
        <div className={styles.optionsGrid}>
          <button onClick={onPreviewDraft} className={styles.optionCard}>
            <div className={styles.optionIcon}>📄</div>
            <h3 className={styles.optionTitle}>Preview updated draft</h3>
            <p className={styles.optionDescription}>
              See how your paper reads with the synthesis framing applied
            </p>
          </button>

          <button onClick={onTestReviewers} className={styles.optionCard}>
            <div className={styles.optionIcon}>🔍</div>
            <h3 className={styles.optionTitle}>Test against reviewers</h3>
            <p className={styles.optionDescription}>
              Simulate how reviewers might respond to your reframed claims
            </p>
          </button>

          <button onClick={onExportSubmission} className={styles.optionCard}>
            <div className={styles.optionIcon}>📤</div>
            <h3 className={styles.optionTitle}>Export submission-ready version</h3>
            <p className={styles.optionDescription}>
              Download your paper with all synthesis changes applied
            </p>
          </button>

          <button onClick={onCreateReviewerResponse} className={styles.optionCard}>
            <div className={styles.optionIcon}>💬</div>
            <h3 className={styles.optionTitle}>Create reviewer response</h3>
            <p className={styles.optionDescription}>
              Generate a response document explaining your synthesis approach
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

