"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const supabase = createClient();

  const handleSignIn = async () => {
    try {
      setIsLoading(true);
      const callbackUrl = searchParams?.get("callbackUrl") || "/dashboard";
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(callbackUrl)}`,
        },
      });

      if (error) {
        console.error("Sign in error:", error);
        alert("Failed to sign in. Please try again.");
      }
    } catch (error) {
      console.error("Sign in error:", error);
      alert("Failed to sign in. Please try again.");
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
