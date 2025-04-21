/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // experimental: { // Removed incompatible flag
  //   nodeMiddleware: true,
  // },
  // Configure your environment variables here
  env: {
    APP_NAME: 'BeanRoute',
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
  // Custom headers for specific paths
  async headers() {
    return [
      {
        // Apply these headers to public API endpoints
        source: '/api/public/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, max-age=0',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig; 