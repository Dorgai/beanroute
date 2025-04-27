// Script to update existing coffee inventory to 180kg
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

async function updateCoffeeInventory() {
  console.log('Starting coffee inventory update process...');
  
  // Check if running on Railway
  if (process.env.RAILWAY_ENVIRONMENT === 'production') {
    console.log('Running in Railway environment');
    
    // Use PUBLIC_URL for database connection if available
    if (process.env.DATABASE_PUBLIC_URL) {
      console.log('Using DATABASE_PUBLIC_URL for connection');
      process.env.DATABASE_URL = process.env.DATABASE_PUBLIC_URL;
    }
  }
  
  // Create prisma client
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    console.log('Database URL: ' + (process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 15) + '...' : 'Not set'));
    await prisma.$connect();
    
    // First, verify database connectivity
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection verified ✓');
    
    // Find the admin user
    console.log('Looking up admin user...');
    const adminUser = await prisma.user.findFirst({
      where: {
        role: 'ADMIN'
      }
    });
    
    if (!adminUser) {
      throw new Error('Admin user not found');
    }
    
    console.log(`Found admin user with ID: ${adminUser.id}`);
    
    // Find existing coffee
    const existingCoffees = await prisma.greenCoffee.findMany({
      take: 10
    });
    
    if (existingCoffees.length === 0) {
      throw new Error('No coffees found in the database');
    }
    
    console.log(`Found ${existingCoffees.length} coffees in database:`);
    existingCoffees.forEach(coffee => {
      console.log(`- ${coffee.id}: ${coffee.name} (${coffee.country}) - Current quantity: ${coffee.quantity}kg`);
    });
    
    // Update all coffee records to have equal shares of 180kg total
    const coffeeCount = existingCoffees.length;
    const quantityPerCoffee = Math.floor(180 / coffeeCount);
    const remainder = 180 - (quantityPerCoffee * coffeeCount);
    
    console.log(`Setting each coffee to have ${quantityPerCoffee}kg (with ${remainder}kg remainder for the first one)`);
    
    // Update each coffee
    for (let i = 0; i < existingCoffees.length; i++) {
      const coffee = existingCoffees[i];
      const quantity = i === 0 ? quantityPerCoffee + remainder : quantityPerCoffee;
      
      await prisma.greenCoffee.update({
        where: { id: coffee.id },
        data: { quantity }
      });
      
      console.log(`Updated coffee ${coffee.name} to ${quantity}kg`);
      
      // Create inventory log if needed
      try {
        await prisma.greenCoffeeInventoryLog.create({
          data: {
            coffeeId: coffee.id,
            userId: adminUser.id,
            changeAmount: quantity - coffee.quantity,
            quantity: quantity,
            notes: 'Inventory reset to match indicator'
          }
        });
        console.log(`Created inventory log for coffee ${coffee.id}`);
      } catch (logError) {
        console.error(`Error creating inventory log for coffee ${coffee.id}:`, logError.message);
      }
    }
    
    // Get the updated total
    const updatedTotal = await prisma.greenCoffee.aggregate({
      _sum: {
        quantity: true
      }
    });
    
    console.log(`\nCoffee inventory updated successfully. New total: ${updatedTotal._sum.quantity}kg`);
    
  } catch (error) {
    console.error('Error updating coffee inventory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the function
updateCoffeeInventory().catch(error => {
  console.error('Unhandled error during update:', error);
  process.exit(1);
}); 