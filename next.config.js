/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  // Configure your environment variables here
  env: {
    APP_NAME: 'User Management System',
  },
  // If you're using import aliases
  experimental: {
    appDir: false,
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