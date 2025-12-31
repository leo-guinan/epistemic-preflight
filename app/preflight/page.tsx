"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/lib/hooks/use-user";
import { restorePreflightState, clearPreflightState, savePreflightState } from "@/lib/preflight-state";
import { IntentDeclaration } from "./components/IntentDeclaration";
import { PaperUpload } from "./components/PaperUpload";
import { ImmediateAnalysis } from "./components/ImmediateAnalysis";
import { ComparatorSelection } from "./components/ComparatorSelection";
import { FullAnalysis } from "./components/FullAnalysis";
import { AgencyMoment } from "./components/AgencyMoment";
import { SynthesisPreview } from "./components/SynthesisPreview";
import { SynthesisCommitPreview } from "./components/SynthesisCommitPreview";
import { SynthesisCommitted } from "./components/SynthesisCommitted";
import { DisagreementPositioning } from "./components/DisagreementPositioning";
import { BoundaryReframing } from "./components/BoundaryReframing";
import { ClaimNarrowing } from "./components/ClaimNarrowing";
import { fathomEvents } from "@/lib/fathom-tracking";
import styles from "./page.module.css";

type PreflightState =
  | "intent"
  | "upload"
  | "analysis"
  | "comparators"
  | "full-analysis"
  | "agency"
  | "synthesis-preview"
  | "synthesis-commit-preview"
  | "synthesis-committed"
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
  commitId?: string;
  paperId?: string;
  fullAnalysisResult?: any;
}

