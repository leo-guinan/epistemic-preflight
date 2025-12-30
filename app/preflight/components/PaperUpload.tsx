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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      if (uploadMethod === "file" && file) {
        console.log("[Upload] Processing file:", file.name, file.size, "bytes");
        // Send file directly to API - it will handle PDF processing
        onSubmit("", file);
      } else if (uploadMethod === "paste" && abstract) {
        console.log("[Upload] Processing pasted text, length:", abstract.length);
        onSubmit(abstract);
      }
    } catch (error) {
      console.error("[Upload] Error:", error);
      alert("Error processing paper. Please try again.");
    } finally {
      setIsProcessing(false);
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

