import { getServerSession } from '@/lib/session';
import { getHaircutPercentage, updateHaircutPercentage, getHaircutInfo } from '@/lib/haircut-service';
import { PrismaClient } from '@prisma/client';

export default async function handler(req, res) {
  // Create a dedicated prisma instance for this request
  const prisma = new PrismaClient();
  
  // Only allow GET and PUT requests
  if (req.method !== 'GET' && req.method !== 'PUT') {
    await prisma.$disconnect();
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const session = await getServerSession(req, res);
    if (!session) {
      await prisma.$disconnect();
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!['ADMIN', 'OWNER'].includes(session.user.role)) {
      await prisma.$disconnect();
      return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
    }

    if (req.method === 'GET') {
      const haircutInfo = await getHaircutInfo(prisma);
      await prisma.$disconnect();
      return res.status(200).json(haircutInfo);
    }

    if (req.method === 'PUT') {
      const { percentage } = req.body;
      if (percentage === undefined || percentage === null) {
        await prisma.$disconnect();
        return res.status(400).json({ error: 'Percentage is required' });
      }
      const result = await updateHaircutPercentage(parseFloat(percentage), session.user.id, prisma);
      if (result.success) {
        const updatedInfo = await getHaircutInfo(prisma);
        await prisma.$disconnect();
        return res.status(200).json({ success: true, message: result.message, haircutInfo: updatedInfo });
      } else {
        await prisma.$disconnect();
        return res.status(400).json({ success: false, error: result.message });
      }
    }
  } catch (error) {
    console.error('Error in haircut settings API:', error);
    await prisma.$disconnect();
    return res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
