"use client";

import { useUser } from "@/lib/hooks/use-user";
import { createClient } from "@/lib/supabase/client";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import styles from "./Navigation.module.css";

export function Navigation() {
  const { user, isLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Only show navigation when user is logged in
  if (isLoading || !user) {
    return null;
  }

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      const supabase = createClient();
      await supabase.auth.signOut();
      router.push("/");
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  // Don't show navigation on auth pages
  if (pathname?.startsWith("/auth")) {
    return null;
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <div className={styles.left}>
          <Link href="/" className={styles.logo}>
            Epistemic Preflight
          </Link>
        </div>
        
        <div className={styles.center}>
          <Link 
            href="/dashboard" 
            className={`${styles.navLink} ${pathname === "/dashboard" ? styles.active : ""}`}
          >
            My Papers
          </Link>
          <Link 
            href="/preflight" 
            className={`${styles.navLink} ${pathname?.startsWith("/preflight") ? styles.active : ""}`}
          >
            New Analysis
          </Link>
          <Link 
            href="/demos" 
            className={`${styles.navLink} ${pathname?.startsWith("/demos") ? styles.active : ""}`}
          >
            Demos
          </Link>
        </div>

        <div className={styles.right}>
          {user.email && (
            <span className={styles.userEmail}>{user.email}</span>
          )}
          <button 
            onClick={handleSignOut}
            className={styles.signOutButton}
            disabled={isSigningOut}
          >
            {isSigningOut ? "Signing out..." : "Sign Out"}
          </button>
        </div>
      </div>
    </nav>
  );
}

