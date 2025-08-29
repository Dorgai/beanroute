/**
 * Production deployment script for label tracking functionality
 * This script safely applies the labelQuantity feature to production
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');

async function deployLabelTracking() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Deploying label tracking functionality to production...');
    
    // 1. Check if labelQuantity column already exists
    console.log('1. Checking database schema...');
    const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    if (columnExists.length > 0) {
      console.log('✅ labelQuantity column already exists in database');
    } else {
      console.log('2. Adding labelQuantity column to GreenCoffee table...');
      
      // Apply the migration
      await prisma.$executeRaw`
        ALTER TABLE "GreenCoffee" 
        ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 0
      `;
      
      console.log('✅ labelQuantity column added successfully');
      
      // 3. Set default values for existing coffees
      console.log('3. Setting default label quantities for existing coffees...');
      const updateResult = await prisma.$executeRaw`
        UPDATE "GreenCoffee" 
        SET "labelQuantity" = 100 
        WHERE "labelQuantity" = 0
      `;
      
      console.log(`✅ Updated ${updateResult} coffee entries with default label quantities`);
    }
    
    // 4. Verify the deployment
    console.log('4. Verifying deployment...');
    const coffeeWithLabels = await prisma.greenCoffee.findMany({
      select: {
        name: true,
        labelQuantity: true
      },
      take: 3
    });
    
    console.log('✅ Sample coffee entries with label quantities:');
    coffeeWithLabels.forEach(coffee => {
      console.log(`   - ${coffee.name}: ${coffee.labelQuantity} labels`);
    });
    
    console.log('\n🎉 Label tracking functionality deployed successfully!');
    console.log('\n📋 Features now available:');
    console.log('   • Label quantity tracking for each coffee type');
    console.log('   • Automatic label reservation on order PENDING');
    console.log('   • Automatic label return on order CANCELLED');
    console.log('   • Red alert when labels < 15');
    console.log('   • Manual label quantity management in coffee forms');
    
  } catch (error) {
    console.error('❌ Error during deployment:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the deployment
deployLabelTracking();
