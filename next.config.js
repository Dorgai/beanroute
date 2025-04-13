/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // swcMinify: true, // Removed deprecated option for Next.js 15+
  // experimental: { // Removed incompatible flag
  //   nodeMiddleware: true,
  // },
  // Configure your environment variables here
  env: {
    APP_NAME: 'User Management System',
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