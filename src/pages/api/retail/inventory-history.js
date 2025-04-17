// API endpoint to retrieve inventory history for a specific shop
import { PrismaClient } from '@prisma/client';
import { getServerSession } from '@/lib/session';

export default async function handler(req, res) {
  // Only allow GET requests for retrieving inventory history
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  try {
    // Get user session with error handling
    let session;
    try {
      session = await getServerSession(req, res);
      if (!session) {
        await prisma.$disconnect();
        return res.status(401).json({ error: 'Unauthorized' });
      }
      console.log('Session user role:', session.user.role);
    } catch (sessionError) {
      console.error('Session error:', sessionError);
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Session validation failed' });
    }

    // Check shop ID parameter
    const { shopId } = req.query;
    if (!shopId) {
      console.log('No shopId provided, returning empty result');
      await prisma.$disconnect();
      return res.status(200).json([]);
    }

    console.log('Fetching inventory history for shopId:', shopId);

    // Calculate the date 3 months ago
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Check if shop exists
    try {
      const shop = await prisma.shop.findUnique({
        where: { id: shopId },
        select: { id: true, name: true }
      });
      
      if (!shop) {
        console.log(`Shop with ID ${shopId} not found`);
        await prisma.$disconnect();
        return res.status(200).json([]); // Return empty array
      }
      
      console.log(`Found shop: ${shop.name}`);
    } catch (shopError) {
      console.error('Error checking shop:', shopError);
      // Continue anyway
    }

    // First try to find retail orders to use as inventory history
    try {
      console.log('Getting orders as part of inventory history');
      
      const orders = await prisma.retailOrder.findMany({
        where: {
          shopId,
          createdAt: {
            gte: threeMonthsAgo
          }
        },
        select: {
          id: true,
          status: true,
          createdAt: true,
          updatedAt: true,
          orderedBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              role: true
            }
          },
          items: {
            select: {
              id: true,
              smallBags: true,
              largeBags: true,
              totalQuantity: true,
              coffee: {
                select: {
                  id: true,
                  name: true,
                  grade: true
                }
              }
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      console.log(`Found ${orders.length} orders as history items`);
      
      if (orders.length > 0) {
        // Convert orders to inventory history format
        const historyItems = await Promise.all(orders.map(async order => {
          // Combine all coffee items into a single description
          const coffeeCount = order.items.length;
          const totalItems = order.items.reduce((sum, item) => sum + item.smallBags + item.largeBags, 0);
          const totalQuantity = order.items.reduce((sum, item) => sum + item.totalQuantity, 0);
          
          // Get ordered by user information
          let userInfo = { name: 'Unknown', role: null };
          if (order.orderedBy) {
            userInfo = {
              name: order.orderedBy.firstName 
                ? `${order.orderedBy.firstName} ${order.orderedBy.lastName || ''}`.trim() 
                : order.orderedBy.username,
              role: order.orderedBy.role
            };
          }
          
          // Create the order history entry with a format compatible with inventory history
          return {
            id: order.id,
            timestamp: order.createdAt, 
            type: 'ORDER',
            status: order.status,
            description: `Order with ${coffeeCount} types of coffee, ${totalItems} bags (${totalQuantity.toFixed(2)} kg)`,
            coffee: order.items[0]?.coffee || null,
            user: userInfo,
            changes: {
              previousValues: {
                smallBags: 0,
                largeBags: 0,
                totalQuantity: 0
              },
              newValues: {
                smallBags: order.items.reduce((sum, item) => sum + (item.smallBags || 0), 0),
                largeBags: order.items.reduce((sum, item) => sum + (item.largeBags || 0), 0),
                totalQuantity: totalQuantity
              },
              quantityChange: totalQuantity
            },
            details: {
              items: order.items.map(item => ({
                coffee: item.coffee ? item.coffee.name : 'Unknown Coffee',
                smallBags: item.smallBags,
                largeBags: item.largeBags,
                totalQuantity: item.totalQuantity
              }))
            }
          };
        }));
        
        await prisma.$disconnect();
        return res.status(200).json(historyItems);
      }
    } catch (ordersError) {
      console.error('Error fetching orders for history:', ordersError);
      // Continue to try other approaches
    }
    
    // Try to get inventory update history from UserActivity
    try {
      console.log('Looking for UserActivity records related to shop', shopId);
      
      // First get all inventory items for this shop
      const shopInventoryItems = await prisma.retailInventory.findMany({
        where: {
          shopId: shopId
        },
        select: {
          id: true,
          coffeeId: true,
          coffee: {
            select: {
              id: true,
              name: true,
              grade: true
            }
          }
        }
      });
      
      console.log(`Found ${shopInventoryItems.length} inventory items for shop`);
      
      // If no inventory items, we cannot find activities
      if (shopInventoryItems.length === 0) {
        console.log('No inventory items found for shop, so no activities expected');
        await prisma.$disconnect();
        return res.status(200).json([]);
      }
      
      // Extract inventory item IDs
      const inventoryIds = shopInventoryItems.map(item => item.id);
      console.log('Inventory item IDs:', inventoryIds);
      
      // Find all UserActivity records related to these inventory items
      const inventoryActivities = await prisma.userActivity.findMany({
        where: {
          resource: 'RETAIL_INVENTORY',
          createdAt: {
            gte: threeMonthsAgo
          },
          resourceId: {
            in: inventoryIds
          }
        },
        select: {
          id: true,
          action: true,
          createdAt: true,
          details: true,
          resourceId: true,
          userId: true,
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit number of results
      });
      
      console.log(`Found ${inventoryActivities.length} inventory activities for these inventory items`);
      
      // Also look for activities that might mention the shop ID in details
      const shopIdActivities = await prisma.userActivity.findMany({
        where: {
          resource: 'RETAIL_INVENTORY',
          createdAt: {
            gte: threeMonthsAgo
          },
          details: {
            contains: shopId
          },
          id: {
            notIn: inventoryActivities.map(a => a.id) // Exclude already found activities
          }
        },
        select: {
          id: true,
          action: true,
          createdAt: true,
          details: true,
          resourceId: true,
          userId: true,
          user: {
            select: {
              username: true,
              firstName: true,
              lastName: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 50 // Limit number of results
      });
      
      console.log(`Found ${shopIdActivities.length} additional inventory activities mentioning shop ID`);
      
      // Combine both sets of activities
      const allActivities = [...inventoryActivities, ...shopIdActivities];
      
      if (allActivities.length > 0) {
        // Enhanced processing with better data extraction
        const historyItems = await Promise.all(allActivities.map(async activity => {
          let details = {};
          try {
            details = JSON.parse(activity.details);
            console.log(`Activity ${activity.id} details:`, details);
          } catch (e) {
            console.error('Error parsing activity details:', e);
          }
          
          // Get coffee information for this inventory item
          let coffeeInfo = null;
          try {
            // First check if this inventory item is in our list
            const inventoryItem = shopInventoryItems.find(item => item.id === activity.resourceId);
            
            if (inventoryItem && inventoryItem.coffee) {
              coffeeInfo = inventoryItem.coffee;
            } else if (activity.resourceId) {
              // If not found, try to fetch from database
              const inventory = await prisma.retailInventory.findUnique({
                where: { id: activity.resourceId },
                select: {
                  coffee: {
                    select: {
                      id: true,
                      name: true,
                      grade: true
                    }
                  }
                }
              });
              
              if (inventory && inventory.coffee) {
                coffeeInfo = inventory.coffee;
              }
            }
          } catch (coffeeError) {
            console.error('Error getting coffee info:', coffeeError);
          }

          // Calculate quantity change
          let quantityChange = 0;
          if (details.previousValues && details.newValues) {
            quantityChange = 
              (details.newValues.totalQuantity || 0) - 
              (details.previousValues.totalQuantity || 0);
          }
          
          return {
            id: activity.id,
            timestamp: activity.createdAt,
            type: 'INVENTORY_UPDATE',
            action: activity.action,
            description: coffeeInfo 
              ? `Inventory ${activity.action.toLowerCase()} for ${coffeeInfo.name}`
              : `Inventory ${activity.action.toLowerCase()}`,
            coffee: coffeeInfo,
            user: {
              name: activity.user 
                ? (activity.user.firstName 
                   ? `${activity.user.firstName} ${activity.user.lastName || ''}`
                   : activity.user.username)
                : 'Unknown',
              role: activity.user ? activity.user.role : null
            },
            changes: {
              previousValues: details.previousValues || {},
              newValues: details.newValues || {},
              quantityChange: quantityChange
            }
          };
        }));
        
        await prisma.$disconnect();
        return res.status(200).json(historyItems);
      }
    } catch (activityError) {
      console.error('Error fetching inventory activities:', activityError);
    }
    
    // If we get here, we found no history
    console.log('No inventory history found for shop');
    await prisma.$disconnect();
    return res.status(200).json([]);
  } catch (error) {
    console.error('Unhandled error in inventory history API:', error);
    // Make sure to disconnect prisma in case of unhandled errors
    await prisma.$disconnect().catch(console.error);
    
    return res.status(200).json([]); // Return empty array
  }
} 