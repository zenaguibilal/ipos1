/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    allowedDevOrigins: ['6000-firebase-ipos-1-1775045772528.cluster-cbeiita7rbe7iuwhvjs5zww2i4.cloudworkstations.dev'],
  },
}

module.exports = nextConfig
