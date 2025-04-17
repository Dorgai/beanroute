import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify API key for CRON jobs or admin auth
    const apiKey = req.headers['x-api-key'];
    const isValidApiKey = apiKey && apiKey === process.env.INVENTORY_CHECK_API_KEY;
    
    let user = null;
    if (!isValidApiKey) {
      // If not using API key, validate user authentication
      user = await verifyRequestAndGetUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
    }

    // Get all shops
    const shops = await prisma.shop.findMany();
    const alertsSent = [];

    // Create nodemailer transporter using environment variables
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });

    // Check each shop for inventory alerts
    for (const shop of shops) {
      // Get inventory for this shop
      const inventory = await prisma.retailInventory.findMany({
        where: {
          shopId: shop.id
        },
        include: {
          coffee: true
        }
      });

      if (!inventory || inventory.length === 0) {
        continue;
      }

      // Calculate total quantities
      const totalSmallBags = inventory.reduce((sum, item) => sum + (item.smallBags || 0), 0);
      const totalLargeBags = inventory.reduce((sum, item) => sum + (item.largeBags || 0), 0);
      
      // Get minimum requirements
      const minSmallBags = shop.minCoffeeQuantitySmall || 10;
      const minLargeBags = shop.minCoffeeQuantityLarge || 5;
      
      // Calculate percentages
      const smallBagsPercentage = Math.min(100, (totalSmallBags / minSmallBags) * 100);
      const largeBagsPercentage = Math.min(100, (totalLargeBags / minLargeBags) * 100);
      
      // Determine alert levels
      const isSmallBagsCritical = totalSmallBags < minSmallBags * 0.3;
      const isSmallBagsWarning = totalSmallBags < minSmallBags * 0.7 && !isSmallBagsCritical;
      
      const isLargeBagsCritical = totalLargeBags < minLargeBags * 0.3;
      const isLargeBagsWarning = totalLargeBags < minLargeBags * 0.7 && !isLargeBagsCritical;
      
      // Determine overall status
      const hasCritical = isSmallBagsCritical || isLargeBagsCritical;
      const hasWarning = (isSmallBagsWarning || isLargeBagsWarning) && !hasCritical;

      // If there's an alert condition, send emails
      if (hasCritical || hasWarning) {
        // Get users to notify (shop users + admins + owners)
        const usersToNotify = await prisma.user.findMany({
          where: {
            OR: [
              {
                role: {
                  in: ['ADMIN', 'OWNER']
                }
              },
              {
                AND: [
                  { role: 'RETAILER' },
                  {
                    shops: {
                      some: {
                        shopId: shop.id
                      }
                    }
                  }
                ]
              }
            ]
          },
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true
          }
        });

        // Generate alert message
        const alertType = hasCritical ? 'CRITICAL' : 'WARNING';
        let alertText = `${alertType}: Retail inventory levels for ${shop.name} are ${hasCritical ? 'dangerously low' : 'running low'}!`;
        let alertDetails = `
          <p><strong>Current Inventory Status:</strong></p>
          <ul>
            <li>Small Bags: ${totalSmallBags} / ${minSmallBags} minimum (${smallBagsPercentage.toFixed(1)}%)</li>
            <li>Large Bags: ${totalLargeBags} / ${minLargeBags} minimum (${largeBagsPercentage.toFixed(1)}%)</li>
          </ul>
          <p>Please replenish your stock as soon as possible.</p>
          <p><a href="${process.env.BASE_URL || 'https://your-app-url.com'}/orders">Go to Retail Inventory</a></p>
        `;
        
        // Create an inventory alert log entry
        const notifiedUserIds = usersToNotify.map(u => u.id);
        const loggedBy = user ? user.id : usersToNotify.find(u => u.role === 'ADMIN')?.id || notifiedUserIds[0];
        
        const alertLog = await prisma.inventoryAlertLog.create({
          data: {
            shopId: shop.id,
            alertType,
            totalSmallBags,
            totalLargeBags,
            minSmallBags,
            minLargeBags,
            smallBagsPercentage,
            largeBagsPercentage,
            loggedById: loggedBy,
            notifiedUsers: {
              connect: notifiedUserIds.map(id => ({ id }))
            }
          }
        });

        // Send emails to all relevant users
        let emailsSent = false;
        for (const recipient of usersToNotify) {
          if (!recipient.email) continue;

          try {
            await transporter.sendMail({
              from: process.env.EMAIL_FROM || '"Bean Route System" <no-reply@beanroute.com>',
              to: recipient.email,
              subject: `${alertType} - Low Inventory Alert for ${shop.name}`,
              html: `
                <h2>Inventory Alert for ${shop.name}</h2>
                <p>Hello ${recipient.firstName || recipient.email},</p>
                <p>${alertText}</p>
                ${alertDetails}
                <p>This is an automated alert from the Bean Route system.</p>
              `,
            });

            emailsSent = true;
            alertsSent.push({
              shopId: shop.id,
              shopName: shop.name,
              recipientId: recipient.id,
              recipientEmail: recipient.email,
              alertType,
              timestamp: new Date().toISOString()
            });
          } catch (emailError) {
            console.error(`Failed to send email to ${recipient.email}:`, emailError);
          }
        }
        
        // Update the alert log to indicate emails were sent
        if (emailsSent) {
          await prisma.inventoryAlertLog.update({
            where: { id: alertLog.id },
            data: { emailsSent: true }
          });
        }
      }
    }

    return res.status(200).json({ 
      success: true, 
      alertsSent,
      message: `Successfully checked inventory. ${alertsSent.length} alert emails sent.` 
    });
  } catch (error) {
    console.error('Error in check-inventory-alerts:', error);
    return res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 