// Simple health check endpoint that doesn't require database connectivity
export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'unknown',
    // Include version info if available
    version: process.env.npm_package_version || '1.0.0'
  });
} 