import { execSync } from 'child_process';

export default async function handler(req, res) {
  // Only available in development or with special token
  if (process.env.NODE_ENV === 'production' && req.headers.authorization !== `Bearer ${process.env.ADMIN_API_TOKEN}`) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  try {
    console.log('Running seed script manually...');
    
    // Execute the prisma seed command
    execSync('npx prisma db seed', { stdio: 'inherit' });
    
    return res.status(200).json({ 
      success: true, 
      message: 'Database seeded successfully' 
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return res.status(500).json({ 
      success: false, 
      message: 'Error seeding database', 
      error: error.message 
    });
  }
} 