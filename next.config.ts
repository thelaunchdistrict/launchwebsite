import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  turbopack: { root: __dirname },
  images: {
    formats: ['image/avif', 'image/webp'],
    qualities: [70, 75],
    deviceSizes: [640, 828, 1080, 1280, 1600, 1920],
    imageSizes: [96, 160, 256, 384],
  },
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      { source: '/media/:path*', headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }] },
    ];
  },
};

export default nextConfig;
