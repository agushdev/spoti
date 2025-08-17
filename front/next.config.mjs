import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public', 
  register: true, 
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
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
    NEXT_PUBLIC_API_BASE: "https://spoti-jcik.onrender.com/api",
  },
  images: {
    unoptimized: true,
    domains: ["placehold.co", "localhost", "192.168.0.107"],
  },
};

export default withPWA(nextConfig);