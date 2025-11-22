/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Si te molesta la advertencia de "experimental.appDir", puedes eliminar este bloque.
  experimental: {
    appDir: true,
  },

  images: {
    unoptimized: true,
  },

  // 🔁 Rewrites: proxy interno para enrutar /api/* al backend local (puerto 3001)
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },
};

module.exports = nextConfig;
