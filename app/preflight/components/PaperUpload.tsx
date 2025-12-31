"use client";

import { useState } from "react";
import { processPDFClient } from "@/lib/pdf-client";
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
        console.log("[Upload] Processing file:", file.name, file.size, "bytes");
        
        // Check file size and warn if very large
        const fileSizeMB = file.size / (1024 * 1024);
        if (fileSizeMB > 10) {
          const proceed = confirm(
            `This file is ${fileSizeMB.toFixed(1)}MB. Processing may take a while. Continue?`
          );
          if (!proceed) {
            setIsProcessing(false);
            return;
          }
        }

        // Process PDF client-side if it's a PDF
        if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
          setProcessingProgress("Extracting text from PDF...");
          console.log("[Upload] Processing PDF client-side...");
          
          try {
            const processed = await processPDFClient(file);
            console.log("[Upload] PDF processed:", processed.pageCount, "pages");
            console.log("[Upload] Extracted text length:", processed.text.length);
            setProcessingProgress(`Extracted ${processed.pageCount} pages. Sending for analysis...`);
            
            // Send only the extracted text, not the file
            onSubmit(processed.text, file); // Pass file for metadata (name, etc.)
          } catch (error) {
            console.error("[Upload] PDF processing error:", error);
            throw new Error(
              "Failed to process PDF. Please ensure it's a valid PDF file and try again."
            );
          }
        } else {
          // For non-PDF files, read as text
          setProcessingProgress("Reading file...");
          const text = await file.text();
          onSubmit(text, file);
        }
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

