"use client";

import { useState } from "react";
import styles from "./PaperUpload.module.css";

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
        setProcessingProgress("Uploading file...");
        
        // Upload to Supabase Storage and get processing job ID
        const formData = new FormData();
        formData.append("file", file);
        
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          const error = await uploadResponse.json();
          throw new Error(error.error || "Failed to upload file");
        }
        
        const { jobId } = await uploadResponse.json();
        console.log("[Upload] File uploaded, jobId:", jobId);
        
        // Poll for processing completion
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
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds
    
    for (let i = 0; i < maxAttempts; i++) {
      const response = await fetch(`/api/upload/status/${jobId}`);
      const data = await response.json();
      
      if (data.status === "completed") {
        return { extractedText: data.extractedText };
      }
      
      if (data.status === "failed") {
        throw new Error(data.error || "PDF processing failed");
      }
      
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }
    
    throw new Error("Processing timeout - please try again");
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

