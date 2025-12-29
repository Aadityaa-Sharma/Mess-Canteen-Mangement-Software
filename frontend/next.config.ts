import type { NextConfig } from "next";

// Declare process.env types for Node.js environment
declare const process: {
  env: {
    NODE_ENV?: string;
    VERCEL?: string;
    [key: string]: string | undefined;
  };
};

const nextConfig: NextConfig = {
  distDir: '../.next',
  async rewrites() {
    // Only use rewrites in development (local)
    // In production/Vercel, API routes are handled by vercel.json rewrites
    const nodeEnv = process.env.NODE_ENV || 'development';
    const isVercel = !!process.env.VERCEL;
    
    if (nodeEnv === 'development' && !isVercel) {
      return [
        {
          source: '/api/:path*',
          destination: 'http://localhost:5000/api/:path*',
        },
      ];
    }
    return [];
  },
};

export default nextConfig;
