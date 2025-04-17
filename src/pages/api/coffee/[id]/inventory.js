import { verifyRequestAndGetUser } from '../../../../lib/auth';
import { getCoffeeById, addCoffeeInventory, getCoffeeInventoryLogs } from '../../../../lib/coffee-service';
import { logActivity } from '../../../../lib/activity-service';

export default async function handler(req, res) {
  try {
    // Always require authentication for inventory management
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Get the coffee ID from the URL parameter
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Coffee ID is required' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, user, id);
      case 'POST':
        return handlePost(req, res, user, id);
      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Coffee inventory API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch inventory logs for a coffee
 */
async function handleGet(req, res, user, id) {
  try {
    // Check if coffee exists
    const coffee = await getCoffeeById(id);
    
    // Get pagination parameters
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    
    // Get inventory logs
    const { logs, meta } = await getCoffeeInventoryLogs(id, page, limit);
    
    return res.status(200).json({ 
      coffee: {
        id: coffee.id,
        name: coffee.name,
        quantity: coffee.quantity
      },
      logs, 
      meta 
    });
  } catch (error) {
    console.error('Error fetching coffee inventory logs:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch inventory logs' });
  }
}

/**
 * Handle POST request to update inventory for a coffee
 */
async function handlePost(req, res, user, id) {
  try {
    // Check if user has permission to update coffee inventory
    if (!['ADMIN', 'OWNER', 'ROASTER'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }
    
    const { amount, notes } = req.body;
    
    // Validate amount
    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    
    // Add inventory
    const result = await addCoffeeInventory(id, amount, user.id, notes);
    
    // Log activity
    await logActivity({
      userId: user.id,
      action: parseFloat(amount) > 0 ? 'ADD_INVENTORY' : 'REMOVE_INVENTORY',
      resourceType: 'COFFEE',
      resourceId: id,
      details: `${parseFloat(amount) > 0 ? 'Added' : 'Removed'} ${Math.abs(parseFloat(amount))} kg to coffee inventory (${result.coffee.name})`
    });
    
    return res.status(200).json({
      coffee: result.coffee,
      log: result.log,
      message: `Successfully ${parseFloat(amount) > 0 ? 'added' : 'removed'} ${Math.abs(parseFloat(amount))} kg ${parseFloat(amount) > 0 ? 'to' : 'from'} inventory`
    });
  } catch (error) {
    console.error('Error updating coffee inventory:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    return res.status(500).json({ error: 'Failed to update inventory' });
  }
} 