# 🚂 Railway Production Deployment Guide
## Email Notification System Ready

This guide covers deploying the Bean Route application with the new **Email Notification System** to Railway production.

## ✅ What's New in This Version

- **📧 Order Status Email Notifications**: Automatically send emails when order statuses change
- **🎛️ Admin Email Management**: Admin interface to configure email notifications per shop
- **🧪 Email Testing**: Built-in email configuration testing
- **📊 Database Schema Updates**: New `OrderEmailNotification` table

---

## 🚀 Pre-Deployment Checklist

### 1. **Railway Environment Variables**

You **MUST** set these environment variables in your Railway project:

#### **📧 Email Configuration (REQUIRED)**
```bash
EMAIL_USER=your-gmail-address@gmail.com
EMAIL_PASSWORD=your-app-password-here  # Gmail App Password
EMAIL_FROM="Bean Route System <your-gmail-address@gmail.com>"
```

#### **📊 Database Configuration (Should already exist)**
```bash
DATABASE_URL=your-railway-postgres-url
DIRECT_DATABASE_URL=your-railway-postgres-url
```

#### **🔐 Authentication Configuration (Should already exist)**
```bash
JWT_SECRET=your-jwt-secret-here
NEXTAUTH_SECRET=your-nextauth-secret-here
NEXTAUTH_URL=https://your-app-domain.railway.app
```

### 2. **Gmail App Password Setup**

1. **Enable 2-Step Verification** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings
   - Security → 2-Step Verification
   - App passwords → Generate
   - Use this as your `EMAIL_PASSWORD`

---

## 🛠️ Deployment Steps

### **Step 1: Set Environment Variables in Railway**

1. **Log in to Railway Dashboard**: [railway.app](https://railway.app)
2. **Select your project**: "Bean Route"
3. **Go to your service** (usually "beanroute")
4. **Click "Variables" tab**
5. **Add the following variables**:

```
EMAIL_USER = laszlo.dorgai@gmail.com
EMAIL_PASSWORD = ispa jcfz ibxp ybur
EMAIL_FROM = "Bean Route System <laszlo.dorgai@gmail.com>"
```

### **Step 2: Apply Database Migration**

The new email notification system requires database schema updates:

#### **Option A: Using Railway Dashboard (Recommended)**

1. **Go to your Railway project**
2. **Select the PostgreSQL database service**
3. **Click "Data" tab → "SQL Editor"**
4. **Copy and paste the entire contents** of `railway-migration.sql`
5. **Click "Run"** to execute

#### **Option B: Using Railway CLI**

```bash
# Make sure you're logged in and linked
railway login
railway link

# Apply the database migration
cat railway-migration.sql | railway run "psql \$DATABASE_URL"
```

### **Step 3: Deploy the Application**

#### **Using the Deploy Script (Recommended)**

```bash
# Make sure you're in the project root
cd /path/to/beanroute

# Run the deployment script
./deploy-railway.sh
```

#### **Or manually:**

```bash
# Install Railway CLI if needed
npm install -g @railway/cli

# Login and link to project
railway login
railway link

# Deploy
railway up
```

---

## ✅ Post-Deployment Verification

### **1. Check Application Health**

Visit your Railway app URL and verify:
- ✅ Application loads successfully
- ✅ Can login with admin credentials
- ✅ Admin menu shows "Order Email Notifications"

### **2. Test Email System**

1. **Login as admin**:
   - Username: `admin`
   - Password: `adminisztrator`

2. **Go to**: `https://your-app.railway.app/admin/order-email-notifications`

3. **Click "Test Email"** button

4. **Check your Gmail inbox** for test email

### **3. Create First Notification Rule**

1. **Click "Add Notification"**
2. **Configure**:
   - **Shop**: Select your shop
   - **Order Status**: Choose status (e.g., "DISPATCHED")
   - **Email Addresses**: Add notification recipients
3. **Click "Create Notification"**

---

## 🎯 Email Notification Features

### **Available Order Statuses for Notifications:**
- `PENDING` - New orders placed
- `CONFIRMED` - Orders confirmed by admin
- `ROASTED` - Coffee roasted and ready
- `DISPATCHED` - Orders shipped/dispatched
- `DELIVERED` - Orders delivered to customer
- `CANCELLED` - Orders cancelled

### **How It Works:**
1. **Order status changes** (via admin interface or API)
2. **System checks** for configured email notifications
3. **Emails sent automatically** to configured addresses
4. **Non-blocking**: Email failures don't affect order processing

---

## 🐛 Troubleshooting

### **Email Not Sending**

1. **Check Railway Variables**:
   ```bash
   railway variables
   ```

2. **Verify Gmail App Password**:
   - Make sure 2-Step Verification is enabled
   - Use the exact App Password from Google

3. **Check Application Logs**:
   ```bash
   railway logs
   ```

### **Database Migration Issues**

1. **Check if migration applied**:
   ```sql
   SELECT * FROM "_prisma_migrations" WHERE migration_name LIKE '%email%';
   ```

2. **Check if table exists**:
   ```sql
   SELECT * FROM information_schema.tables WHERE table_name = 'OrderEmailNotification';
   ```

### **Admin Access Issues**

1. **Reset admin password** (if needed):
   ```bash
   # In Railway shell
   railway shell
   node reset-admin.js
   ```

---

## 📊 Monitoring

### **Check Email Activity**
- Monitor Railway logs for email sending activity
- Look for log entries like: `[OrderEmailService] Email sent to X recipients`

### **Database Monitoring**
- Monitor `OrderEmailNotification` table for configuration changes
- Check `RetailOrder` status changes trigger emails properly

---

## 🔄 Rollback Plan

If issues arise, you can quickly rollback:

1. **Disable email notifications**:
   ```sql
   UPDATE "OrderEmailNotification" SET "isEnabled" = false;
   ```

2. **Or remove environment variables** temporarily:
   - Remove `EMAIL_USER`, `EMAIL_PASSWORD`, `EMAIL_FROM` from Railway

3. **Redeploy previous version** if necessary

---

## ✅ Success Criteria

After deployment, you should have:
- ✅ **Working email notification system**
- ✅ **Admin interface for email management**
- ✅ **Automatic emails on order status changes**
- ✅ **Test email functionality working**
- ✅ **All existing functionality preserved**

---

**🚀 You're ready for production!** Your customers will now receive email notifications when their order statuses change, and you can manage these notifications through the admin interface.





