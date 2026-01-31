import type { Metadata } from "next";
import { Agentation } from "agentation";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { ThemeProvider } from "@trenches/ui";
import { Inter, JetBrains_Mono } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jetbrains-mono',
});


import type { Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://playtrenches.xyz'),
  title: {
    default: "Trenches: Spray & Play",
    template: "%s | Trenches"
  },
  description: "The fastest path to 1.5X ROI. Spray $1,000 and secure $1,500 in 24 hours. Powered by Believe.",
  openGraph: {
    type: "website",
    siteName: "Trenches",
    title: "Trenches: Spray & Play",
    description: "The fastest path to 1.5X ROI. Spray $1,000 and secure $1,500 in 24 hours. Powered by Believe.",
    images: [
      {
        url: "/trenches-og-final.png",
        width: 1200,
        height: 630,
        alt: "Trenches: Spray & Play"
      }
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Trenches: Spray & Play",
    description: "The fastest path to 1.5X ROI. Spray $1,000 and secure $1,500 in 24 hours. Powered by Believe.",
    images: ["/trenches-og-final.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#00FF66",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable}`}>
      <body className="antialiased">
        <ThemeProvider>
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
