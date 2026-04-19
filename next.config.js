
/** @type {import('next').NextConfig} */

const nextConfig = {
    output: 'export',
    trailingSlash: true,
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: true,
    },
    eslint: {
        ignoreDuringBuilds: true,
    },
    images: {
        unoptimized: true,
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'picsum.photos',
            },
        ],
    },
    // Optimisation du serveur de développement pour l'environnement cloud
    devIndicators: {
        buildActivity: false,
    },
    experimental: {
        // Correction pour l'avertissement "allowedDevOrigins" et les blocages potentiels de HMR
        allowedDevOrigins: ["*"],
    }
};

module.exports = nextConfig;
