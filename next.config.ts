import type { NextConfig } from "next";

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
};

export default nextConfig;
