const path = require('path')
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development', // Enable PWA in production
  sw: 'sw.js', // Custom service worker
  runtimeCaching: [
    // Critical API routes - NetworkFirst with extended timeout
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/(profiles|legal_tasks|legal_deadlines|saved_content)/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'critical-api-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 // 1 hour for critical data
        },
        networkTimeoutSeconds: 15,
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // General Supabase API
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // AI API with shorter cache
    {
      urlPattern: /^https:\/\/api\.aixplain\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'aixplain-cache',
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 30 * 60 // 30 minutes
        },
        networkTimeoutSeconds: 15,
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Payment APIs - NetworkOnly for security
    {
      urlPattern: /^https:\/\/api\.stripe\.com\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'stripe-cache',
      }
    },
    // Legal content pages - StaleWhileRevalidate
    {
      urlPattern: /^https?:\/\/[^/]+\/(legal|practice-areas|guides)\/.*/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'legal-content-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
    // Images with longer cache
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      },
    },
    // Static resources
    {
      urlPattern: /\.(?:js|css|woff|woff2|ttf|eot)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 150,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
        cacheableResponse: {
          statuses: [0, 200]
        }
      },
    },
    // API routes - NetworkFirst with background sync
    {
      urlPattern: /^https?:\/\/[^/]+\/api\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 5 * 60 // 5 minutes
        },
        networkTimeoutSeconds: 10,
        cacheableResponse: {
          statuses: [0, 200]
        }
      }
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'ooqhzdavkjlyjxqrhkwt.supabase.co', 'singaporelegalhelp.com.sg'],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },

  // Production optimizations
  generateEtags: true,
  poweredByHeader: false,
  compress: true,

  // Performance optimizations
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP', 'FID', 'FCP', 'TTFB'],
    optimizeCss: true,
    scrollRestoration: true,
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
    turbo: {
      rules: {
        '*.svg': {
          loaders: ['@svgr/webpack'],
          as: '*.js',
        },
      },
    },
  },

  // Bundle optimization
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Optimize bundle size
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true,
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true,
          },
        },
      };
    }

    // Optimize imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };

    return config;
  },

  // Reduce development noise
  logging: {
    fetches: {
      fullUrl: process.env.NODE_ENV === 'development',
    },
  },

  // Production-ready headers
  async headers() {
    const headers = [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0'
          },
          {
            key: 'Pragma',
            value: 'no-cache'
          },
          {
            key: 'Expires',
            value: '0'
          }
        ],
      }
    ];

    // Add production-specific headers
    if (process.env.NODE_ENV === 'production') {
      headers.push(
        {
          source: '/(.*)',
          headers: [
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on'
            },
            {
              key: 'X-Frame-Options',
              value: 'DENY'
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff'
            },
            {
              key: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin'
            }
          ],
        },
        {
          source: '/_next/static/(.*)',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=31536000, immutable'
            }
          ],
        }
      );
    }

    return headers;
  },

  // Production redirects
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
      {
        source: '/docs',
        destination: '/legal',
        permanent: true,
      }
    ];
  },
}

module.exports = withPWA(nextConfig)
