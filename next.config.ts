import type { NextConfig } from "next";

// Import environment validation (this will run at build time)
import './src/lib/env/startup';

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    // Enable server actions if needed
    serverActions: {
      allowedOrigins: undefined,
    },
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/api/health',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

export default nextConfig;