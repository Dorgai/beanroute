// Alternative email service using SendGrid for better delivery
const sgMail = require('@sendgrid/mail');

class SendGridEmailService {
  constructor() {
    const apiKey = process.env.SENDGRID_API_KEY;
    if (apiKey) {
      sgMail.setApiKey(apiKey);
      console.log('[SendGrid] Email service initialized');
    } else {
      console.warn('[SendGrid] API key not configured');
    }
  }

  async sendTestEmail(toEmail) {
    if (!process.env.SENDGRID_API_KEY) {
      return { success: false, error: 'SendGrid API key not configured' };
    }

    const msg = {
      to: toEmail,
      from: process.env.EMAIL_FROM || 'noreply@beanroute.com',
      subject: `Bean Route Test - ${new Date().toISOString()}`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 2px solid #4CAF50;">
          <h2 style="color: #4CAF50;">✅ Bean Route Email Test (SendGrid)</h2>
          <p><strong>Test Status:</strong> Email system is working correctly!</p>
          <p><strong>Service:</strong> SendGrid Professional Email Service</p>
          <p><strong>Sent To:</strong> ${toEmail}</p>
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          <hr>
          <p><em>This email was sent using SendGrid for reliable delivery.</em></p>
        </div>
      `,
    };

    try {
      const result = await sgMail.send(msg);
      console.log('[SendGrid] Email sent successfully:', result);
      return { 
        success: true, 
        message: 'Test email sent via SendGrid',
        messageId: result[0].headers['x-message-id']
      };
    } catch (error) {
      console.error('[SendGrid] Email send failed:', error);
      return { 
        success: false, 
        error: error.message,
        code: error.code
      };
    }
  }
}

module.exports = new SendGridEmailService();
