import type { NextConfig } from "next";

const securityHeaders = [
  {
    key: 'Content-Security-Policy',
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://youtube.com https://www.youtube-nocookie.com https://cdnjs.cloudflare.com https://kit.fontawesome.com;
      frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com https://youtube.com;
      connect-src 'self' https://www.youtube.com https://youtube.com https://ka-f.fontawesome.com;
      img-src 'self' data: https: blob:;
      style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;
      font-src 'self' data: https://cdnjs.cloudflare.com https://fonts.gstatic.com https://ka-f.fontawesome.com;
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
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  staticPageGenerationTimeout: 300,
  experimental: {
    webpackBuildWorker: false,
  },
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
  compress: true,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  async redirects() {
    return [
      {
        source: '/studio',
        destination: '/jana/studio',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
