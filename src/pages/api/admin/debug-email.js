import { getServerSession } from '@/lib/session';
import orderEmailService from '@/lib/order-email-service';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Check authentication
    const session = await getServerSession(req, res);
    if (!session || !['ADMIN', 'OWNER'].includes(session.user.role)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { testEmail } = req.body;
    const emailToTest = testEmail || session.user.email || 'test@example.com';

    console.log(`[Debug Email] Starting comprehensive email test to: ${emailToTest}`);
    console.log(`[Debug Email] Environment check:`, {
      EMAIL_USER: process.env.EMAIL_USER ? 'SET' : 'NOT SET',
      EMAIL_PASSWORD: process.env.EMAIL_PASSWORD ? 'SET' : 'NOT SET', 
      EMAIL_FROM: process.env.EMAIL_FROM || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV
    });

    // Test the email service
    const result = await orderEmailService.testEmailConfiguration(emailToTest);
    
    console.log(`[Debug Email] Test result:`, result);

    return res.status(200).json({
      success: result.success,
      message: result.message,
      details: result.details,
      error: result.error,
      testEmail: emailToTest,
      timestamp: new Date().toISOString(),
      environment: {
        hasEmailUser: !!process.env.EMAIL_USER,
        hasEmailPassword: !!process.env.EMAIL_PASSWORD,
        hasEmailFrom: !!process.env.EMAIL_FROM,
        nodeEnv: process.env.NODE_ENV
      }
    });

  } catch (error) {
    console.error('[Debug Email] Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
}
