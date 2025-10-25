const { PrismaClient } = require('@prisma/client');

async function checkRailwayInventoryData() {
  console.log('🔍 Checking Railway inventory data structure...');
  
  const prisma = new PrismaClient();
  
  try {
    // Check a sample inventory record
    const sampleInventory = await prisma.retailInventory.findFirst({
      select: {
        id: true,
        shopId: true,
        coffeeId: true,
        smallBags: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true,
        largeBags: true,
        totalQuantity: true
      }
    });
    
    console.log('📊 Sample inventory record:', sampleInventory);
    
    // Check if there are records with data in old fields
    const oldFieldData = await prisma.retailInventory.findMany({
      where: {
        OR: [
          { smallBags: { gt: 0 } },
          { largeBags: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        smallBags: true,
        largeBags: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true
      }
    });
    
    console.log('📊 Records with old field data:', oldFieldData.length);
    if (oldFieldData.length > 0) {
      console.log('📊 Sample old field data:', oldFieldData[0]);
    }
    
    // Check if there are records with data in new fields
    const newFieldData = await prisma.retailInventory.findMany({
      where: {
        OR: [
          { smallBagsEspresso: { gt: 0 } },
          { smallBagsFilter: { gt: 0 } },
          { mediumBagsEspresso: { gt: 0 } },
          { mediumBagsFilter: { gt: 0 } }
        ]
      },
      select: {
        id: true,
        smallBags: true,
        largeBags: true,
        smallBagsEspresso: true,
        smallBagsFilter: true,
        mediumBagsEspresso: true,
        mediumBagsFilter: true
      }
    });
    
    console.log('📊 Records with new field data:', newFieldData.length);
    if (newFieldData.length > 0) {
      console.log('📊 Sample new field data:', newFieldData[0]);
    }
    
    // Check total inventory records
    const totalRecords = await prisma.retailInventory.count();
    console.log('📊 Total inventory records:', totalRecords);
    
  } catch (error) {
    console.error('❌ Error checking inventory data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkRailwayInventoryData();
