const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'supabase-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 24 * 60 * 60 // 24 hours
        },
        networkTimeoutSeconds: 10,
      }
    },
    {
      urlPattern: /^https:\/\/api\.aixplain\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'aixplain-cache',
        expiration: {
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 // 1 hour
        },
        networkTimeoutSeconds: 10,
      }
    },
    {
      urlPattern: /^https:\/\/api\.stripe\.com\/.*/i,
      handler: 'NetworkOnly',
      options: {
        cacheName: 'stripe-cache',
      }
    },
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    {
      urlPattern: /\.(?:js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'static-resources',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 24 * 60 * 60, // 24 hours
        },
      },
    },
  ],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', '*.supabase.co'],
  },
  // Enable PWA in production
  experimental: {
    webVitalsAttribution: ['CLS', 'LCP']
  }
}

module.exports = withPWA(nextConfig)
