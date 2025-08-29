#!/usr/bin/env node

// Direct database migration script for Railway
// Run this with: railway run node add-label-quantity-direct.js

const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🚀 Starting labelQuantity column migration...');
    
    // Check if column already exists
    console.log('📊 Checking if labelQuantity column exists...');
    const columnCheck = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    if (columnCheck.length > 0) {
      console.log('✅ labelQuantity column already exists!');
      process.exit(0);
    }
    
    console.log('📝 Adding labelQuantity column...');
    
    // Add the column
    await prisma.$executeRaw`
      ALTER TABLE "GreenCoffee" 
      ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 100
    `;
    
    console.log('✅ labelQuantity column added successfully!');
    
    // Update existing records to have a reasonable default
    console.log('🔄 Setting default values for existing coffee entries...');
    const updateResult = await prisma.$executeRaw`
      UPDATE "GreenCoffee" 
      SET "labelQuantity" = 100 
      WHERE "labelQuantity" IS NULL OR "labelQuantity" = 0
    `;
    
    console.log(`✅ Updated ${updateResult} existing coffee entries with default label quantity`);
    
    // Verify the column was added
    console.log('🔍 Verifying column was added...');
    const verifyColumn = await prisma.$queryRaw`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    if (verifyColumn.length > 0) {
      console.log('✅ Verification successful! Column details:', verifyColumn[0]);
    } else {
      console.error('❌ Verification failed! Column not found.');
      process.exit(1);
    }
    
    console.log('🎉 Migration completed successfully!');
    console.log('💡 Coffee label quantity editing should now work in the UI.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
