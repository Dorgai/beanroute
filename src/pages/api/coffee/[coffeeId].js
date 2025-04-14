import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getCoffeeById, updateCoffee, deleteCoffee } from '../../../lib/coffee-service';
import { logActivity } from '../../../lib/activity-service';

export default async function handler(req, res) {
  try {
    // Authenticate user for all requests
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { coffeeId } = req.query;
    if (!coffeeId) {
      return res.status(400).json({ error: 'Coffee ID is required' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, user, coffeeId);
      case 'PUT':
        return handlePut(req, res, user, coffeeId);
      case 'DELETE':
        return handleDelete(req, res, user, coffeeId);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Coffee API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch a coffee by ID
 */
async function handleGet(req, res, user, coffeeId) {
  try {
    const coffee = await getCoffeeById(coffeeId);
    if (!coffee) {
      return res.status(404).json({ error: 'Coffee not found' });
    }

    return res.status(200).json(coffee);
  } catch (error) {
    console.error('Error fetching coffee:', error);
    return res.status(500).json({ error: 'Failed to fetch coffee data' });
  }
}

/**
 * Handle PUT request to update a coffee entry
 */
async function handlePut(req, res, user, coffeeId) {
  try {
    // Check if user has permission to update coffee
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    const { name, roaster, origin, process, notes, price, description } = req.body;

    // Basic validation
    if (!name) {
      return res.status(400).json({ error: 'Coffee name is required' });
    }

    // Update coffee entry
    const updatedCoffee = await updateCoffee(coffeeId, {
      name,
      roaster,
      origin,
      process,
      notes,
      description,
      price: price ? parseFloat(price) : null,
      updatedBy: user.id
    });

    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'COFFEE',
      resourceId: coffeeId,
      details: `Updated coffee "${name}"`
    });

    return res.status(200).json(updatedCoffee);
  } catch (error) {
    console.error('Error updating coffee:', error);
    
    // Handle not found error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    // Handle duplicate name error
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: 'A coffee with this name already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to update coffee entry' });
  }
}

/**
 * Handle DELETE request to remove a coffee entry
 */
async function handleDelete(req, res, user, coffeeId) {
  try {
    // Check if user has permission to delete coffee
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'Forbidden - Insufficient permissions' });
    }

    // Delete coffee entry
    const coffee = await deleteCoffee(coffeeId);

    await logActivity({
      userId: user.id,
      action: 'DELETE',
      resourceType: 'COFFEE',
      resourceId: coffeeId,
      details: `Deleted coffee "${coffee.name}"`
    });

    return res.status(204).send();
  } catch (error) {
    console.error('Error deleting coffee:', error);
    
    // Handle not found error
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    return res.status(500).json({ error: 'Failed to delete coffee entry' });
  }
} 