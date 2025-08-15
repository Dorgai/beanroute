import { verifyRequestAndGetUser } from '@/lib/auth';
import { getServerSession } from '@/lib/session';
import orderEmailService from '@/lib/order-email-service';

export default async function handler(req, res) {
  console.log(`[test-email-config] Handling ${req.method} request`);

  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      console.log(`[test-email-config] Method ${req.method} not allowed`);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Get user session with multiple auth methods
    let user;
    try {
      // First try with API authentication method (for direct API calls)
      user = await verifyRequestAndGetUser(req);
      
      if (user) {
        console.log(`[test-email-config] API auth successful for user: ${user.id}, role: ${user.role}`);
      } else {
        // If that doesn't work, try with session (for browser usage)
        const session = await getServerSession({ req, res });
        if (session && session.user) {
          user = session.user;
          console.log(`[test-email-config] Session auth successful for user: ${user.id}, role: ${user.role}`);
        }
      }
      
      if (!user) {
        console.log('[test-email-config] Unauthorized access attempt');
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
    } catch (authError) {
      console.error('[test-email-config] Authentication error:', authError);
      return res.status(401).json({ error: 'Authentication failed' });
    }

    // Check if user is admin or owner
    const userRole = user.role;
    if (userRole !== 'ADMIN' && userRole !== 'OWNER') {
      console.log(`[test-email-config] Access denied for role: ${userRole}`);
      return res.status(403).json({ error: 'Access denied. Admin or Owner role required.' });
    }

    // Get test email from request body or use user's email as fallback
    const { testEmail } = req.body;
    const emailToTest = testEmail || user.email || 'admin@example.com';

    console.log(`[test-email-config] Testing email configuration with email: ${emailToTest}`);

    // Test the email configuration using the order email service
    const result = await orderEmailService.testEmailConfiguration(emailToTest);

    if (result.success) {
      console.log('[test-email-config] Email test successful');
      return res.status(200).json({
        success: true,
        message: `Test email sent successfully to ${emailToTest}`,
        testEmail: emailToTest
      });
    } else {
      console.error('[test-email-config] Email test failed:', result.error);
      return res.status(500).json({
        success: false,
        error: 'Email test failed',
        details: result.error,
        testEmail: emailToTest
      });
    }

  } catch (error) {
    console.error('[test-email-config] Unhandled error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}
