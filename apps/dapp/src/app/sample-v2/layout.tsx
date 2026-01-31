import type { Metadata } from "next";

export const dynamic = "force-dynamic";
import "./globals.css";
import "./globals.mobile.css";
import ErrorBoundary from "./components/ErrorBoundary";
import QueryProvider from "@/providers/QueryProvider";
import ToastContainer from "./components/ToastContainer";
import GlobalModalManager from "./components/GlobalModalManager";

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
            <ToastContainer />
            <GlobalModalManager />
            {children}
          </ErrorBoundary>
        </QueryProvider>
      </body>
    </html>
  );
}
