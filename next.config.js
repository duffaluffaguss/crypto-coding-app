/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  webpack: (config, { isServer }) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };

    // Ignore optional dependencies from wagmi connectors we don't use
    config.resolve.alias = {
      ...config.resolve.alias,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };

    // Suppress warnings for optional peer dependencies
    config.ignoreWarnings = [
      { module: /@metamask\/sdk/ },
      { module: /pino/ },
    ];

    return config;
  },
};

module.exports = nextConfig;
