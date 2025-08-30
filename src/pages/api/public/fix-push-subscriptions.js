// PUBLIC migration endpoint to fix push subscription table
// Create missing PushSubscription table for push notifications
// NO AUTHENTICATION REQUIRED for emergency fixes

import prisma from '@/lib/prisma';

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[public-fix-push-subscriptions] Starting push subscription table migration...');

    // Check if table already exists
    const existingTables = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'PushSubscription';
    `;
    
    if (existingTables.length > 0) {
      console.log('[public-fix-push-subscriptions] PushSubscription table already exists');
      return res.status(200).json({
        success: true,
        message: 'PushSubscription table already exists',
        tableExists: true
      });
    }

    console.log('[public-fix-push-subscriptions] Creating PushSubscription table...');
    
    // Create the PushSubscription table
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
    
    console.log('[public-fix-push-subscriptions] Creating indexes...');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "PushSubscription_userId_idx" 
      ON "public"."PushSubscription"("userId");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "PushSubscription_endpoint_idx" 
      ON "public"."PushSubscription"("endpoint");
    `);
    
    console.log('[public-fix-push-subscriptions] Adding foreign key constraints...');
    
    // Add foreign key constraint
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."PushSubscription" 
      ADD CONSTRAINT "PushSubscription_userId_fkey" 
      FOREIGN KEY ("userId") REFERENCES "public"."User"("id") 
      ON DELETE CASCADE ON UPDATE CASCADE;
    `);
    
    // Verify the table was created
    const verifyResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'PushSubscription';
    `;
    
    console.log('[public-fix-push-subscriptions] Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'PushSubscription table created successfully!',
      tableExists: verifyResult.length > 0,
      details: {
        tableCreated: true,
        indexesCreated: true,
        constraintsAdded: true,
        verificationPassed: verifyResult.length > 0
      }
    });

  } catch (error) {
    console.error('[public-fix-push-subscriptions] Error:', error);
    return res.status(500).json({ 
      error: 'Migration failed', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
