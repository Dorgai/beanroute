// Emergency migration endpoint to fix shop schema
// Add missing minCoffeeQuantityEspresso and minCoffeeQuantityFilter fields

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[fix-shop-schema] Starting shop schema migration...');

    // Check if fields already exist
    const existingColumns = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Shop'
      AND column_name IN ('minCoffeeQuantityEspresso', 'minCoffeeQuantityFilter');
    `;
    
    const existingColumnNames = existingColumns.map(col => col.column_name);
    console.log('[fix-shop-schema] Existing columns:', existingColumnNames);

    let fieldsAdded = [];

    // Add minCoffeeQuantityEspresso if it doesn't exist
    if (!existingColumnNames.includes('minCoffeeQuantityEspresso')) {
      console.log('[fix-shop-schema] Adding minCoffeeQuantityEspresso column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."Shop" 
        ADD COLUMN "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0;
      `);
      fieldsAdded.push('minCoffeeQuantityEspresso');
    }

    // Add minCoffeeQuantityFilter if it doesn't exist
    if (!existingColumnNames.includes('minCoffeeQuantityFilter')) {
      console.log('[fix-shop-schema] Adding minCoffeeQuantityFilter column...');
      await prisma.$executeRawUnsafe(`
        ALTER TABLE "public"."Shop" 
        ADD COLUMN "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;
      `);
      fieldsAdded.push('minCoffeeQuantityFilter');
    }

    // Verify the fields were added
    const verifyResult = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'Shop'
      AND column_name IN ('minCoffeeQuantityEspresso', 'minCoffeeQuantityFilter');
    `;
    
    const verifiedColumns = verifyResult.map(col => col.column_name);
    console.log('[fix-shop-schema] Verified columns:', verifiedColumns);

    if (fieldsAdded.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'All required fields already exist in Shop table',
        fieldsAdded: [],
        existingFields: verifiedColumns
      });
    }

    console.log('[fix-shop-schema] Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Shop schema updated successfully!',
      fieldsAdded: fieldsAdded,
      existingFields: verifiedColumns,
      details: {
        migrationCompleted: true,
        fieldsAdded: fieldsAdded.length,
        verificationPassed: verifiedColumns.length === 2
      }
    });

  } catch (error) {
    console.error('[fix-shop-schema] Error:', error);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
