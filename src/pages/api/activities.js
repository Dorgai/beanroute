import { verifyRequestAndGetUser } from '../../lib/auth';
import { getActivityLogs } from '../../lib/activity-service';

export default async function handler(req, res) {
  try {
    // Verify user authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Only Admin, Owner and Retailer can view activity logs
    const canViewLogs = ['ADMIN', 'OWNER', 'RETAILER'].includes(user.role);
    if (!canViewLogs) {
      return res.status(403).json({ error: 'You do not have permission to view activity logs' });
    }

    // Handle GET request
    if (req.method === 'GET') {
      try {
        const {
          page = 1,
          limit = 20,
          userId,
          action,
          resource,
          fromDate,
          toDate
        } = req.query;
        
        // Skip resource from the query parameters if it's not supported
        const queryParams = {
          page: parseInt(page, 10),
          limit: parseInt(limit, 10),
          userId,
          action,
          fromDate,
          toDate
        };
        
        const result = await getActivityLogs(queryParams);
        
        return res.status(200).json(result);
      } catch (error) {
        console.error('Error fetching activity logs:', error);
        return res.status(500).json({ error: 'Failed to fetch activity logs' });
      }
    }
    
    // Method not allowed
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  } catch (error) {
    console.error('Error in activities API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 