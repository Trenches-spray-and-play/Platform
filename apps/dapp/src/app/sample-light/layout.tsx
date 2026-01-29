import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Trenches - Grow Your Crypto",
  description: "Simple, transparent crypto yields through time-locked deposits",
};

export default function LightLayout({
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
