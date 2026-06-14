module.exports = {
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
        protocol: "https",
        hostname: "xaynha.go7s.net",
      },
    ],
  },
  experimental: {
    serverActions: {
      allowedOrigins: ['10.20.10.135:3000', 'localhost:3000', 'xaynha.go7s.net'],
    },
  },
  allowedDevOrigins: ['10.20.10.135', 'xaynha.go7s.net'],
};
