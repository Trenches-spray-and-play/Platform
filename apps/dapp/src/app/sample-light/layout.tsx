import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trenches - Grow Your Crypto",
  description: "Simple, transparent crypto yields through time-locked deposits",
};

import Layout from "./components/Layout";

export default function LightLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Layout>
          {children}
        </Layout>
      </body>
    </html>
  );
}
