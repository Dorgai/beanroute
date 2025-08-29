// PUBLIC migration endpoint for labelQuantity column
// TEMPORARY - will be deleted after migration
// NO AUTHENTICATION REQUIRED for this emergency fix

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[add-label-quantity] Starting labelQuantity column migration...');

    // Check if column already exists
    const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    if (columnExists.length > 0) {
      console.log('[add-label-quantity] Column already exists');
      return res.status(200).json({
        success: true,
        message: 'labelQuantity column already exists',
        columnExists: true
      });
    }

    console.log('[add-label-quantity] Adding labelQuantity column to GreenCoffee table...');
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "GreenCoffee" 
      ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 0
    `);
    
    console.log('[add-label-quantity] Setting default values for existing coffees...');
    
    // Set default values for existing coffees
    await prisma.$executeRawUnsafe(`
      UPDATE "GreenCoffee" 
      SET "labelQuantity" = 100 
      WHERE "labelQuantity" = 0
    `);
    
    // Verify the column was added
    const verifyResult = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    console.log('[add-label-quantity] Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'labelQuantity column added successfully! Coffee management should now work.',
      columnExists: verifyResult.length > 0,
      details: {
        columnAdded: true,
        defaultValuesSet: true,
        verificationPassed: verifyResult.length > 0
      }
    });

  } catch (error) {
    console.error('[add-label-quantity] Error:', error);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