export default function PreflightPage() {
  const { user, isLoading: userLoading } = useUser();
  const [state, setState] = useState<PreflightState>("intent");
  const [data, setData] = useState<PreflightData>({});
  const [hasRestoredState, setHasRestoredState] = useState(false);

  // Helper function to save paper to database
  const savePaperToDatabase = async (paperData: PreflightData, currentState: string) => {
    if (!user) return;

    // Validate required data before attempting to save
    if (!paperData.paperContent || paperData.paperContent.trim().length === 0) {
      console.warn("[Preflight] Cannot save paper: paperContent is empty");
      return;
    }

    try {
      const payload = {
        title: paperData.paperFile?.name || "Untitled Paper",
        intent: paperData.intent,
        targetVenue: paperData.targetVenue,
        paperContent: paperData.paperContent,
        fileName: paperData.paperFile?.name,
        coreClaims: paperData.coreClaims || [],
        riskSignal: paperData.riskSignal,
        comparators: paperData.comparators?.map((c) => typeof c === "string" ? c : (c instanceof File ? c.name : String(c))) || [],
        fullAnalysis: paperData.fullAnalysisResult || null,
      };

      console.log("[Preflight] Saving paper to database:", {
        hasContent: !!payload.paperContent,
        contentLength: payload.paperContent?.length || 0,
        hasClaims: (payload.coreClaims?.length || 0) > 0,
      });

      const response = await fetch("/api/papers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log("[Preflight] Paper saved successfully:", result.paper.id);
        // Clear saved state from localStorage since it's now in the database
        clearPreflightState();
        // Store paper ID for future reference
        setData((prev) => ({ ...prev, paperId: result.paper.id }));
      } else {
        const errorText = await response.text();
        console.error("[Preflight] Failed to save paper:", response.status, errorText);
        // Don't clear localStorage if save fails - user can try again
      }
    } catch (error) {
      console.error("[Preflight] Error saving paper:", error);
      // Don't clear localStorage if save fails - user can try again
    }
  };

  // Restore state from localStorage on mount (only if returning from OAuth or has actual progress)
  useEffect(() => {
    if (!hasRestoredState && !userLoading) {
      // Check if we're returning from OAuth (check sessionStorage flag)
      const returningFromOAuth = sessionStorage.getItem("returning_from_oauth") === "true";
      
      // Only restore state if:
      // 1. We're returning from OAuth, OR
      // 2. There's saved state with actual paper content (not just intent)
      const savedState = restorePreflightState();
      if (savedState && (returningFromOAuth || savedState.data.paperContent)) {
        console.log("[Preflight] Restoring saved state:", savedState.state);
        setState(savedState.state as PreflightState);
        // Type-safe restoration: cast intent to PaperIntent if it's a valid value
        const restoredData: PreflightData = {
          ...savedState.data,
          intent: savedState.data.intent as PaperIntent | undefined,
        };
        setData(restoredData);
        setHasRestoredState(true);
        // Clear the OAuth flag after using it
        if (returningFromOAuth) {
          sessionStorage.removeItem("returning_from_oauth");
        }
      } else {
        // Clear stale state if it exists but shouldn't be restored
        if (savedState && !returningFromOAuth && !savedState.data.paperContent) {
          console.log("[Preflight] Clearing stale state, starting fresh");
          clearPreflightState();
        }
        setHasRestoredState(true);
      }
    }
  }, [userLoading, hasRestoredState]);

  // Save to database when user becomes available after restoring state
  // Only save if we have actual paper content and analysis data
  useEffect(() => {
    if (
      hasRestoredState && 
      user && 
      data.paperContent && 
      data.paperContent.trim().length > 0 && 
      data.coreClaims && 
      data.coreClaims.length > 0 &&
      !data.paperId
    ) {
      // User just signed in and we have restored state with actual analysis - save to database
      console.log("[Preflight] User signed in, saving restored paper to database");
      savePaperToDatabase(data, state);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasRestoredState, data.paperContent, data.coreClaims, data.paperId, state]);

  // Move anonymous files to permanent location after sign-in
  useEffect(() => {
    if (hasRestoredState && user && !userLoading) {
      const sessionId = sessionStorage.getItem("preflight_session_id");
      
      if (sessionId) {
        // Move any temp files to permanent location (background task)
        moveAnonymousFilesToPermanent(sessionId).catch((error) => {
          console.error("[Preflight] Error moving anonymous files:", error);
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasRestoredState, userLoading]);

  const moveAnonymousFilesToPermanent = async (sessionId: string) => {
    try {
      // Find anonymous jobs for this session
      const response = await fetch(`/api/upload/pending?sessionId=${encodeURIComponent(sessionId)}`);
      if (!response.ok) return;
      
      const { jobs } = await response.json();
      if (!jobs || jobs.length === 0) return;

      console.log("[Preflight] Moving anonymous files to permanent location:", jobs.length);
      
      // Move each file (this happens in the background)
      for (const job of jobs) {
        try {
          await fetch("/api/upload/complete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              jobId: job.jobId,
              sessionId: sessionId,
            }),
          });
        } catch (error) {
          console.error("[Preflight] Error moving file:", job.jobId, error);
        }
      }
    } catch (error) {
      console.error("[Preflight] Error fetching pending files:", error);
    }
  };

  // Save state to localStorage whenever it changes (but not on initial restore or if at intent step)
  useEffect(() => {
    if (hasRestoredState && state !== "intent") {
      savePreflightState(state, data);
    } else if (hasRestoredState && state === "intent") {
      // Clear any stale state when user is at intent step (fresh start)
      clearPreflightState();
    }
  }, [state, data, hasRestoredState]);

  const handleIntentSubmit = (intent: PaperIntent, venue?: string) => {
    fathomEvents.intentDeclared(intent);
    setData({ ...data, intent, targetVenue: venue });
    setState("upload");
  };

  const handlePaperUpload = async (content: string, file?: File) => {
    console.log("[Preflight] Paper upload started");
    console.log("[Preflight] Has file:", !!file);
    console.log("[Preflight] Has content:", !!content);
    console.log("[Preflight] Content length:", content.length);
    console.log("[Preflight] File name:", file?.name);
    
    // Track paper upload
    fathomEvents.paperUploaded(file ? 'file' : 'paste');
    
    setData({ ...data, paperContent: content, paperFile: file });
    
    // Immediately trigger partial analysis
    setState("analysis");
    
    // Call API to get immediate analysis
    try {
      console.log("[Preflight] Sending request to API...");
      
      // If we have text content (from client-side PDF processing), send as JSON
      // This avoids Vercel's 4.5MB request limit
      // Only send file via FormData if we don't have text content yet
      let response: Response;
      
      if (content && content.trim().length > 0) {
        // Send text content as JSON (even if we have a file - file is just for metadata)
        console.log("[Preflight] Sending text content as JSON (client-side processed)");
        response = await fetch("/api/preflight/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            paperContent: content,
            fileName: file?.name, // Include filename for reference
          }),
        });
      } else if (file) {
        // Fallback: Send file via FormData (for non-PDF files or if client-side processing failed)
        console.log("[Preflight] Sending file via FormData");
        const formData = new FormData();
        formData.append("file", file);
        
        response = await fetch("/api/preflight/analyze", {
          method: "POST",
          body: formData, // Don't set Content-Type header - browser will set it with boundary
        });
      } else {
        throw new Error("No content or file provided");
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

      // Track analysis completion
      fathomEvents.analysisCompleted(analysis.claims?.length || 0);
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

  const handleFullAnalysisComplete = async (fullAnalysis?: any) => {
    fathomEvents.fullAnalysisCompleted();
    
    // Store full analysis in data
    const updatedData = { ...data, fullAnalysisResult: fullAnalysis };
    setData(updatedData);
    
    // Save paper if user is signed in (optional - they can continue without saving)
    if (user) {
      await savePaperToDatabase(updatedData, "agency");
    }
    
    setState("agency");
  };

  const handleAgencyChoice = (choiceId: string) => {
    console.log("[Preflight] Agency choice selected:", choiceId);
    fathomEvents.agencyChoiceSelected(choiceId);
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

  const handleSynthesisApply = () => {
    fathomEvents.synthesisApplied();
    setState("synthesis-commit-preview");
  };

  const handleCommitComplete = (commitId: string) => {
    fathomEvents.synthesisCommitted();
    setData({ ...data, commitId });
    setState("synthesis-committed");
  };

  const handleCommitCancel = () => {
    setState("synthesis-preview");
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
          currentState={state}
          currentData={data}
        />
      )}
      {state === "synthesis-preview" && (
        <SynthesisPreview
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
          onApply={handleSynthesisApply}
        />
      )}
      {state === "synthesis-commit-preview" && (
        <SynthesisCommitPreview
          claims={data.coreClaims || []}
          paperContent={data.paperContent || ""}
          paperFile={data.paperFile}
          onCommit={handleCommitComplete}
          onCancel={handleCommitCancel}
        />
      )}
      {state === "synthesis-committed" && (
        <SynthesisCommitted
          commitId={data.commitId || ""}
          onPreviewDraft={() => {
            // TODO: Implement preview draft
            console.log("Preview draft");
          }}
          onTestReviewers={() => {
            // TODO: Implement test reviewers
            console.log("Test reviewers");
          }}
          onExportSubmission={() => {
            // TODO: Implement export submission
            console.log("Export submission");
          }}
          onCreateReviewerResponse={() => {
            // TODO: Implement reviewer response
            console.log("Create reviewer response");
          }}
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

