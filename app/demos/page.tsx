"use client";

import Link from "next/link";
import styles from "./page.module.css";

export default function DemosPage() {
  const demos = [
    {
      id: "stochastic-parrots",
      title: "Stochastic Parrots",
      subtitle: "On the Dangers of Stochastic Parrots: Can Language Models Be Too Big?",
      authors: "Bender et al. (2021)",
      description: "The hero demo. Watch how adversarial claims become boundary questions. This is epistemic conflict resolution.",
      demoType: "conflict",
      featured: true,
    },
    {
      id: "attention",
      title: "Attention Is All You Need",
      subtitle: "The Transformer Architecture",
      authors: "Vaswani et al. (2017)",
      description: "Reverse-engineer a field's origin myth. See the foundational claims that birthed an entire research paradigm.",
      demoType: "foundational",
      featured: false,
    },
    {
      id: "alignment",
      title: "Constitutional AI",
      subtitle: "Harmlessness from AI Feedback",
      authors: "Anthropic (2022)",
      description: "Where responsibility gets blurry. See how claims shift from 'models are dangerous' to 'governance is solved'.",
      demoType: "governance",
      featured: false,
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
            className={`${styles.demoCard} ${demo.featured ? styles.featured : ""}`}
          >
            {demo.featured && (
              <div className={styles.featuredBadge}>Hero Demo</div>
            )}
            <div className={styles.demoHeader}>
              <h2 className={styles.demoTitle}>{demo.title}</h2>
              <p className={styles.demoSubtitle}>{demo.subtitle}</p>
              <p className={styles.demoAuthors}>{demo.authors}</p>
            </div>
            <p className={styles.demoDescription}>{demo.description}</p>
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

