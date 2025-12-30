"use client";

import { useState } from "react";
import { IntentDeclaration } from "./components/IntentDeclaration";
import { PaperUpload } from "./components/PaperUpload";
import { ImmediateAnalysis } from "./components/ImmediateAnalysis";
import { ComparatorSelection } from "./components/ComparatorSelection";
import { FullAnalysis } from "./components/FullAnalysis";
import { AgencyMoment } from "./components/AgencyMoment";
import styles from "./page.module.css";

type PreflightState =
  | "intent"
  | "upload"
  | "analysis"
  | "comparators"
  | "full-analysis"
  | "agency";

type PaperIntent =
  | "introduce-theory"
  | "synthesize-frameworks"
  | "empirical-contribution"
  | "not-sure";

interface PreflightData {
  intent?: PaperIntent;
  targetVenue?: string;
  paperContent?: string;
  paperFile?: File;
  coreClaims?: Array<{
    id: string;
    text: string;
    type: "foundational" | "downstream" | "supporting";
    importance: number;
  }>;
  riskSignal?: string;
  comparators?: Array<File | string>;
}

export default function PreflightPage() {
  const [state, setState] = useState<PreflightState>("intent");
  const [data, setData] = useState<PreflightData>({});

  const handleIntentSubmit = (intent: PaperIntent, venue?: string) => {
    setData({ ...data, intent, targetVenue: venue });
    setState("upload");
  };

  const handlePaperUpload = async (content: string, file?: File) => {
    setData({ ...data, paperContent: content, paperFile: file });
    
    // Immediately trigger partial analysis
    setState("analysis");
    
    // Call API to get immediate analysis
    try {
      const response = await fetch("/api/preflight/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paperContent: content }),
      });
      
      const analysis = await response.json();
      setData({
        ...data,
        paperContent: content,
        paperFile: file,
        coreClaims: analysis.claims,
        riskSignal: analysis.riskSignal,
      });
    } catch (error) {
      console.error("Analysis error:", error);
    }
  };

  const handleAnalysisContinue = () => {
    setState("comparators");
  };

  const handleComparatorsSubmit = (comparators: Array<File | string>) => {
    setData({ ...data, comparators });
    setState("full-analysis");
  };

  const handleFullAnalysisComplete = () => {
    setState("agency");
  };

  return (
    <div className={styles.container}>
      {state === "intent" && (
        <IntentDeclaration onSubmit={handleIntentSubmit} />
      )}
      {state === "upload" && (
        <PaperUpload onSubmit={handlePaperUpload} />
      )}
      {state === "analysis" && (
        <ImmediateAnalysis
          claims={data.coreClaims || []}
          riskSignal={data.riskSignal}
          onContinue={handleAnalysisContinue}
        />
      )}
      {state === "comparators" && (
        <ComparatorSelection onSubmit={handleComparatorsSubmit} />
      )}
      {state === "full-analysis" && (
        <FullAnalysis
          paperContent={data.paperContent || ""}
          comparators={data.comparators || []}
          onComplete={handleFullAnalysisComplete}
        />
      )}
      {state === "agency" && (
        <AgencyMoment
          claims={data.coreClaims || []}
          riskSignal={data.riskSignal}
        />
      )}
    </div>
  );
}

