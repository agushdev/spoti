import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', 
  register: true, 
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [
    {
      urlPattern: /^https?.*/, // Expresión regular para que coincida con todas las peticiones
      handler: 'NetworkFirst', // Estrategia por defecto
      options: {
        cacheName: 'http-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 días
        },
        cacheableResponse: {
          statuses: [0, 200],
        },
      },
    },
    {
      // Esta es la parte importante para cachear las canciones
      // Usa una URL que coincida con tus archivos de audio, por ejemplo de Dropbox
      urlPattern: /\.(jpg|mp3|wav|ogg)$/i,
      handler: 'CacheFirst', // Primero la caché, si no está, la red
      options: {
        cacheName: 'audio-cache', // Un nombre específico para la caché de audios
        expiration: {
          maxEntries: 50, // Límite de audios en caché
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