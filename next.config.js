/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // 🚨 Important: disable ESLint build blocking in production
  eslint: {
    ignoreDuringBuilds: true,
  },

  images: {
    unoptimized: true,
  },

  // ❌ Eliminamos rewrites porque ahora usamos API_URL directamente (Railway)
  // ❌ Eliminamos experimental.appDir porque ya no aplica en producción
};

module.exports = nextConfig;
