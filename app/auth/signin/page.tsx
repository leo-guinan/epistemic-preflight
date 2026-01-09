"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import styles from "./page.module.css";

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  // Check for error from OAuth callback
  useEffect(() => {
    const errorParam = searchParams?.get("error");
    if (errorParam) {
      switch (errorParam) {
        case "oauth_failed":
          setError("OAuth authentication failed. Please try again.");
          break;
        case "no_code":
          setError("Authorization code missing. Please try again.");
          break;
        case "exchange_failed":
          setError("Failed to complete sign in. Please try again.");
          break;
        case "unexpected":
          setError("An unexpected error occurred. Please try again.");
          break;
        default:
          setError("Sign in failed. Please try again.");
      }
    }
  }, [searchParams]);

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
      
      // Construct redirect URL - ensure no extra whitespace
      const redirectUrl = `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`;
      console.log("[Sign In] Redirect URL:", redirectUrl);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: redirectUrl.trim(), // Ensure no leading/trailing whitespace
        },
      });

      if (error) {
        console.error("Sign in error:", error);
        setError("Failed to initiate sign in. Please try again.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h1 className={styles.title}>Sign in to Epistemic Preflight</h1>
        <p className={styles.description}>
          Sign in to save your analysis, track changes, and access your work
          anytime.
        </p>
        {error && (
          <div style={{ 
            padding: "12px", 
            backgroundColor: "#fee", 
            color: "#c33", 
            borderRadius: "4px", 
            marginBottom: "16px" 
          }}>
            {error}
          </div>
        )}
        <button 
          onClick={handleSignIn} 
          className={styles.signInButton}
          disabled={isLoading}
        >
          {isLoading ? "Signing in..." : "Sign in with Google"}
        </button>
        <p className={styles.terms}>
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.content}>
          <h1 className={styles.title}>Sign in to Epistemic Preflight</h1>
          <p className={styles.description}>Loading...</p>
        </div>
      </div>
    }>
      <SignInForm />
    </Suspense>
  );
}
