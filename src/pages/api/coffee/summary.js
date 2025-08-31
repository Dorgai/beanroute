import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getCoffeeStockSummary } from '../../../lib/coffee-service';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  // Authenticate the request
  const user = await verifyRequestAndGetUser(req);
  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // Handle GET request - Get coffee stock summary
  if (req.method === 'GET') {
    try {
      // All authenticated users can view summary
      const summary = await getCoffeeStockSummary();
      return res.status(200).json(summary);
    } catch (error) {
      console.error('Error fetching coffee stock summary:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Method not allowed
  res.setHeader('Allow', ['GET']);
  res.status(405).json({ message: `Method ${req.method} Not Allowed` });
} 