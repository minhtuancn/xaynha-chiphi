/**
 * DEPRECATED: Config moved to next.config.js
 * Next.js resolves next.config.js over next.config.ts when both exist.
 * Keep this file minimal to avoid confusion.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  allowedDevOrigins: ['10.20.10.135', '10.20.10.103', 'xaynha.go7s.net'],
  experimental: {
    serverActions: {
      allowedOrigins: ['10.20.10.135', '10.20.10.103', 'xaynha.go7s.net'],
    },
  },
};

export default nextConfig;
