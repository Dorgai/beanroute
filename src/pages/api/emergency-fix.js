// Emergency database fix endpoint
// Call this from your browser to fix database issues
// NO AUTHENTICATION REQUIRED for emergency fixes

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[emergency-fix] Starting database fixes...');

    const results = {
      shopTable: { success: false, message: '' },
      pushSubscriptionTable: { success: false, message: '' }
    };

    // 1. Fix Shop table - add missing columns
    try {
      console.log('[emergency-fix] Fixing Shop table...');
      
      // Check if minCoffeeQuantityEspresso exists
      const espressoExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityEspresso';
      `;
      
      if (espressoExists.length === 0) {
        console.log('[emergency-fix] Adding minCoffeeQuantityEspresso column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."Shop" 
          ADD COLUMN "minCoffeeQuantityEspresso" INTEGER NOT NULL DEFAULT 0;
        `);
        results.shopTable.success = true;
        results.shopTable.message = 'Added minCoffeeQuantityEspresso column';
      } else {
        results.shopTable.success = true;
        results.shopTable.message = 'minCoffeeQuantityEspresso column already exists';
      }

      // Check if minCoffeeQuantityFilter exists
      const filterExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'Shop' 
        AND column_name = 'minCoffeeQuantityFilter';
      `;
      
      if (filterExists.length === 0) {
        console.log('[emergency-fix] Adding minCoffeeQuantityFilter column...');
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."Shop" 
          ADD COLUMN "minCoffeeQuantityFilter" INTEGER NOT NULL DEFAULT 0;
        `);
        results.shopTable.message += ' and minCoffeeQuantityFilter column';
      } else {
        results.shopTable.message += ' (minCoffeeQuantityFilter already exists)';
      }

    } catch (error) {
      console.error('[emergency-fix] Shop table error:', error);
      results.shopTable.message = `Error: ${error.message}`;
    }

    // 2. Create PushSubscription table
    try {
      console.log('[emergency-fix] Fixing PushSubscription table...');
      
      const tableExists = await prisma.$queryRaw`
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'PushSubscription';
      `;
      
      if (tableExists.length === 0) {
        console.log('[emergency-fix] Creating PushSubscription table...');
        
        // Create the table
        await prisma.$executeRawUnsafe(`
          CREATE TABLE "public"."PushSubscription" (
            "id" TEXT NOT NULL,
            "endpoint" TEXT NOT NULL,
            "p256dh" TEXT NOT NULL,
            "auth" TEXT NOT NULL,
            "userId" TEXT NOT NULL,
            "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
          );
        `);
        
        // Create indexes
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "PushSubscription_userId_idx" 
          ON "public"."PushSubscription"("userId");
        `);
        
        await prisma.$executeRawUnsafe(`
          CREATE INDEX "PushSubscription_endpoint_idx" 
          ON "public"."PushSubscription"("endpoint");
        `);
        
        // Add foreign key constraint
        await prisma.$executeRawUnsafe(`
          ALTER TABLE "public"."PushSubscription" 
          ADD CONSTRAINT "PushSubscription_userId_fkey" 
          FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
          ON DELETE CASCADE ON UPDATE CASCADE;
        `);
        
        results.pushSubscriptionTable.success = true;
        results.pushSubscriptionTable.message = 'Created PushSubscription table with indexes and constraints';
      } else {
        results.pushSubscriptionTable.success = true;
        results.pushSubscriptionTable.message = 'PushSubscription table already exists';
      }

    } catch (error) {
      console.error('[emergency-fix] PushSubscription table error:', error);
      results.pushSubscriptionTable.message = `Error: ${error.message}`;
    }

    console.log('[emergency-fix] Database fixes completed');

    return res.status(200).json({
      success: true,
      message: 'Database fixes completed',
      results,
      summary: {
        shopSelectorFixed: results.shopTable.success,
        pushNotificationsFixed: results.pushSubscriptionTable.success
      }
    });

  } catch (error) {
    console.error('[emergency-fix] Error:', error);
    return res.status(500).json({ 
      error: 'Emergency fix failed', 
      details: error.message
    });
  }
}
