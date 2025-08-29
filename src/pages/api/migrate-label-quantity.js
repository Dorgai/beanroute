// Emergency migration endpoint to add labelQuantity column
// Access this via: https://your-app.railway.app/api/migrate-label-quantity

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    console.log('[migrate-label-quantity] Starting migration...');

    // Check if column already exists
    const columnExists = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'GreenCoffee' 
      AND column_name = 'labelQuantity'
    `;
    
    if (columnExists.length > 0) {
      console.log('[migrate-label-quantity] Column already exists');
      return res.status(200).json({
        success: true,
        message: 'labelQuantity column already exists',
        columnExists: true
      });
    }

    console.log('[migrate-label-quantity] Adding labelQuantity column...');
    
    // Add the column
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "GreenCoffee" 
      ADD COLUMN "labelQuantity" INTEGER NOT NULL DEFAULT 0
    `);
    
    console.log('[migrate-label-quantity] Setting default values...');
    
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
    
    console.log('[migrate-label-quantity] Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: '✅ Migration completed! labelQuantity column added successfully. Label quantity editing should now work.',
      columnExists: verifyResult.length > 0,
      details: {
        columnAdded: true,
        defaultValuesSet: true,
        verificationPassed: verifyResult.length > 0
      }
    });

  } catch (error) {
    console.error('[migrate-label-quantity] Migration failed:', error);
    return res.status(500).json({ 
      success: false,
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
