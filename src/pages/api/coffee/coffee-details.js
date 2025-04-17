import { verifyRequestAndGetUser, logUserActivity } from '@/lib/auth';
import { PrismaClient, Role } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  try {
    // Verify user is authenticated
    const user = await verifyRequestAndGetUser(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const coffeeId = req.query.id; // Use 'id' as query parameter instead of 'coffeeId'
    if (!coffeeId) {
      return res.status(400).json({ error: 'Coffee ID is required' });
    }

    // GET request - retrieve coffee details
    if (req.method === 'GET') {
      const coffee = await prisma.coffee.findUnique({
        where: { id: coffeeId },
      });

      if (!coffee) {
        return res.status(404).json({ error: 'Coffee not found' });
      }

      return res.status(200).json(coffee);
    }
    
    // PUT request - update coffee
    else if (req.method === 'PUT') {
      // Check permissions
      const canModify = [Role.ADMIN, Role.OWNER, Role.ROASTER].includes(user.role);
      if (!canModify) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      const { name, grade, origin, price, isActive } = req.body;

      // Validate required fields
      if (!name) {
        return res.status(400).json({ error: 'Name is required' });
      }

      // Update coffee
      const updatedCoffee = await prisma.coffee.update({
        where: { id: coffeeId },
        data: {
          name,
          grade,
          origin,
          price: price ? parseFloat(price) : undefined,
          isActive: isActive !== undefined ? Boolean(isActive) : undefined,
          updatedAt: new Date(),
        },
      });

      // Log activity
      await logUserActivity(user.id, {
        action: 'UPDATE',
        resourceType: 'COFFEE',
        resourceId: coffeeId,
        details: `Updated coffee "${name}"`
      });

      return res.status(200).json(updatedCoffee);
    }
    
    // DELETE request
    else if (req.method === 'DELETE') {
      // Check permissions
      const isAdmin = user.role === Role.ADMIN;
      const isOwner = user.role === Role.OWNER;
      
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      // Check if coffee exists
      const coffee = await prisma.coffee.findUnique({
        where: { id: coffeeId },
      });

      if (!coffee) {
        return res.status(404).json({ error: 'Coffee not found' });
      }

      // Delete coffee
      await prisma.coffee.delete({
        where: { id: coffeeId },
      });
      
      // Log activity
      await logUserActivity(user.id, {
        action: 'DELETE',
        resourceType: 'COFFEE',
        resourceId: coffeeId,
        details: `Deleted coffee "${coffee.name}"`
      });

      return res.status(204).end();
    }
    
    // Method not allowed
    else {
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Error handling coffee request:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
} 