import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Aktifkan React Strict Mode untuk production
  reactStrictMode: true,

  // TypeScript: peringatkan error, jangan abaikan
  typescript: {
    ignoreBuildErrors: false,
  },

  // ESLint: peringatkan error saat build
  eslint: {
    ignoreDuringBuilds: false,
  },

  // Webpack dev only
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ignored: ['**/*'],
      };
    }
    return config;
  },

  // Environment variables opsional
  env: {
    // Jika nanti pakai API key, bisa tambahkan di Vercel
    API_KEY: process.env.API_KEY || '', // default kosong
  },

  // Optimisasi production
  swcMinify: true,
};

export default nextConfig;
