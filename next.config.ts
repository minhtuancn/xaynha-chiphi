
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ['10.20.10.135', 'xaynha.go7s.net'],
  experimental: {
    serverActions: {
      allowedOrigins: ['10.20.10.135', 'xaynha.go7s.net'],
    },
  },
};

export default nextConfig;
