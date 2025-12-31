"use client";

import Link from "next/link";
import { fathomEvents } from "@/lib/fathom-tracking";
import styles from "./page.module.css";

export default function DemosPage() {
  const demos = [
    {
      id: "stochastic-parrots",
      title: "Stochastic Parrots",
      subtitle: "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?",
      authors: "Bender et al. (2021)",
      description: "The hero demo. See how adversarial claims transform into boundary decisions reviewers actually make. This is epistemic conflict resolution.",
      demoType: "conflict",
      preview: [
        "Claim extraction & importance weighting",
        "Conflict localization vs adjacent work",
        "Boundary-based synthesis recommendations",
      ],
    },
    {
      id: "attention",
      title: "Attention Is All You Need",
      subtitle: "The Transformer Architecture",
      authors: "Vaswani et al. (2017)",
      description: "Reverse-engineer a field's origin myth — and see which assumptions still silently govern the literature.",
      demoType: "foundational",
      preview: [
        "Foundational claim graph",
        "Dependency structure visualization",
        "What later papers implicitly inherit",
      ],
    },
    {
      id: "alignment",
      title: "Constitutional AI",
      subtitle: "Harmlessness from AI Feedback",
      authors: "Anthropic (2022)",
      description: "Where responsibility gets blurry — and why governance papers quietly reshape epistemic accountability.",
      demoType: "governance",
      preview: [
        "Responsibility localization shift",
        "Governance vs agent-level framing",
        "Reviewer risk signals",
      ],
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Epistemic Preflight Demos</h1>
        <p className={styles.subtitle}>
          See how the system changes how papers are read. Not summaries. Not automation.
          <br />
          <strong>Epistemic X-ray vision.</strong>
        </p>
      </div>

      <div className={styles.demosGrid}>
        {demos.map((demo) => (
          <Link
            key={demo.id}
            href={`/demos/${demo.id}`}
            className={styles.demoCard}
            onClick={() => {
              // Track demo card click
              fathomEvents.demoCardClicked(demo.id);
              // Store demo ID in sessionStorage to attribute signups
              sessionStorage.setItem('last_viewed_demo', demo.id);
            }}
          >
            <div className={styles.demoHeader}>
              <h2 className={styles.demoTitle}>{demo.title}</h2>
              <p className={styles.demoSubtitle}>{demo.subtitle}</p>
              <p className={styles.demoAuthors}>{demo.authors}</p>
            </div>
            <p className={styles.demoDescription}>{demo.description}</p>
            {demo.preview && (
              <div className={styles.previewSection}>
                <p className={styles.previewLabel}>What you'll see inside:</p>
                <ul className={styles.previewList}>
                  {demo.preview.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className={styles.demoType}>
              <span className={styles.typeBadge}>{demo.demoType}</span>
            </div>
          </Link>
        ))}
      </div>

      <div className={styles.footer}>
        <p>
          Ready to analyze your own paper?{" "}
          <Link href="/preflight" className={styles.ctaLink}>
            Start your analysis →
          </Link>
        </p>
      </div>
    </div>
  );
}

