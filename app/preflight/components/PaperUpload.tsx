"use client";

import { useState } from "react";
import styles from "./PaperUpload.module.css";
import { uploadFileDirectly } from "@/lib/supabase-storage-client";

interface PaperUploadProps {
  onSubmit: (content: string, file?: File) => void;
}

export function PaperUpload({ onSubmit }: PaperUploadProps) {
  const [uploadMethod, setUploadMethod] = useState<"file" | "paste">("file");
  const [file, setFile] = useState<File | null>(null);
  const [abstract, setAbstract] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState<string>("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setProcessingProgress("");

    try {
      if (uploadMethod === "file" && file) {
        console.log("[Upload] Uploading file:", file.name, file.size, "bytes");
        
        // Step 1: Initialize upload job (get storage path)
        setProcessingProgress("Initializing upload...");
        
        // Get or create session ID for anonymous uploads
        let sessionId = sessionStorage.getItem("preflight_session_id");
        if (!sessionId) {
          sessionId = crypto.randomUUID();
          sessionStorage.setItem("preflight_session_id", sessionId);
        }
        
        const initResponse = await fetch("/api/upload/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            sessionId: sessionId,
          }),
        });
        
        if (!initResponse.ok) {
          const error = await initResponse.json();
          throw new Error(error.error || "Failed to initialize upload");
        }
        
        const { jobId, storagePath, bucket, sessionId: returnedSessionId } = await initResponse.json();
        console.log("[Upload] Upload initialized, jobId:", jobId);
        
        // Store session ID if returned
        if (returnedSessionId) {
          sessionStorage.setItem("preflight_session_id", returnedSessionId);
        }
        
        // Step 2: Upload directly to Supabase Storage (bypasses Vercel)
        setProcessingProgress("Uploading file to storage...");
        await uploadFileDirectly(bucket, storagePath, file);
        console.log("[Upload] File uploaded directly to Supabase Storage");
        
        // Step 3: Mark upload as complete and trigger processing
        setProcessingProgress("Starting processing...");
        const completeResponse = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            jobId,
            sessionId: sessionStorage.getItem("preflight_session_id"),
          }),
        });
        
        if (!completeResponse.ok) {
          const error = await completeResponse.json();
          throw new Error(error.error || "Failed to complete upload");
        }
        
        // Step 4: Poll for processing completion
        setProcessingProgress("Processing PDF...");
        const result = await pollForProcessing(jobId);
        
        // Continue with extracted text
        onSubmit(result.extractedText, file);
      } else if (uploadMethod === "paste" && abstract) {
        console.log("[Upload] Processing pasted text, length:", abstract.length);
        onSubmit(abstract);
      }
    } catch (error) {
      console.error("[Upload] Error:", error);
      alert(error instanceof Error ? error.message : "Error processing paper. Please try again.");
    } finally {
      setIsProcessing(false);
      setProcessingProgress("");
    }
  };

  const pollForProcessing = async (jobId: string): Promise<{ extractedText: string }> => {
    const maxAttempts = 90; // 7.5 minutes max (90 * 5s = 450s)
    const pollInterval = 5000; // 5 seconds
    const sessionId = sessionStorage.getItem("preflight_session_id");
    
    for (let i = 0; i < maxAttempts; i++) {
      // Include sessionId for anonymous jobs
      const url = sessionId 
        ? `/api/upload/status/${jobId}?sessionId=${encodeURIComponent(sessionId)}`
        : `/api/upload/status/${jobId}`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          throw new Error("Unauthorized to check job status");
        }
        throw new Error(`Failed to check status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const attempt = i + 1;
      console.log(`[Upload] Poll ${attempt}/${maxAttempts}: Status = ${data.status}`, data.error ? `Error: ${data.error}` : '');
      
      if (data.status === "completed") {
        console.log("[Upload] Processing completed successfully");
        return { extractedText: data.extractedText };
      }
      
      if (data.status === "failed") {
        console.error("[Upload] Processing failed:", data.error);
        throw new Error(data.error || "PDF processing failed");
      }
      
      // Show progress for long-running processing
      const attempt = i + 1;
      if (data.status === "processing") {
        console.log(`[Upload] Still processing... (attempt ${attempt}/${maxAttempts}, ~${Math.round(attempt * pollInterval / 1000)}s elapsed)`);
        setProcessingProgress(`Processing PDF... (${Math.round(attempt * pollInterval / 1000)}s)`);
      } else if (data.status === "uploaded") {
        console.log(`[Upload] Upload complete, waiting for processing to start... (attempt ${attempt}/${maxAttempts})`);
        setProcessingProgress("Starting processing...");
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error(`Processing timeout after ${Math.round(maxAttempts * pollInterval / 1000)}s - please try again or check the server logs`);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Upload Your Paper</h1>
      <p className={styles.subtitle}>
        Upload a PDF or paste your abstract to get started.
      </p>

      <div className={styles.methodToggle}>
        <button
          type="button"
          className={`${styles.toggleButton} ${
            uploadMethod === "file" ? styles.active : ""
          }`}
          onClick={() => setUploadMethod("file")}
        >
          Upload PDF
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${
            uploadMethod === "paste" ? styles.active : ""
          }`}
          onClick={() => setUploadMethod("paste")}
        >
          Paste Abstract
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {uploadMethod === "file" ? (
          <div className={styles.fileUpload}>
            <input
              type="file"
              id="paper-file"
              accept=".pdf,.md,.txt"
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <label htmlFor="paper-file" className={styles.fileLabel}>
              {file ? file.name : "Choose file or drag and drop"}
            </label>
            {file && (
              <p className={styles.fileInfo}>
                Selected: {file.name} ({(file.size / 1024).toFixed(0)} KB)
                {file.size > 5 * 1024 * 1024 && (
                  <span className={styles.warning}>
                    {" "}• Large file - processing may take longer
                  </span>
                )}
              </p>
            )}
          </div>
        ) : (
          <div className={styles.pasteArea}>
            <textarea
              value={abstract}
              onChange={(e) => setAbstract(e.target.value)}
              placeholder="Paste your paper's abstract or full text here..."
              className={styles.textarea}
              rows={12}
            />
          </div>
        )}

        {processingProgress && (
          <div className={styles.progress}>
            <p>{processingProgress}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={
            isProcessing ||
            (uploadMethod === "file" && !file) ||
            (uploadMethod === "paste" && !abstract.trim())
          }
          className={styles.submitButton}
        >
          {isProcessing ? "Processing..." : "Analyze Paper"}
        </button>
      </form>
    </div>
  );
}

