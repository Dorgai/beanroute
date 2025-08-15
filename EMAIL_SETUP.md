# Email Notification Setup Guide

This guide will help you set up email notifications for order status changes in Bean Route.

## Gmail SMTP Configuration

### 1. Enable 2-Factor Authentication

1. Go to your [Google Account settings](https://myaccount.google.com/)
2. Navigate to **Security** → **2-Step Verification**
3. Turn on 2-Step Verification if not already enabled

### 2. Generate App Password

1. Go to **Security** → **App passwords**
2. Select app: **Mail**
3. Select device: **Other (custom name)**
4. Enter name: **Bean Route System**
5. Click **Generate**
6. Copy the 16-character password that appears

### 3. Environment Variables

Add these environment variables to your `.env` file:

```env
# Email Configuration for Order Notifications
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-16-character-app-password
EMAIL_FROM="Bean Route System <your-gmail-address@gmail.com>"

# Optional: For debugging email issues
NODE_TLS_REJECT_UNAUTHORIZED=0
```

**Important Notes:**
- `EMAIL_USER`: Your full Gmail address
- `EMAIL_PASSWORD`: The 16-character app password (NOT your regular Gmail password)
- `EMAIL_FROM`: The "from" display name and email address for sent emails

### 4. Test Email Configuration

1. Start your application
2. Log in as an Admin or Owner
3. Navigate to **Admin** → **Order Email Notifications**
4. Click the **Test Email** button
5. Check your inbox for the test email

## Setting Up Email Notifications

### 1. Access Admin Panel

1. Log in with an Admin or Owner account
2. Navigate to **Admin** → **Order Email Notifications**

### 2. Configure Notifications

1. Click **Add Notification**
2. Select a **Shop** from the dropdown
3. Select an **Order Status** to monitor
4. Add one or more **Email Addresses** that should be notified
5. Toggle **Enable notifications** if needed
6. Click **Create**

### 3. Order Status Options

You can set up notifications for these order status changes:

- **PENDING** → Order is pending confirmation
- **CONFIRMED** → Order is confirmed and ready for roasting  
- **ROASTED** → Coffee has been roasted and ready for dispatch
- **DISPATCHED** → Order has been dispatched and on the way
- **DELIVERED** → Order has been delivered successfully
- **CANCELLED** → Order has been cancelled

### 4. Email Recipients

Each notification configuration can have multiple email addresses:
- Shop managers
- Roasters
- Quality control
- Customers (if desired)
- Admin staff

## How Email Notifications Work

### 1. Automatic Triggering

Email notifications are automatically sent when:
- An order status is changed through the system
- The status change matches a configured notification rule
- The notification rule is enabled for that shop

### 2. Email Content

Each email includes:
- Order ID and details
- Shop name
- Status change (from → to)
- Timestamp
- Order summary
- Professional formatting with status-specific colors

### 3. Delivery Confirmation

The system logs email delivery attempts and shows:
- Success/failure status
- Recipient email addresses
- Timestamps
- Error messages (if any)

## Troubleshooting

### Common Issues

1. **"Authentication failed" error**
   - Verify your Gmail address is correct
   - Ensure you're using the 16-character app password, not your regular password
   - Confirm 2-Factor Authentication is enabled

2. **"Test email not received"**
   - Check spam/junk folder
   - Verify the recipient email address
   - Ensure Gmail SMTP ports aren't blocked by firewall

3. **"SMTP connection failed"**
   - Check internet connectivity
   - Verify firewall allows outbound connections on port 587
   - Try setting `NODE_TLS_REJECT_UNAUTHORIZED=0` in development

### Email Provider Alternatives

While this guide focuses on Gmail, you can use other email providers by modifying the transporter configuration in `src/lib/order-email-service.js`:

```javascript
// For other providers
this.transporter = nodemailer.createTransporter({
  host: 'smtp.your-provider.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  }
});
```

## Security Best Practices

1. **Never commit email credentials** to version control
2. **Use app passwords** instead of main account passwords
3. **Rotate credentials** periodically
4. **Monitor email usage** for suspicious activity
5. **Use environment-specific configurations** for development/production

## Production Deployment

For production deployment:

1. Set environment variables in your hosting platform
2. Use secure credential storage (e.g., Railway secrets, Vercel environment variables)
3. Monitor email delivery rates
4. Set up email delivery monitoring/alerting
5. Consider using dedicated email services (SendGrid, Mailgun) for high volume

## Support

If you encounter issues:

1. Check the application logs for email-related errors
2. Test with the built-in email test function
3. Verify your Gmail app password is still valid
4. Check that the email notification rules are properly configured

The system is designed to never fail order status updates due to email issues - emails are sent on a "best effort" basis.





