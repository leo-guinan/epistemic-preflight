"use client";

import { createClient } from "@/lib/supabase/client";
import { savePreflightState } from "@/lib/preflight-state";
import { fathomEvents } from "@/lib/fathom-tracking";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./AuthPrompt.module.css";

interface AuthPromptProps {
  onSignInComplete?: () => void;
  currentState?: string;
  currentData?: any;
}

export function AuthPrompt({ onSignInComplete, currentState, currentData }: AuthPromptProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      
      // Track signup event with demo attribution if available
      const lastViewedDemo = sessionStorage.getItem('last_viewed_demo');
      if (lastViewedDemo) {
        fathomEvents.signupFromDemo(lastViewedDemo);
        // Clear the demo tracking after use
        sessionStorage.removeItem('last_viewed_demo');
      } else {
        fathomEvents.signup('preflight');
      }
      
      // Save current state to localStorage before redirecting
      if (currentState && currentData) {
        console.log("[AuthPrompt] Saving state before sign-in:", currentState);
        savePreflightState(currentState, currentData);
      }
      
      // Set flag in sessionStorage to indicate we're going through OAuth
      sessionStorage.setItem("returning_from_oauth", "true");
      
      // Construct redirect URL - ensure no extra whitespace
      const redirectUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(window.location.pathname)}`;
      console.log("[AuthPrompt] Redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.trim(), // Ensure no leading/trailing whitespace
        },
      });

      if (error) {
        console.error("Sign in error:", error);
        sessionStorage.removeItem("returning_from_oauth");
        alert("Failed to sign in. Please try again.");
      }
      // User will be redirected, so onSignInComplete will be called after redirect
    } catch (error) {
      console.error("Sign in error:", error);
      sessionStorage.removeItem("returning_from_oauth");
      alert("Failed to sign in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Save Your Progress</h2>
        <p className={styles.description}>
          Create a free account to save your analysis, track your changes, and
          access your paper revisions anytime.
        </p>
        <div className={styles.benefits}>
          <div className={styles.benefit}>
            <span className={styles.benefitIcon}>✓</span>
            <span>Save your analysis and revisions</span>
          </div>
          <div className={styles.benefit}>
            <span className={styles.benefitIcon}>✓</span>
            <span>Track changes over time</span>
          </div>
          <div className={styles.benefit}>
            <span className={styles.benefitIcon}>✓</span>
            <span>Export and share your work</span>
          </div>
        </div>
        <button 
          onClick={handleSignIn} 
          className={styles.signInButton}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
        <p className={styles.skipText}>
          You can continue without signing in, but your progress won't be saved.
        </p>
        <Link href="/dashboard" className={styles.dashboardLink}>
          View My Papers →
        </Link>
      </div>
    </div>
  );
}
