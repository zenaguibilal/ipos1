/** @type {import('next').NextConfig} */

const isDev = process.env.NODE_ENV === 'development';

const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    // FIX #20: allowedDevOrigins must only be set in development mode.
    // The previous config hardcoded a Cloud Workstation URL that was present
    // even in production builds, potentially exposing internal infrastructure
    // details and breaking CORS policies in non-dev environments.
    ...(isDev && {
        experimental: {
            allowedDevOrigins: [
                process.env.DEV_ORIGIN || '',
            ].filter(Boolean),
        },
    }),
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
};

module.exports = nextConfig;