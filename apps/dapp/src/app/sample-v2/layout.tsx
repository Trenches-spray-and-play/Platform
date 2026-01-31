import type { Metadata } from "next";
import "./globals.css";
import "./globals.mobile.css";
import ErrorBoundary from "./components/ErrorBoundary";
import QueryProvider from "@/providers/QueryProvider";

export const metadata: Metadata = {
  title: "Trenches v2 - Spray & Play",
  description: "Coordination Protocol for Web3",
};

export default function SampleRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
