import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    console.log('=== DEBUGGING DATABASE SCHEMA ===');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Test RetailOrder table
    try {
      const orderCount = await prisma.retailOrder.count();
      console.log(`✅ RetailOrder table accessible, count: ${orderCount}`);
    } catch (error) {
      console.error('❌ RetailOrder table error:', error.message);
    }
    
    // Test RetailOrderItem table
    try {
      const itemCount = await prisma.retailOrderItem.count();
      console.log(`✅ RetailOrderItem table accessible, count: ${itemCount}`);
    } catch (error) {
      console.error('❌ RetailOrderItem table error:', error.message);
    }
    
    // Test GreenCoffee table
    try {
      const coffeeCount = await prisma.greenCoffee.count();
      console.log(`✅ GreenCoffee table accessible, count: ${coffeeCount}`);
    } catch (error) {
      console.error('❌ GreenCoffee table error:', error.message);
    }
    
    // Test Shop table
    try {
      const shopCount = await prisma.shop.count();
      console.log(`✅ Shop table accessible, count: ${shopCount}`);
    } catch (error) {
      console.error('❌ Shop table error:', error.message);
    }
    
    // Test User table
    try {
      const userCount = await prisma.user.count();
      console.log(`✅ User table accessible, count: ${userCount}`);
    } catch (error) {
      console.error('❌ User table error:', error.message);
    }
    
    // Test a simple transaction
    try {
      console.log('Testing simple transaction...');
      await prisma.$transaction(async (tx) => {
        const shop = await tx.shop.findFirst();
        if (shop) {
          console.log(`✅ Transaction test successful, found shop: ${shop.name}`);
        }
      });
    } catch (error) {
      console.error('❌ Transaction test failed:', error.message);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Schema debug completed - check console logs'
    });
    
  } catch (error) {
    console.error('Schema debug error:', error);
    res.status(500).json({ error: 'Schema debug failed', details: error.message });
  } finally {
    await prisma.$disconnect();
  }
}

