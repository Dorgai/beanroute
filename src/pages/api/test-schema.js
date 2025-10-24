import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  const prisma = new PrismaClient();
  
  try {
    // Test if the new schema is working
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
    
    res.status(200).json({
      success: true,
      message: 'Schema test successful',
      data: testResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Schema test failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  } finally {
    await prisma.$disconnect();
  }
}
