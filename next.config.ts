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
  images: {
    minimumCacheTTL: 86400,
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdnjs.cloudflare.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          ...securityHeaders,
          { key: 'x-vercel-toolbar', value: '0' },
        ],
      },
      {
        source: '/icons/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Uploaded media is addressed by UUID or timestamp, so the bytes behind a
        // URL never change. Without this, public/ files default to
        // "max-age=0, must-revalidate" and every view costs a CDN round trip.
        source: '/uploads/:path*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/:file(icon\\.svg|apple-touch-icon\\.png|favicon\\.ico|manifest\\.json)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' },
        ],
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
      // ── Traffic recovery map ──────────────────────────────────────────────
      // These slugs already collect search and shared traffic but resolve to no
      // business, so they used to render an exploration page with HTTP 200.
      // 301 them instead of leaving visitors and crawlers at a dead end.
      // Delete an entry the moment that slug becomes a real business.
      {
        source: '/ibrahim-roshdy',
        destination: '/ibrahim-roushdy',
        permanent: true,
      },
      {
        source: '/sonosi',
        destination: '/categories',
        permanent: true,
      },
      {
        source: '/ahmad-abdelmasoud',
        destination: '/categories',
        permanent: true,
      },
      {
        source: '/explore',
        destination: '/categories',
        permanent: true,
      },
      {
        source: '/stories',
        destination: '/blog',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
