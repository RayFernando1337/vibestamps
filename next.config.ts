import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compiler: {
    // Remove console.log/info/warn in production, keep console.error for debugging
    removeConsole: {
      exclude: ["error"],
    },
  },
};

export default nextConfig;
