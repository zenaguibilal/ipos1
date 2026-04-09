/** @type {import('next').NextConfig} */

const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
    experimental: {} // Removed unrecognized keys that caused server startup errors
};

module.exports = nextConfig;
