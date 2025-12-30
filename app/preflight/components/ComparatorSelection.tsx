"use client";

import { useState } from "react";
import styles from "./ComparatorSelection.module.css";

interface ComparatorSelectionProps {
  onSubmit: (comparators: Array<File | string>) => void;
}

export function ComparatorSelection({ onSubmit }: ComparatorSelectionProps) {
  const [method, setMethod] = useState<"upload" | "citations">("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [citations, setCitations] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(selectedFiles);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (method === "upload" && files.length > 0) {
      onSubmit(files);
    } else if (method === "citations" && citations.trim()) {
      // Split citations by newline or comma
      const citationList = citations
        .split(/[\n,]/)
        .map((c) => c.trim())
        .filter((c) => c.length > 0);
      onSubmit(citationList);
    }
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Which work do you expect reviewers to compare this to?</h1>
      <p className={styles.subtitle}>
        Upload comparator papers or paste citations/DOIs. This helps us map
        where you overlap, conflict, or diverge.
      </p>

      <div className={styles.methodToggle}>
        <button
          type="button"
          className={`${styles.toggleButton} ${
            method === "upload" ? styles.active : ""
          }`}
          onClick={() => setMethod("upload")}
        >
          Upload Papers
        </button>
        <button
          type="button"
          className={`${styles.toggleButton} ${
            method === "citations" ? styles.active : ""
          }`}
          onClick={() => setMethod("citations")}
        >
          Paste Citations / DOIs
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.form}>
        {method === "upload" ? (
          <div className={styles.uploadSection}>
            <input
              type="file"
              id="comparator-files"
              accept=".pdf,.md,.txt"
              multiple
              onChange={handleFileChange}
              className={styles.fileInput}
            />
            <label htmlFor="comparator-files" className={styles.fileLabel}>
              Upload 1-3 comparator papers
            </label>
            {files.length > 0 && (
              <div className={styles.fileList}>
                {files.map((file, index) => (
                  <div key={index} className={styles.fileItem}>
                    {file.name} ({(file.size / 1024).toFixed(0)} KB)
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className={styles.citationsSection}>
            <textarea
              value={citations}
              onChange={(e) => setCitations(e.target.value)}
              placeholder="Paste citations or DOIs, one per line or separated by commas..."
              className={styles.textarea}
              rows={8}
            />
            <p className={styles.helpText}>
              You can paste DOIs, full citations, or paper titles. We'll try to
              match them.
            </p>
          </div>
        )}

        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => onSubmit([])}
            className={styles.skipButton}
          >
            Skip for now
          </button>
          <button
            type="submit"
            disabled={
              (method === "upload" && files.length === 0) ||
              (method === "citations" && !citations.trim())
            }
            className={styles.submitButton}
          >
            Continue to Analysis
          </button>
        </div>
      </form>
    </div>
  );
}

