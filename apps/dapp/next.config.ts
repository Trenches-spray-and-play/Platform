import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trenches/ui", "@trenches/auth", "@trenches/database", "@trenches/utils"],
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  experimental: {
    cacheComponents: true,
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      'ethers',
      'viem',
      '@solana/web3.js',
    ],
  },
  compress: true,
};

export default nextConfig;
