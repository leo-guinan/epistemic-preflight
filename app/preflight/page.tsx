"use client";

import { useState } from "react";
import { IntentDeclaration } from "./components/IntentDeclaration";
import { PaperUpload } from "./components/PaperUpload";
import { ImmediateAnalysis } from "./components/ImmediateAnalysis";
import { ComparatorSelection } from "./components/ComparatorSelection";
import { FullAnalysis } from "./components/FullAnalysis";
import { AgencyMoment } from "./components/AgencyMoment";
import { SynthesisPreview } from "./components/SynthesisPreview";
import { DisagreementPositioning } from "./components/DisagreementPositioning";
import { BoundaryReframing } from "./components/BoundaryReframing";
import { ClaimNarrowing } from "./components/ClaimNarrowing";
import styles from "./page.module.css";

type PreflightState =
  | "intent"
  | "upload"
  | "analysis"
  | "comparators"
  | "full-analysis"
  | "agency"
  | "synthesis-preview"
  | "disagreement-preview"
  | "boundary-preview"
  | "narrowing-preview";

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
    console.log("[Preflight] Paper upload started");
    console.log("[Preflight] Has file:", !!file);
    console.log("[Preflight] Has content:", !!content);
    console.log("[Preflight] File name:", file?.name);
    
    setData({ ...data, paperContent: content, paperFile: file });
    
    // Immediately trigger partial analysis
    setState("analysis");
    
    // Call API to get immediate analysis
    try {
      console.log("[Preflight] Sending request to API...");
      
      let response: Response;
      
      if (file) {
        // Send file via FormData
        console.log("[Preflight] Sending file via FormData");
        const formData = new FormData();
        formData.append("file", file);
        if (content) {
          formData.append("paperContent", content);
        }
        
        response = await fetch("/api/preflight/analyze", {
          method: "POST",
          body: formData, // Don't set Content-Type header - browser will set it with boundary
        });
      } else {
        // Send text content as JSON
        console.log("[Preflight] Sending text content as JSON");
        response = await fetch("/api/preflight/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paperContent: content }),
        });
      }
      
      console.log("[Preflight] Response status:", response.status);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("[Preflight] API error:", errorData);
        throw new Error(errorData.error || "Failed to analyze paper");
      }
      
      const analysis = await response.json();
      console.log("[Preflight] Analysis received:");
      console.log("[Preflight] - Claims:", analysis.claims?.length || 0);
      console.log("[Preflight] - Risk signal:", analysis.riskSignal || "None");
      
      // If we uploaded a file, we need to get the extracted text
      // The API should return it, but if not, we'll need to extract it again
      // For now, store what we have - the file will be sent again if needed
      // Store the extracted text from the API response if we uploaded a file
      const extractedText = analysis.extractedText || content;
      console.log("[Preflight] Storing paper content, length:", extractedText?.length || 0);
      
      setData({
        ...data,
        paperContent: extractedText || "", // Store extracted text from API or use provided content
        paperFile: file,
        coreClaims: analysis.claims,
        riskSignal: analysis.riskSignal,
      });
    } catch (error) {
      console.error("[Preflight] Analysis error:", error);
      alert(error instanceof Error ? error.message : "Failed to analyze paper. Please try again.");
      // Go back to upload state on error
      setState("upload");
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

  const handleAgencyChoice = (choiceId: string) => {
    console.log("[Preflight] Agency choice selected:", choiceId);
    switch (choiceId) {
      case "synthesis-framing":
        setState("synthesis-preview");
        break;
      case "own-disagreement":
        setState("disagreement-preview");
        break;
      case "reframe-boundary":
        setState("boundary-preview");
        break;
      case "narrow-claim":
        setState("narrowing-preview");
        break;
      default:
        console.warn("[Preflight] Unknown choice:", choiceId);
    }
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
          onChoiceSelect={handleAgencyChoice}
        />
      )}
      {state === "synthesis-preview" && (
        <SynthesisPreview
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
        />
      )}
      {state === "disagreement-preview" && (
        <DisagreementPositioning
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
          comparators={data.comparators}
        />
      )}
      {state === "boundary-preview" && (
        <BoundaryReframing
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
          comparators={data.comparators}
        />
      )}
      {state === "narrowing-preview" && (
        <ClaimNarrowing
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
        />
      )}
    </div>
  );
}

