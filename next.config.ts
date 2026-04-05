import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: '/',
        destination: '/siwa-oasis-master.html',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
