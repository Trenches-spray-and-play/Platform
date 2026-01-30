import type { Metadata } from "next";
import { Agentation } from "agentation";
import "./globals.css";
import AppLayoutWrapper from "@/components/AppLayoutWrapper";
import { Toaster } from 'react-hot-toast';

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
    <html lang="en">
      <head>
        {/* Prevent wallet extension conflicts */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Store original ethereum before extensions can mess with it
              if (typeof window !== 'undefined') {
                window.__originalEthereum = window.ethereum;
                
                // Prevent extensions from redefining ethereum
                try {
                  Object.defineProperty(window, 'ethereum', {
                    get() { return window.__originalEthereum; },
                    set(v) { 
                      if (!window.__originalEthereum) {
                        window.__originalEthereum = v;
                      }
                    },
                    configurable: true,
                    enumerable: true
                  });
                } catch (e) {
                  console.warn('Could not protect window.ethereum:', e);
                }
              }
            `
          }}
        />
      </head>
      <body className="antialiased">
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #333',
              borderRadius: '12px'
            }
          }}
        />
        <AppLayoutWrapper>
          {children}
        </AppLayoutWrapper>
        {process.env.NODE_ENV === "development" && <Agentation />}
      </body>
    </html>
  );
}
