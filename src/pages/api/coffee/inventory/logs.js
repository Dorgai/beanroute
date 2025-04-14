import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getAllCoffeeInventoryLogs } from '../../../../lib/coffee-service';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Only allow GET method
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }

    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    // Get inventory logs
    const { logs, meta } = await getAllCoffeeInventoryLogs(page, limit);

    return res.status(200).json({ logs, meta });
  } catch (error) {
    console.error('Error fetching coffee inventory logs:', error);
    return res.status(500).json({ 
      error: 'Failed to fetch inventory logs',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
} 