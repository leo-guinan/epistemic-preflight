import type { Metadata } from "next";
import "./globals.css";
import { FathomAnalytics } from "./fathom";
import { SessionProvider } from "./providers";

export const metadata: Metadata = {
  title: "Epistemic Preflight - See How Your Paper Will Be Read",
  description: "Pre-review analysis tool for research papers. Position your work clearly, surface reviewer risks, and identify synthesis opportunities — before submission.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>
          <FathomAnalytics />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}

