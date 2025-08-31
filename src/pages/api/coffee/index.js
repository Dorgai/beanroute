import { verifyRequestAndGetUser } from '../../../lib/auth';
import { getAllCoffee, createCoffee } from '../../../lib/coffee-service';
import { logActivity } from '../../../lib/activity-service';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  try {
    // For GET requests, we'll allow unauthenticated access
    if (req.method === 'GET') {
      return handleGet(req, res);
    }
    
    // For other methods, verify authentication
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    // Handle POST request for creating coffee
    if (req.method === 'POST') {
      return handlePost(req, res, user);
    }
    
    // Method not allowed
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (error) {
    console.error('Coffee API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Handle GET request to list coffee entries
 */
async function handleGet(req, res) {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const pageSize = req.query.all === 'true' ? null : parseInt(req.query.pageSize, 10) || 10;
    const search = req.query.search || '';
    const groupByGrade = req.query.groupByGrade === 'true';
    const sortByStock = req.query.sortByStock === 'true';
    
    const result = await getAllCoffee({ page, pageSize, search, groupByGrade, sortByStock });
    
    return res.status(200).json({
      ...result,
      page,
      pageSize,
      totalPages: pageSize ? Math.ceil(result.total / pageSize) : 1
    });
  } catch (error) {
    console.error('Error getting coffee list:', error);
    return res.status(500).json({ error: 'Failed to fetch coffee data' });
  }
}

/**
 * Handle POST request to create a new coffee entry
 */
async function handlePost(req, res, user) {
  try {
    // Check if user has permission to create coffee
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'You do not have permission to create coffee entries' });
    }
    
    const { name, roaster, origin, process, notes, price, labelQuantity, isEspresso, isFilter, isSignature } = req.body;
    
    // Validate required fields
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Coffee name is required' });
    }
    
    // Create the coffee entry
    const coffee = await createCoffee({
      name,
      roaster,
      origin, 
      process,
      notes,
      price: price ? parseFloat(price) : null,
      labelQuantity,
      isEspresso,
      isFilter,
      isSignature,
      createdBy: user.id
    });
    
    await logActivity({
      userId: user.id,
      action: 'CREATE',
      resourceType: 'COFFEE',
      resourceId: coffee.id,
      details: `Created coffee "${name}"`
    });
    
    return res.status(201).json(coffee);
  } catch (error) {
    console.error('Error creating coffee:', error);
    
    // Handle duplicate name error
    if (error.message && error.message.includes('already exists')) {
      return res.status(409).json({ error: 'A coffee with this name already exists' });
    }
    
    return res.status(500).json({ error: 'Failed to create coffee entry' });
  }
}

// Handle GET request to list all coffee
async function handleGetAllCoffee(req, res, user) {
  try {
    // Parse pagination parameters
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || '';

    const { results, total } = await getAllCoffee({ page, limit, search });
    
    return res.status(200).json({
      data: results,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error fetching coffee:', error);
    return res.status(500).json({ message: 'Error fetching coffee inventory' });
  }
}

// Handle GET request for coffee summary
async function handleGetSummary(req, res, user) {
  try {
    const summary = await getCoffeeSummary();
    return res.status(200).json(summary);
  } catch (error) {
    console.error('Error fetching coffee summary:', error);
    return res.status(500).json({ message: 'Error fetching coffee summary' });
  }
}

// Handle POST request to create new coffee
async function handleCreateCoffee(req, res, user) {
  try {
    // Check if user has permission to manage coffee
    const canManageCoffee = ['ADMIN', 'OWNER', 'ROASTER'].includes(user.role);
    if (!canManageCoffee) {
      return res.status(403).json({ message: 'Forbidden - Insufficient permissions' });
    }

    const { name, grade, quantity, country, producer, notes, price } = req.body;

    console.log('Creating coffee with data:', req.body);

    // Validate required fields
    if (!name || !grade) {
      return res.status(400).json({ message: 'Name and grade are required' });
    }

    // Prepare coffee data
    const coffeeData = {
      name,
      grade,
      quantity: quantity || 0,
      country,
      producer,
      notes,
      createdById: user.id,
    };

    // Only add price if it's provided and user has permission to set it
    if (price !== undefined && ['ADMIN', 'OWNER'].includes(user.role)) {
      coffeeData.price = typeof price === 'string' ? parseFloat(price) : price;
    }

    console.log('Final coffee creation data:', coffeeData);

    // Create coffee entry
    const newCoffee = await createCoffee(coffeeData);

    return res.status(201).json(newCoffee);
  } catch (error) {
    console.error('Error creating coffee:', error);
    // Check for duplicate entry error
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'Coffee with this name already exists' });
    }
    return res.status(500).json({ message: 'Error creating coffee: ' + error.message });
  }
} 