/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react']
  },
  images: {
    domains: ['images.unsplash.com', 'github.com', 'raw.githubusercontent.com'],
    unoptimized: true
  },
  // Enable static optimization
  trailingSlash: true,
  // Improve performance
  swcMinify: true,
  // Enable compression
  compress: true,
  // PWA-like features
  headers: async () => {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

export default nextConfig