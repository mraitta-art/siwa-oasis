import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com;
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com;
      connect-src 'self' https://www.youtube.com https://youtube.com;
      img-src 'self' data: https: blob:;
      style-src 'self' 'unsafe-inline';
      font-src 'self' data:;
      media-src 'self' https:;
    `.replace(/\n/g, '').replace(/\s+/g, ' ')
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN'
  }
];

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // Disable prerendering for API routes to prevent build-time module resolution errors
  staticPageGenerationTimeout: 300,
  experimental: {
    webpackBuildWorker: false,
  },
  // Reduce memory usage for cPanel deployment
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
  // Optimize for production build
  compress: true,
  // Add security headers for production
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
