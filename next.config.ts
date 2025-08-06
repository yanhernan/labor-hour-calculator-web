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
  
  // Environment variable validation
  env: {
    // Make sure these are available on the client side if needed
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
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