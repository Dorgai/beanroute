import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getTotalCoffeeInventory } from '../../../../lib/coffee-service';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Only Owner and Retailer can see this information
    if (!['OWNER', 'RETAILER', 'ADMIN'].includes(user.role)) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    // Get total coffee inventory
    const total = await getTotalCoffeeInventory();
    
    return res.status(200).json({ total });
  } catch (error) {
    console.error('Error fetching total coffee inventory:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
} 