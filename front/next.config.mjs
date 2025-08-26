import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', 
  register: true, 
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: ({ url }) => url.origin === self.location.origin,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'html-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
        },
        matchOptions: {
          ignoreSearch: true,
        },
      },
    },

    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|css|js|woff2|woff|ttf|eot)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-cache',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30,
        },
      },
    },

    {
      urlPattern: /\.(mp3|wav|ogg)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 50,
        },
      },
    },

    {
      urlPattern: /^https?.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'http-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7,
        },
      },
    },
  ],
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE: "https://spoti-backend-9m4j.onrender.com",
  },
  images: {
    unoptimized: true,
    domains: ["https://spoti-front.vercel.app","placehold.co", "localhost", "192.168.0.107"],
  },
};

export default withPWA(nextConfig);