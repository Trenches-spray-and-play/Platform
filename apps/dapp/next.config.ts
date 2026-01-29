import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@trenches/ui", "@trenches/auth", "@trenches/database", "@trenches/utils"],
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
};

export default nextConfig;
