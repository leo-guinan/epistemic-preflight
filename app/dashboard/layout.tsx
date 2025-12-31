// Force dynamic rendering for all dashboard pages
export const dynamic = 'force-dynamic';

import { Navigation } from "@/app/components/Navigation";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Navigation />
      {children}
    </>
  );
}

