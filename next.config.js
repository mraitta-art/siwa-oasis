/** @type {import('next').NextConfig} */
const nextConfig = {
  // Type checking and linting
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

module.exports = nextConfig;
