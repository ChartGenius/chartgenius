/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  },
  async redirects() {
    return [
      {
        source: '/analysis',
        destination: '/?view=analysis',
        permanent: true,
      },
      {
        source: '/prop-firm',
        destination: '/prop-firm-tracker',
        permanent: true,
      },
    ]
  },
}

module.exports = nextConfig