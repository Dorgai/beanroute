// Emergency database fix for push notification table
import { getServerSession } from '@/lib/session';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const prisma = new PrismaClient();

  try {
    // Get user session and check admin permissions
    const session = await getServerSession(req, res);
    if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('[DB Fix] Starting emergency push notification database fix...');

    // First, check if columns already exist
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'PushSubscription' 
      AND column_name IN ('limited', 'mobile');
    `;

    const existingColumns = await prisma.$queryRaw`${checkQuery}`;
    console.log('[DB Fix] Existing columns:', existingColumns);

    const hasLimited = existingColumns.some(col => col.column_name === 'limited');
    const hasMobile = existingColumns.some(col => col.column_name === 'mobile');

    let addedColumns = [];

    // Add missing columns
    if (!hasLimited) {
      console.log('[DB Fix] Adding limited column...');
      await prisma.$executeRaw`ALTER TABLE "PushSubscription" ADD COLUMN "limited" BOOLEAN NOT NULL DEFAULT false;`;
      addedColumns.push('limited');
    }

    if (!hasMobile) {
      console.log('[DB Fix] Adding mobile column...');
      await prisma.$executeRaw`ALTER TABLE "PushSubscription" ADD COLUMN "mobile" BOOLEAN NOT NULL DEFAULT false;`;
      addedColumns.push('mobile');
    }

    console.log('[DB Fix] Database fix completed successfully');

    res.status(200).json({
      success: true,
      message: 'Push notification database schema fixed',
      addedColumns,
      existingColumns: existingColumns.map(col => col.column_name)
    });

  } catch (error) {
    console.error('[DB Fix] Error fixing database:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fix database schema',
      details: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}
