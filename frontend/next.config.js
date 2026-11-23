/** @type {import('next').NextConfig} */
const backendBaseUrl = process.env.BACKEND_BASE_URL || process.env.BACKEND_URL;

const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
  },
  async rewrites() {
    if (!backendBaseUrl) {
      return [];
    }
    return [
      {
        source: '/api/sarvam/:path*',
        destination: `${backendBaseUrl}/api/sarvam/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
