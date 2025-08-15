import nodemailer from 'nodemailer';
import prisma from '@/lib/prisma';

/**
 * Email service for order status change notifications
 */
class OrderEmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize the nodemailer transporter with Gmail SMTP settings
   */
  initializeTransporter() {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;
    const emailFrom = process.env.EMAIL_FROM;

    if (!emailUser || !emailPassword) {
      console.warn('[OrderEmailService] Email credentials not configured. Email notifications will be disabled.');
      return;
    }

    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      console.log('[OrderEmailService] Email transporter initialized successfully');
    } catch (error) {
      console.error('[OrderEmailService] Failed to initialize email transporter:', error);
    }
  }

  /**
   * Get email notification settings for a specific shop and order status
   */
  async getEmailNotificationSettings(shopId, orderStatus) {
    try {
      const settings = await prisma.orderEmailNotification.findUnique({
        where: {
          shopId_orderStatus: {
            shopId,
            orderStatus
          }
        },
        include: {
          shop: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      return settings;
    } catch (error) {
      console.error('[OrderEmailService] Error fetching email notification settings:', error);
      return null;
    }
  }

  /**
   * Generate email content for order status change
   */
  generateEmailContent(order, oldStatus, newStatus, shop) {
    const statusDescriptions = {
      'PENDING': 'pending confirmation',
      'CONFIRMED': 'confirmed and ready for roasting',
      'ROASTED': 'roasted and ready for dispatch',
      'DISPATCHED': 'dispatched and on the way',
      'DELIVERED': 'delivered successfully',
      'CANCELLED': 'cancelled'
    };

    const statusColors = {
      'PENDING': '#ff9800',
      'CONFIRMED': '#2196f3',
      'ROASTED': '#9c27b0',
      'DISPATCHED': '#3f51b5',
      'DELIVERED': '#4caf50',
      'CANCELLED': '#f44336'
    };

    const subject = oldStatus 
      ? `Order Status Update - ${shop.name} - Order #${order.id.slice(-8)}`
      : `New Order Created - ${shop.name} - Order #${order.id.slice(-8)}`;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
          .content { background-color: #fff; padding: 20px; border: 1px solid #dee2e6; }
          .footer { background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; color: #6c757d; }
          .status-badge { 
            display: inline-block; 
            padding: 8px 16px; 
            border-radius: 20px; 
            color: white; 
            font-weight: bold; 
            text-transform: uppercase;
            font-size: 12px;
          }
          .order-details { background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 15px 0; }
          .status-change { text-align: center; margin: 20px 0; }
          .arrow { font-size: 24px; color: #6c757d; margin: 0 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1 style="margin: 0; color: #495057;">Bean Route - Order Status Update</h1>
          </div>
          
          <div class="content">
            ${oldStatus ? `
            <h2>Order Status Changed</h2>
            <p>Hello,</p>
            <p>The status of order <strong>#${order.id.slice(-8)}</strong> for <strong>${shop.name}</strong> has been updated.</p>
            
            <div class="status-change">
              <span class="status-badge" style="background-color: ${statusColors[oldStatus] || '#6c757d'}">
                ${oldStatus}
              </span>
              <span class="arrow">→</span>
              <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#6c757d'}">
                ${newStatus}
              </span>
            </div>
            
            <p>Your order is now <strong>${statusDescriptions[newStatus] || newStatus.toLowerCase()}</strong>.</p>
            ` : `
            <h2>New Order Created</h2>
            <p>Hello,</p>
            <p>A new order <strong>#${order.id.slice(-8)}</strong> has been created for <strong>${shop.name}</strong>.</p>
            
            <div class="status-change">
              <span class="status-badge" style="background-color: ${statusColors[newStatus] || '#6c757d'}">
                ${newStatus}
              </span>
            </div>
            
            <p>The order is <strong>${statusDescriptions[newStatus] || newStatus.toLowerCase()}</strong> and waiting for processing.</p>
            `}
            
            <div class="order-details">
              <h3 style="margin-top: 0;">Order Details</h3>
              <p><strong>Order ID:</strong> ${order.id}</p>
              <p><strong>Shop:</strong> ${shop.name}</p>
              <p><strong>Status:</strong> ${newStatus}</p>
              <p><strong>Updated:</strong> ${new Date().toLocaleString()}</p>
              ${order.comment ? `<p><strong>Comment:</strong> ${order.comment}</p>` : ''}
            </div>
            
            ${newStatus === 'DELIVERED' ? 
              '<p style="color: #4caf50; font-weight: bold;">🎉 Your order has been delivered! Thank you for choosing Bean Route.</p>' : 
              ''
            }
            ${newStatus === 'CANCELLED' ? 
              '<p style="color: #f44336; font-weight: bold;">This order has been cancelled. If you have any questions, please contact us.</p>' : 
              ''
            }
          </div>
          
          <div class="footer">
            <p>This is an automated notification from Bean Route.<br>
            Please do not reply to this email.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return { subject, html };
  }

  /**
   * Send order status change notification emails
   */
  async sendOrderStatusChangeNotification(orderId, oldStatus, newStatus, userId) {
    if (!this.transporter) {
      console.log('[OrderEmailService] Email transporter not configured, skipping email notification');
      return { success: false, error: 'Email not configured' };
    }

    try {
      console.log(`[OrderEmailService] Processing order status change notification for order ${orderId}`);

      // Get order details with shop information
      const order = await prisma.retailOrder.findUnique({
        where: { id: orderId },
        include: {
          shop: {
            select: {
              id: true,
              name: true
            }
          },
          items: {
            include: {
              coffee: {
                select: {
                  name: true,
                  country: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        console.error(`[OrderEmailService] Order ${orderId} not found`);
        return { success: false, error: 'Order not found' };
      }

      // Get email notification settings for this shop and status
      const emailSettings = await this.getEmailNotificationSettings(order.shopId, newStatus);
      
      if (!emailSettings || !emailSettings.isEnabled || !emailSettings.emails || emailSettings.emails.length === 0) {
        console.log(`[OrderEmailService] No email notifications configured for shop ${order.shop.name} and status ${newStatus}`);
        return { success: true, message: 'No email notifications configured for this shop/status' };
      }

      // Generate email content
      const { subject, html } = this.generateEmailContent(order, oldStatus, newStatus, order.shop);

      // Send emails to all configured recipients
      const emailResults = [];
      const emailFrom = process.env.EMAIL_FROM || '"Bean Route System" <no-reply@beanroute.com>';

      for (const email of emailSettings.emails) {
        try {
          console.log(`[OrderEmailService] Sending email to ${email}`);
          
          await this.transporter.sendMail({
            from: emailFrom,
            to: email,
            subject: subject,
            html: html
          });

          emailResults.push({
            email,
            success: true,
            timestamp: new Date().toISOString()
          });

          console.log(`[OrderEmailService] Email sent successfully to ${email}`);
        } catch (emailError) {
          console.error(`[OrderEmailService] Failed to send email to ${email}:`, emailError);
          emailResults.push({
            email,
            success: false,
            error: emailError.message,
            timestamp: new Date().toISOString()
          });
        }
      }

      const successCount = emailResults.filter(result => result.success).length;
      const totalCount = emailResults.length;

      console.log(`[OrderEmailService] Email notification completed: ${successCount}/${totalCount} emails sent successfully`);

      return {
        success: successCount > 0,
        emailResults,
        message: `${successCount}/${totalCount} emails sent successfully`
      };

    } catch (error) {
      console.error('[OrderEmailService] Error sending order status change notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfiguration(testEmail = 'test@example.com') {
    if (!this.transporter) {
      return { success: false, error: 'Email transporter not configured' };
    }

    try {
      await this.transporter.verify();
      
      // Send a test email
      const emailFrom = process.env.EMAIL_FROM || '"Bean Route System" <no-reply@beanroute.com>';
      
      await this.transporter.sendMail({
        from: emailFrom,
        to: testEmail,
        subject: 'Bean Route - Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Email Configuration Test</h2>
            <p>This is a test email to verify that your Bean Route email notification system is working correctly.</p>
            <p>If you received this email, your configuration is successful!</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
        `
      });

      return { success: true, message: 'Test email sent successfully' };
    } catch (error) {
      console.error('[OrderEmailService] Email configuration test failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create and export singleton instance
const orderEmailService = new OrderEmailService();
export default orderEmailService;
