export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    // Test if the new schema is working
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    
    const testResult = await prisma.retailInventory.findMany({
      take: 1,
      select: {
        id: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true
      }
    });
    
    await prisma.$disconnect();
    
    res.status(200).json({
      success: true,
      version: '0.1.1',
      message: 'Schema test successful - 500g bag support enabled',
      data: testResult,
      timestamp: new Date().toISOString(),
      deployment: 'RAILWAY_PRODUCTION'
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      version: '0.1.1',
      message: 'Schema test failed',
      error: error.message,
      timestamp: new Date().toISOString(),
      deployment: 'RAILWAY_PRODUCTION'
    });
  }
}
