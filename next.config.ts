import type { NextConfig } from 'next'

const nextConfig: any = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' }
    ]
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: { serverActions: { allowedOrigins: ['fieldmind.tech', 'localhost:3000'] } },
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_WORKER_URL}/api/:path*` }]
  }
}

export default nextConfig
