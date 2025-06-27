/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      }
    ],
  },
  // Optimize for production
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  // Reduce bundle size
  experimental: {
    optimizePackageImports: ['@mui/material', '@mui/icons-material'],
  },
}

module.exports = nextConfig 