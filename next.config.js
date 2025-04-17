/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental: { // Removed incompatible flag
  //   nodeMiddleware: true,
  // },
  // Configure your environment variables here
  env: {
    APP_NAME: 'User Management System',
    DATABASE_URL: process.env.DATABASE_URL,
  },
  // Configure redirects if needed
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig; 