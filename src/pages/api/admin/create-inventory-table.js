import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';
import prisma from '@/lib/prisma';

// Force Node.js runtime for auth operations
export const runtime = 'nodejs';


export default async function handler(req, res) {
  try {
    // Handle authentication
    let user;
    try {
      user = await verifyRequestAndGetUser(req);
      if (!user) {
        const session = await getServerSession({ req, res });
        if (session && session.user) {
          user = session.user;
        }
      }
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    } catch (authError) {
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user has admin privileges
    if (!['ADMIN', 'OWNER'].includes(user.role)) {
      return res.status(403).json({ error: 'Access denied. Admin or Owner role required.' });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    console.log('[create-inventory-table] Starting table creation...');

    // Check if table already exists
    const tableExists = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryEmailNotification';
    `;

    if (tableExists.length > 0) {
      console.log('[create-inventory-table] Table already exists');
      return res.status(200).json({
        success: true,
        message: 'InventoryEmailNotification table already exists',
        tableExists: true
      });
    }

    // Create the table
    console.log('[create-inventory-table] Creating table...');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE "public"."InventoryEmailNotification" (
        "id" UUID NOT NULL DEFAULT gen_random_uuid(),
        "shopId" UUID,
        "emails" TEXT[] NOT NULL,
        "isEnabled" BOOLEAN NOT NULL DEFAULT true,
        "alertType" TEXT NOT NULL DEFAULT 'ALL',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdById" UUID NOT NULL,
        CONSTRAINT "InventoryEmailNotification_pkey" PRIMARY KEY ("id")
      );
    `);

    console.log('[create-inventory-table] Creating indexes...');
    
    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "InventoryEmailNotification_shopId_idx" 
      ON "public"."InventoryEmailNotification"("shopId");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE INDEX "InventoryEmailNotification_alertType_idx" 
      ON "public"."InventoryEmailNotification"("alertType");
    `);
    
    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX "InventoryEmailNotification_shopId_alertType_key" 
      ON "public"."InventoryEmailNotification"("shopId", "alertType");
    `);

    console.log('[create-inventory-table] Adding foreign key constraints...');
    
    // Add foreign key constraints
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."InventoryEmailNotification" 
      ADD CONSTRAINT "InventoryEmailNotification_shopId_fkey" 
      FOREIGN KEY ("shopId") REFERENCES "public"."Shop"("id") 
      ON DELETE SET NULL ON UPDATE CASCADE;
    `);
    
    await prisma.$executeRawUnsafe(`
      ALTER TABLE "public"."InventoryEmailNotification" 
      ADD CONSTRAINT "InventoryEmailNotification_createdById_fkey" 
      FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") 
      ON DELETE RESTRICT ON UPDATE CASCADE;
    `);

    // Verify the table was created
    const verifyResult = await prisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'InventoryEmailNotification';
    `;

    console.log('[create-inventory-table] Table creation completed successfully');

    return res.status(200).json({
      success: true,
      message: 'InventoryEmailNotification table created successfully',
      tableExists: verifyResult.length > 0,
      details: {
        tableCreated: true,
        indexesCreated: true,
        constraintsAdded: true
      }
    });

  } catch (error) {
    console.error('[create-inventory-table] Error:', error);
    return res.status(500).json({ 
      error: 'Failed to create table', 
      details: error.message 
    });
  }
}







