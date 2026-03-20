import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/appwrite/:path*',
        destination: 'http://15.235.146.250:8081/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
