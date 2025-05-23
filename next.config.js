/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  experimental: {
    optimizePackageImports: ['react-icons'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Ensure the 'ws' package is never bundled for the browser
      config.resolve.fallback = {
        ...config.resolve.fallback,
        ws: false,
        'utf-8-validate': false,
        bufferutil: false,
      };
      
      // Add module replacement for browser contexts
      config.resolve.alias = {
        ...config.resolve.alias,
        '@supabase/realtime-js': require.resolve('@supabase/realtime-js'),
      };
      
      // Add null loader for all .node files
      config.module.rules.push({
        test: /\.node$/,
        loader: 'null-loader',
      });
    }
    return config;
  },
  // Additional production optimizations
  poweredByHeader: false,
  reactStrictMode: true,
};

module.exports = nextConfig;