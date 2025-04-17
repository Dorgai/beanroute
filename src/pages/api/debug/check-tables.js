import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Only allow access if the request has a valid debug token
  const debugToken = req.query.token;
  
  if (debugToken !== process.env.DEBUG_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  try {
    // Create an object to store table information
    const tables = {};
    
    // User related tables
    tables.User = await prisma.user.count();
    tables.Session = await prisma.session.count();
    tables.Permission = await prisma.permission.count();
    tables.UserActivity = await prisma.userActivity.count();
    
    // Team related tables
    tables.Team = await prisma.team.count();
    tables.UserTeam = await prisma.userTeam.count();
    
    // Shop related tables
    tables.Shop = await prisma.shop.count();
    tables.UserShop = await prisma.userShop.count();
    
    // Coffee related tables
    tables.GreenCoffee = await prisma.greenCoffee.count();
    tables.GreenCoffeeInventoryLog = await prisma.greenCoffeeInventoryLog.count();
    
    // Retail related tables
    tables.RetailOrder = await prisma.retailOrder.count();
    tables.RetailOrderItem = await prisma.retailOrderItem.count();
    tables.RetailInventory = await prisma.retailInventory.count();
    
    return res.status(200).json({
      message: 'Database tables check successful',
      tables,
      schema: Object.keys(prisma).filter(key => !key.startsWith('_') && typeof prisma[key] === 'object'),
      databaseUrl: process.env.DATABASE_URL ? 
        process.env.DATABASE_URL.replace(/postgresql:\/\/[^:]+:[^@]+@/, 'postgresql://******:******@') : 
        'Not defined'
    });
  } catch (error) {
    console.error('Error checking database tables:', error);
    return res.status(500).json({ 
      error: 'Error checking database tables', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 