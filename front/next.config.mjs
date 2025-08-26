import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', 
  register: true, 
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      // Estrategia para todos los recursos estáticos (CSS, JS, imágenes, etc.)
      // Esto asegura que la interfaz de usuario se vea exactamente igual
      urlPattern: /^https?:\/\/.*\.(?:png|jpg|jpeg|svg|gif|webp|css|js|woff2|woff|ttf|eot|html)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets-cache',
        expiration: {
          maxEntries: 100, // Aumenta el número de entradas para asegurar que todo se cachea
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 días
        },
      },
    },
    {
      // Estrategia para los archivos de audio
      urlPattern: /\.(mp3|wav|ogg)$/i,
      handler: 'CacheFirst', // 'CacheFirst' es perfecto para esto
      options: {
        cacheName: 'audio-cache',
        expiration: {
          maxEntries: 50,
        },
      },
    },
    {
      // Estrategia de respaldo para otras peticiones (ej. APIs)
      // Esta estrategia seguirá intentando la red primero.
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