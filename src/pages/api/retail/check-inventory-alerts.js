import { verifyRequestAndGetUser } from '@/lib/auth';
import prisma from '@/lib/prisma';
import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  console.log('[check-inventory-alerts] Starting inventory check handler');
  
  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      console.log('[check-inventory-alerts] Method not allowed:', req.method);
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify API key for CRON jobs or admin auth
    const apiKey = req.headers['x-api-key'];
    const expectedApiKey = process.env.INVENTORY_CHECK_API_KEY;
    console.log('[check-inventory-alerts] API key check:', { 
      receivedKey: apiKey ? 'Key provided' : 'No key',
      configuredKey: expectedApiKey ? 'Key configured' : 'No key configured'
    });
    
    const isValidApiKey = apiKey && apiKey === expectedApiKey;
    console.log('[check-inventory-alerts] API key validation result:', { isValidApiKey });
    
    let user = null;
    if (!isValidApiKey) {
      // If not using API key, validate user authentication
      try {
        console.log('[check-inventory-alerts] Verifying user authentication');
        user = await verifyRequestAndGetUser(req);
        if (!user) {
          console.log('[check-inventory-alerts] Unauthorized access attempt');
          return res.status(401).json({ error: 'Unauthorized' });
        }
        console.log('[check-inventory-alerts] User authenticated:', { id: user.id, role: user.role });
      } catch (authError) {
        console.error('[check-inventory-alerts] Authentication error:', authError);
        return res.status(401).json({ error: 'Authentication failed', details: authError.message });
      }
    }

    // Check if required tables exist (skip if they don't)
    console.log('[check-inventory-alerts] Checking for required database tables');
    let hasInventoryAlertLogTable = true;
    
    try {
      await prisma.inventoryAlertLog.findFirst({
        select: { id: true },
        take: 1
      });
      console.log('[check-inventory-alerts] InventoryAlertLog table exists');
    } catch (tableError) {
      console.warn('[check-inventory-alerts] InventoryAlertLog table might not exist:', tableError.message);
      hasInventoryAlertLogTable = false;
      // We'll continue but won't attempt to log alerts to the database
    }

    // Get all shops
    console.log('[check-inventory-alerts] Fetching shops');
    let shops = [];
    try {
      shops = await prisma.shop.findMany();
      console.log(`[check-inventory-alerts] Found ${shops.length} shops`);
    } catch (shopError) {
      console.error('[check-inventory-alerts] Error fetching shops:', shopError);
      return res.status(500).json({ 
        error: 'Failed to fetch shops',
        details: shopError.message
      });
    }
    
    const alertsSent = [];

    // Check if SMTP is configured
    console.log('[check-inventory-alerts] Checking SMTP configuration');
    const hasSmtpConfig = !!process.env.SMTP_USER && !!process.env.SMTP_PASSWORD;
    console.log('[check-inventory-alerts] SMTP configured:', hasSmtpConfig);

    let transporter = null;
    if (hasSmtpConfig) {
      // Create nodemailer transporter using environment variables
      try {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587', 10),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASSWORD,
          },
        });
        console.log('[check-inventory-alerts] SMTP transporter created successfully');
      } catch (smtpError) {
        console.error('[check-inventory-alerts] Error creating SMTP transporter:', smtpError);
        // Continue without email functionality
      }
    }

    // Check each shop for inventory alerts
    console.log('[check-inventory-alerts] Processing each shop for inventory alerts');
    for (const shop of shops) {
      console.log(`[check-inventory-alerts] Processing shop: ${shop.id} (${shop.name})`);
      
      // Get inventory for this shop
      let inventory = [];
      try {
        inventory = await prisma.retailInventory.findMany({
          where: {
            shopId: shop.id
          },
          include: {
            coffee: true
          }
        });
        console.log(`[check-inventory-alerts] Found ${inventory.length} inventory items for shop ${shop.name}`);
      } catch (inventoryError) {
        console.error(`[check-inventory-alerts] Error fetching inventory for shop ${shop.id}:`, inventoryError);
        continue; // Skip to next shop
      }

      if (!inventory || inventory.length === 0) {
        console.log(`[check-inventory-alerts] No inventory found for shop ${shop.name}, skipping`);
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

      console.log(`[check-inventory-alerts] Shop ${shop.name} inventory status:`, {
        totalSmallBags,
        totalLargeBags,
        minSmallBags,
        minLargeBags,
        smallBagsPercentage: smallBagsPercentage.toFixed(1) + '%',
        largeBagsPercentage: largeBagsPercentage.toFixed(1) + '%',
        hasCritical,
        hasWarning
      });

      // If there's an alert condition, send emails
      if (hasCritical || hasWarning) {
        console.log(`[check-inventory-alerts] Alert condition detected for shop ${shop.name}: ${hasCritical ? 'CRITICAL' : 'WARNING'}`);
        
        // Get users to notify (shop users + admins + owners)
        let usersToNotify = [];
        try {
          usersToNotify = await prisma.user.findMany({
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
          console.log(`[check-inventory-alerts] Found ${usersToNotify.length} users to notify`);
        } catch (userError) {
          console.error(`[check-inventory-alerts] Error fetching users to notify for shop ${shop.id}:`, userError);
          continue; // Skip to next shop
        }

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
        
        // Create an inventory alert log entry if the table exists
        let alertLog = null;
        if (hasInventoryAlertLogTable) {
          try {
            const notifiedUserIds = usersToNotify.map(u => u.id);
            const loggedBy = user ? user.id : usersToNotify.find(u => u.role === 'ADMIN')?.id || notifiedUserIds[0];
            
            alertLog = await prisma.inventoryAlertLog.create({
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
            console.log(`[check-inventory-alerts] Created inventory alert log: ${alertLog.id}`);
          } catch (logError) {
            console.error(`[check-inventory-alerts] Error creating inventory alert log for shop ${shop.id}:`, logError);
            // Continue without logging
          }
        }

        // Send emails to all relevant users if SMTP is configured
        let emailsSent = false;
        if (transporter) {
          for (const recipient of usersToNotify) {
            if (!recipient.email) {
              console.log(`[check-inventory-alerts] User ${recipient.id} has no email, skipping`);
              continue;
            }

            try {
              console.log(`[check-inventory-alerts] Sending email to ${recipient.email}`);
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
              console.log(`[check-inventory-alerts] Email sent to ${recipient.email}`);
              alertsSent.push({
                shopId: shop.id,
                shopName: shop.name,
                recipientId: recipient.id,
                recipientEmail: recipient.email,
                alertType,
                timestamp: new Date().toISOString()
              });
            } catch (emailError) {
              console.error(`[check-inventory-alerts] Failed to send email to ${recipient.email}:`, emailError);
            }
          }
        } else {
          console.log('[check-inventory-alerts] SMTP not configured, skipping email sending');
          // Add to alertsSent anyway to show in UI - we'll mark it as "would have sent"
          for (const recipient of usersToNotify) {
            if (!recipient.email) continue;
            alertsSent.push({
              shopId: shop.id,
              shopName: shop.name,
              recipientId: recipient.id,
              recipientEmail: recipient.email,
              alertType,
              timestamp: new Date().toISOString(),
              note: 'Email not sent - SMTP not configured'
            });
          }
        }
        
        // Update the alert log to indicate emails were sent
        if (alertLog && emailsSent && hasInventoryAlertLogTable) {
          try {
            await prisma.inventoryAlertLog.update({
              where: { id: alertLog.id },
              data: { emailsSent: true }
            });
            console.log(`[check-inventory-alerts] Updated alert log ${alertLog.id} with emailsSent=true`);
          } catch (updateError) {
            console.error(`[check-inventory-alerts] Error updating alert log ${alertLog.id}:`, updateError);
          }
        }
      }
    }

    console.log(`[check-inventory-alerts] Inventory check completed. Alerts sent: ${alertsSent.length}`);
    return res.status(200).json({ 
      success: true, 
      alertsSent,
      message: `Successfully checked inventory. ${alertsSent.length} alert emails sent.` 
    });
  } catch (error) {
    console.error('[check-inventory-alerts] Unhandled error:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
} 