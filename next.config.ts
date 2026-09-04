import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ['lucide-react', 'framer-motion', 'ogl', 'lenis'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
};

export default nextConfig;
