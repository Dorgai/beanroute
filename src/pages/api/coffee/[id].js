import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getCoffeeById, updateCoffee, deleteCoffee } from '../../../lib/coffee-service';
import { logActivity } from '../../../lib/activity-service';

export default async function handler(req, res) {
  try {
    // Verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Coffee ID is required' });
    }

    // Handle different HTTP methods
    switch (req.method) {
      case 'GET':
        return handleGet(req, res, id);
      case 'PUT':
      case 'PATCH':
        return handleUpdate(req, res, user, id);
      case 'DELETE':
        return handleDelete(req, res, user, id);
      default:
        res.setHeader('Allow', ['GET', 'PUT', 'PATCH', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} not allowed` });
    }
  } catch (error) {
    console.error('Coffee API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request to fetch a specific coffee
 */
async function handleGet(req, res, id) {
  try {
    const coffee = await getCoffeeById(id);
    return res.status(200).json(coffee);
  } catch (error) {
    console.error('Error fetching coffee:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    return res.status(500).json({ error: 'Failed to fetch coffee' });
  }
}

/**
 * Handle PUT or PATCH request to update a coffee
 */
async function handleUpdate(req, res, user, id) {
  try {
    // Check permissions
    if (!['ADMIN', 'OWNER', 'ROASTER'].includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to update coffee' });
    }
    
    const { name, grade, country, producer, notes } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Coffee name is required' });
    }
    
    // Update the coffee
    const updatedCoffee = await updateCoffee(id, {
      name,
      grade,
      origin: country,
      roaster: producer,
      notes
    });
    
    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'UPDATE',
      resourceType: 'COFFEE',
      resourceId: id,
      details: `Updated coffee "${name}"`
    });
    
    return res.status(200).json(updatedCoffee);
  } catch (error) {
    console.error('Error updating coffee:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: 'A coffee with this name already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to update coffee' });
  }
}

/**
 * Handle DELETE request to remove a coffee
 */
async function handleDelete(req, res, user, id) {
  try {
    // Check permissions
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to delete coffee' });
    }
    
    // Get the coffee to log its name
    const coffee = await getCoffeeById(id);
    
    // Delete the coffee
    await deleteCoffee(id);
    
    // Log the activity
    await logActivity({
      userId: user.id,
      action: 'DELETE',
      resourceType: 'COFFEE',
      resourceId: id,
      details: `Deleted coffee "${coffee.name}"`
    });
    
    return res.status(204).end();
  } catch (error) {
    console.error('Error deleting coffee:', error);
    
    if (error.message && error.message.includes('not found')) {
      return res.status(404).json({ error: 'Coffee not found' });
    }
    
    return res.status(500).json({ error: 'Failed to delete coffee' });
  }
} 