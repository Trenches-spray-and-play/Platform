import type { Metadata } from "next";
import "./globals.css";

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
        {children}
      </body>
    </html>
  );
}
