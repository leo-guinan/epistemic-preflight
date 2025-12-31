"use client";

// No session provider needed with Supabase Auth
// Supabase handles sessions via cookies automatically

export function SessionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
