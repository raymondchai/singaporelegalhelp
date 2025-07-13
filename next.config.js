/** @type {import('next').NextConfig} */

const isProduction = process.env.NODE_ENV === 'production';
const isAmplify = process.env.AWS_APP_ID; // AWS Amplify sets this automatically

const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,
  
  // CRITICAL: Disable type checking and linting during Amplify builds
  // These should be handled during development/CI, not production builds
  typescript: {
    // Disable type checking during builds in production/Amplify
    ignoreBuildErrors: isProduction || isAmplify,
  },
  
  eslint: {
    // Disable ESLint during builds in production/Amplify
    ignoreDuringBuilds: isProduction || isAmplify,
  },
  
  // Optimize images for production
  images: {
    domains: [
      'localhost',
      // Add your Supabase domain if using Supabase storage
    ],
    unoptimized: false,
  },

  // Configure for Amplify deployment
  ...(isAmplify && {
    // Amplify handles routing, so we can use server-side rendering
    output: undefined, // Remove any static export configuration
    trailingSlash: false,
    
    // Configure for serverless deployment
    experimental: {
      // Enable server components (default in Next.js 13+)
      serverComponentsExternalPackages: ['@supabase/supabase-js'],
    },
  }),

  // Webpack configuration for better builds
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle SVG imports
    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    // Optimize bundle size in production
    if (isProduction && !isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        // Reduce lodash bundle size
        'lodash': 'lodash-es',
      };
    }

    return config;
  },

  // Headers configuration for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;