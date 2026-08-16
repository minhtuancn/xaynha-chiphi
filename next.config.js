/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "http",
        hostname: "10.20.10.135",
      },
      {
        protocol: "http",
        hostname: "10.20.10.103",
      },
      {
        protocol: "https",
        hostname: "xaynha.go7s.net",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['10.20.10.135:3000', '10.20.10.103:3051', 'localhost:3000', 'xaynha.go7s.net', '10.20.10.135', 'localhost:3050', '10.20.10.103'],
    },
  },
  allowedDevOrigins: ['10.20.10.135', '10.20.10.103', 'xaynha.go7s.net'],
};

module.exports = nextConfig;
