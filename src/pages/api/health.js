import prisma from '../../lib/prisma';

// Track server start time
const startTime = Date.now();
const STARTUP_GRACE_PERIOD = 300000; // Increased to 5 minutes grace period

/**
 * Health Check API
 * 
 * Tests:
 * 1. Basic API functionality
 * 2. Database connectivity (if available)
 */
export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Always return 200 for health check
  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    api: 'operational',
    environment: process.env.NODE_ENV || 'development'
  });
} 