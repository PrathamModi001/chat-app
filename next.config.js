    /** @type {import('next').NextConfig} */
    const nextConfig = {
      eslint: {
        ignoreDuringBuilds: true,
      },
      typescript: {
        ignoreBuildErrors: true,
      },
      webpack: (config, { isServer }) => {
        if (!isServer) {
          config.resolve.fallback = {
            ...config.resolve.fallback,
            ws: false, // ⛔ prevent bundling `ws` in the browser
          };
        }
        return config;
      },
    };

    module.exports = nextConfig;