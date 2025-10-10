// Simple script to compare local vs production data
const { PrismaClient } = require('@prisma/client');

async function compareData() {
  const prisma = new PrismaClient();
  
  try {
    console.log('=== LOCAL DATABASE DATA ===');
    
    // Check coffee data
    const coffeeCount = await prisma.coffee.count();
    console.log(`Coffee count: ${coffeeCount}`);
    
    // Check shops data
    const shopsCount = await prisma.shop.count();
    console.log(`Shops count: ${shopsCount}`);
    
    // Check inventory data
    const inventoryCount = await prisma.retailInventory.count();
    console.log(`Retail inventory count: ${inventoryCount}`);
    
    // Check orders data
    const ordersCount = await prisma.retailOrder.count();
    console.log(`Retail orders count: ${ordersCount}`);
    
    // Get some sample data
    const sampleCoffee = await prisma.coffee.findMany({ take: 3 });
    console.log('Sample coffee:', sampleCoffee.map(c => ({ id: c.id, name: c.name, stock: c.stock })));
    
    const sampleShops = await prisma.shop.findMany({ take: 3 });
    console.log('Sample shops:', sampleShops.map(s => ({ id: s.id, name: s.name })));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

compareData();


