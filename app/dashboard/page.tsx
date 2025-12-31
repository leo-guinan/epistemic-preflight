"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { useRouter } from "next/navigation";
import Link from "next/link";
import styles from "./page.module.css";

interface Paper {
  id: string;
  title: string | null;
  intent: string | null;
  createdAt: string;
  updatedAt: string;
  coreClaims: any[];
  riskSignal: string | null;
}

export default function DashboardPage() {
  const { user, isLoading: userLoading } = useUser();
  const router = useRouter();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/auth/signin?callbackUrl=/dashboard");
      return;
    }

    if (user) {
      fetchPapers();
    }
  }, [user, userLoading, router]);

  const fetchPapers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/papers");
      if (!response.ok) {
        throw new Error("Failed to fetch papers");
      }
      const data = await response.json();
      setPapers(data.papers.map((p: any) => ({
        ...p,
        coreClaims: JSON.parse(p.coreClaims),
      })));
    } catch (error) {
      console.error("Error fetching papers:", error);
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

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>My Papers</h1>
          <Link href="/preflight" className={styles.newPaperButton}>
            + New Analysis
          </Link>
        </div>
        {user.email && (
          <p className={styles.userEmail}>Signed in as {user.email}</p>
        )}
      </div>

      {papers.length === 0 ? (
        <div className={styles.emptyState}>
          <h2 className={styles.emptyTitle}>No papers yet</h2>
          <p className={styles.emptyDescription}>
            Get started by analyzing your first paper.
          </p>
          <Link href="/preflight" className={styles.emptyButton}>
            Start Your First Analysis
          </Link>
        </div>
      ) : (
        <div className={styles.papersGrid}>
          {papers.map((paper) => (
            <Link
              key={paper.id}
              href={`/dashboard/papers/${paper.id}`}
              className={styles.paperCard}
            >
              <div className={styles.paperHeader}>
                <h3 className={styles.paperTitle}>
                  {paper.title || "Untitled Paper"}
                </h3>
                {paper.intent && (
                  <span className={styles.paperIntent}>{paper.intent}</span>
                )}
              </div>
              <div className={styles.paperMeta}>
                <div className={styles.paperStats}>
                  <span>{paper.coreClaims?.length || 0} claims identified</span>
                  {paper.riskSignal && (
                    <span className={styles.riskIndicator}>⚠️ Risk flagged</span>
                  )}
                </div>
                <div className={styles.paperDate}>
                  {new Date(paper.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

