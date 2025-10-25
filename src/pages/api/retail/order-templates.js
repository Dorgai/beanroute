import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  const prisma = new PrismaClient();
  
  try {
    // Get user session
    const session = await getServerSession(req, res);
    if (!session) {
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { method } = req;

    switch (method) {
      case 'GET':
        return await handleGet(req, res, prisma, session);
      case 'POST':
        return await handlePost(req, res, prisma, session);
      case 'PUT':
        return await handlePut(req, res, prisma, session);
      case 'DELETE':
        return await handleDelete(req, res, prisma, session);
      default:
        await prisma.$disconnect();
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Order templates API error:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Internal server error' });
  }
}

// GET - Fetch user's order templates
async function handleGet(req, res, prisma, session) {
  try {
    const { shopId } = req.query;
    
    const whereClause = {
      OR: [
        { createdById: session.user.id }, // User's own templates
        { isPublic: true } // Public templates
      ]
    };

    // If shopId is provided, filter by shop
    if (shopId) {
      whereClause.OR = whereClause.OR.map(condition => ({
        ...condition,
        OR: [
          { shopId: shopId },
          { shopId: null } // Generic templates
        ]
      }));
    }

    const templates = await prisma.orderTemplate.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            coffee: {
              select: {
                id: true,
                name: true,
                grade: true,
                country: true,
                producer: true,
                quantity: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: [
        { createdAt: 'desc' }
      ]
    });

    await prisma.$disconnect();
    return res.status(200).json(templates);
  } catch (error) {
    console.error('Error fetching order templates:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to fetch templates' });
  }
}

// POST - Create new order template
async function handlePost(req, res, prisma, session) {
  try {
    const { name, description, shopId, items, isPublic = false } = req.body;

    if (!name || !name.trim()) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template name is required' });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template must have at least one item' });
    }

    // Check if template name already exists for this user
    const existingTemplate = await prisma.orderTemplate.findUnique({
      where: {
        createdById_name: {
          createdById: session.user.id,
          name: name.trim()
        }
      }
    });

    if (existingTemplate) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template name already exists' });
    }

    // Validate items and calculate total quantities
    const processedItems = items.map(item => {
      const smallBagsEspresso = parseInt(item.smallBagsEspresso) || 0;
      const smallBagsFilter = parseInt(item.smallBagsFilter) || 0;
      const largeBags = parseInt(item.largeBags) || 0;
      const smallBags = parseInt(item.smallBags) || 0; // For backward compatibility
      
      const totalQuantity = ((smallBagsEspresso + smallBagsFilter + smallBags) * 0.2) + (largeBags * 1.0);
      
      return {
        coffeeId: item.coffeeId,
        smallBags,
        smallBagsEspresso,
        smallBagsFilter,
        largeBags,
        totalQuantity
      };
    }).filter(item => 
      item.smallBags > 0 || 
      item.smallBagsEspresso > 0 || 
      item.smallBagsFilter > 0 || 
      item.largeBags > 0
    );

    if (processedItems.length === 0) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template must have at least one item with quantity > 0' });
    }

    // Create template with items
    const template = await prisma.orderTemplate.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        shopId: shopId || null,
        createdById: session.user.id,
        isPublic: Boolean(isPublic),
        items: {
          create: processedItems
        }
      },
      include: {
        items: {
          include: {
            coffee: {
              select: {
                id: true,
                name: true,
                grade: true,
                country: true,
                producer: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await prisma.$disconnect();
    return res.status(201).json(template);
  } catch (error) {
    console.error('Error creating order template:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to create template' });
  }
}

// PUT - Update existing order template
async function handlePut(req, res, prisma, session) {
  try {
    const { id, name, description, shopId, items, isPublic } = req.body;

    if (!id) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template ID is required' });
    }

    // Check if template exists and user owns it
    const existingTemplate = await prisma.orderTemplate.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!existingTemplate) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'Template not found' });
    }

    if (existingTemplate.createdById !== session.user.id) {
      await prisma.$disconnect();
      return res.status(403).json({ error: 'Not authorized to update this template' });
    }

    // Check for name conflicts (excluding current template)
    if (name && name.trim() !== existingTemplate.name) {
      const nameConflict = await prisma.orderTemplate.findFirst({
        where: {
          createdById: session.user.id,
          name: name.trim(),
          id: { not: id }
        }
      });

      if (nameConflict) {
        await prisma.$disconnect();
        return res.status(400).json({ error: 'Template name already exists' });
      }
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (shopId !== undefined) updateData.shopId = shopId || null;
    if (isPublic !== undefined) updateData.isPublic = Boolean(isPublic);

    // Update items if provided
    if (items && Array.isArray(items)) {
      const processedItems = items.map(item => {
        const smallBagsEspresso = parseInt(item.smallBagsEspresso) || 0;
        const smallBagsFilter = parseInt(item.smallBagsFilter) || 0;
        const largeBags = parseInt(item.largeBags) || 0;
        const smallBags = parseInt(item.smallBags) || 0;
        
        const totalQuantity = ((smallBagsEspresso + smallBagsFilter + smallBags) * 0.2) + (largeBags * 1.0);
        
        return {
          coffeeId: item.coffeeId,
          smallBags,
          smallBagsEspresso,
          smallBagsFilter,
          largeBags,
          totalQuantity
        };
      }).filter(item => 
        item.smallBags > 0 || 
        item.smallBagsEspresso > 0 || 
        item.smallBagsFilter > 0 || 
        item.largeBags > 0
      );

      // Delete existing items and create new ones
      await prisma.orderTemplateItem.deleteMany({
        where: { templateId: id }
      });

      if (processedItems.length > 0) {
        updateData.items = {
          create: processedItems
        };
      }
    }

    const updatedTemplate = await prisma.orderTemplate.update({
      where: { id },
      data: updateData,
      include: {
        items: {
          include: {
            coffee: {
              select: {
                id: true,
                name: true,
                grade: true,
                country: true,
                producer: true
              }
            }
          }
        },
        createdBy: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true
          }
        },
        shop: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    await prisma.$disconnect();
    return res.status(200).json(updatedTemplate);
  } catch (error) {
    console.error('Error updating order template:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to update template' });
  }
}

// DELETE - Delete order template
async function handleDelete(req, res, prisma, session) {
  try {
    const { id } = req.query;

    if (!id) {
      await prisma.$disconnect();
      return res.status(400).json({ error: 'Template ID is required' });
    }

    // Check if template exists and user owns it
    const existingTemplate = await prisma.orderTemplate.findUnique({
      where: { id }
    });

    if (!existingTemplate) {
      await prisma.$disconnect();
      return res.status(404).json({ error: 'Template not found' });
    }

    if (existingTemplate.createdById !== session.user.id) {
      await prisma.$disconnect();
      return res.status(403).json({ error: 'Not authorized to delete this template' });
    }

    // Delete template (items will be deleted automatically due to cascade)
    await prisma.orderTemplate.delete({
      where: { id }
    });

    await prisma.$disconnect();
    return res.status(200).json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Error deleting order template:', error);
    await prisma.$disconnect();
    return res.status(500).json({ error: 'Failed to delete template' });
  }
}
