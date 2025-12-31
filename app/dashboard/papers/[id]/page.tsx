"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

interface Paper {
  id: string;
  title: string | null;
  intent: string | null;
  targetVenue: string | null;
  createdAt: string;
  updatedAt: string;
  coreClaims: Array<{
    id: string;
    text: string;
    type: string;
    importance: number;
  }>;
  riskSignal: string | null;
  comparators: string[] | null;
  fullAnalysis: {
    overlap: string;
    conflict: string;
    novel: string;
    risks: string[];
    reframing: string[];
  } | null;
}

export default function PaperDetailPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const params = useParams();
  const [paper, setPaper] = useState<Paper | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    if (user && params?.id) {
      fetchPaper(params.id as string);
    }
  }, [user, userLoading, params, router]);

  const fetchPaper = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/papers/${id}`);
      if (!response.ok) {
        throw new Error("Failed to fetch paper");
      }
      const data = await response.json();
      setPaper(data.paper);
    } catch (error) {
      console.error("Error fetching paper:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (userLoading || isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!user || !paper) {
    return null;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Link href="/dashboard" className={styles.backLink}>
          ← Back to Dashboard
        </Link>
        <h1 className={styles.title}>{paper.title || "Paper Analysis"}</h1>
        {paper.intent && (
          <div className={styles.meta}>
            <span className={styles.intent}>{paper.intent}</span>
            {paper.targetVenue && (
              <span className={styles.venue}>{paper.targetVenue}</span>
            )}
          </div>
        )}
      </div>

      <div className={styles.content}>
        {/* Core Claims */}
        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Core Claims</h2>
          <div className={styles.claimsList}>
            {paper.coreClaims.map((claim) => (
              <div key={claim.id} className={styles.claim}>
                <div className={styles.claimHeader}>
                  <span className={styles.claimType}>{claim.type}</span>
                  <span className={styles.claimImportance}>
                    Importance: {claim.importance}/10
                  </span>
                </div>
                <p className={styles.claimText}>{claim.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Risk Signal */}
        {paper.riskSignal && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Risk Signal</h2>
            <div className={styles.riskBox}>
              <p>{paper.riskSignal}</p>
            </div>
          </section>
        )}

        {/* Full Analysis */}
        {paper.fullAnalysis && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Full Analysis</h2>
            
            <div className={styles.analysisGrid}>
              <div className={styles.analysisCard}>
                <h3 className={styles.analysisCardTitle}>Overlap</h3>
                <p className={styles.analysisText}>
                  {paper.fullAnalysis.overlap}
                </p>
              </div>

              <div className={styles.analysisCard}>
                <h3 className={styles.analysisCardTitle}>Conflict</h3>
                <p className={styles.analysisText}>
                  {paper.fullAnalysis.conflict}
                </p>
              </div>

              <div className={styles.analysisCard}>
                <h3 className={styles.analysisCardTitle}>Novel</h3>
                <p className={styles.analysisText}>
                  {paper.fullAnalysis.novel}
                </p>
              </div>
            </div>

            {paper.fullAnalysis.risks.length > 0 && (
              <div className={styles.risksSection}>
                <h3 className={styles.risksTitle}>Reviewer Risks</h3>
                <ul className={styles.risksList}>
                  {paper.fullAnalysis.risks.map((risk, index) => (
                    <li key={index} className={styles.riskItem}>
                      {risk}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {paper.fullAnalysis.reframing.length > 0 && (
              <div className={styles.reframingSection}>
                <h3 className={styles.reframingTitle}>Reframing Suggestions</h3>
                <ul className={styles.reframingList}>
                  {paper.fullAnalysis.reframing.map((suggestion, index) => (
                    <li key={index} className={styles.reframingItem}>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>
        )}

        <div className={styles.footer}>
          <Link href="/preflight" className={styles.newAnalysisButton}>
            Start New Analysis
          </Link>
        </div>
      </div>
    </div>
  );
}

