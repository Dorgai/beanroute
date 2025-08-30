#!/bin/bash

# BeanRoute PWA Localhost Setup Script
# Simplified version to avoid hanging commands

echo "🚀 Starting BeanRoute PWA setup for localhost..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

echo "✅ Found package.json - we're in the right directory"

# Step 1: Install dependencies (with timeout)
echo ""
echo "📦 Step 1: Installing web-push dependency..."
timeout 60 npm install web-push@3.6.7
if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
elif [ $? -eq 124 ]; then
    echo "⚠️  Installation timed out after 60 seconds"
    echo "💡 You can manually run: npm install web-push@3.6.7"
else
    echo "❌ Failed to install dependencies"
    echo "💡 You can manually run: npm install web-push@3.6.7"
fi

# Step 2: Generate VAPID keys (with timeout)
echo ""
echo "🔑 Step 2: Generating VAPID keys..."
if [ -f "generate-vapid-keys.js" ]; then
    timeout 30 node generate-vapid-keys.js > vapid-keys-output.txt 2>&1
    if [ $? -eq 0 ]; then
        echo "✅ VAPID keys generated successfully"
        echo ""
        echo "📋 Your VAPID keys (save these to your .env file):"
        echo "================================================"
        cat vapid-keys-output.txt
        echo "================================================"
        echo ""
        
        # Extract keys for .env file
        VAPID_PUBLIC=$(grep "VAPID_PUBLIC_KEY=" vapid-keys-output.txt | head -1)
        VAPID_PRIVATE=$(grep "VAPID_PRIVATE_KEY=" vapid-keys-output.txt | head -1)
        VAPID_SUBJECT=$(grep "VAPID_SUBJECT=" vapid-keys-output.txt | head -1)
        
        # Create or update .env file
        echo "📝 Adding VAPID keys to .env file..."
        
        # Remove existing VAPID keys from .env if they exist
        if [ -f ".env" ]; then
            sed -i.bak '/^VAPID_/d' .env
        fi
        
        # Add new VAPID keys
        echo "" >> .env
        echo "# Push Notification Configuration" >> .env
        echo "$VAPID_PUBLIC" >> .env
        echo "$VAPID_PRIVATE" >> .env
        echo "$VAPID_SUBJECT" >> .env
        
        echo "✅ VAPID keys added to .env file"
        
        # Clean up
        rm vapid-keys-output.txt
    elif [ $? -eq 124 ]; then
        echo "⚠️  VAPID key generation timed out after 30 seconds"
        echo "💡 You can manually run: node generate-vapid-keys.js"
    else
        echo "❌ Failed to generate VAPID keys"
        echo "Error output:"
        cat vapid-keys-output.txt
        rm vapid-keys-output.txt
    fi
else
    echo "❌ generate-vapid-keys.js not found"
fi

# Step 3: Generate Prisma client (with timeout)
echo ""
echo "🗄️  Step 3: Generating Prisma client..."
timeout 60 npx prisma generate
if [ $? -eq 0 ]; then
    echo "✅ Prisma client generated successfully"
elif [ $? -eq 124 ]; then
    echo "⚠️  Prisma generation timed out after 60 seconds"
    echo "💡 You can manually run: npx prisma generate"
else
    echo "❌ Failed to generate Prisma client"
fi

# Step 4: Run database migration (with timeout)
echo ""
echo "🗄️  Step 4: Running database migration..."
echo "💡 This step may take a while. Press Ctrl+C to skip if it hangs."
timeout 120 npx prisma migrate dev --name add_push_notifications --skip-seed
if [ $? -eq 0 ]; then
    echo "✅ Database migration completed successfully"
elif [ $? -eq 124 ]; then
    echo "⚠️  Database migration timed out after 120 seconds"
    echo "💡 You can manually run: npx prisma migrate dev --name add_push_notifications --skip-seed"
else
    echo "❌ Failed to run database migration"
    echo "💡 You may need to run 'npx prisma migrate reset' first if there are conflicts"
fi

echo ""
echo "🎉 PWA setup completed!"
echo ""
echo "📋 What was set up:"
echo "  ✅ Web-push dependency (if successful)"
echo "  ✅ VAPID keys generated and added to .env (if successful)"
echo "  ✅ Database migrated with push notification tables (if successful)"
echo "  ✅ Prisma client generated (if successful)"
echo ""
echo "🚀 To start the development server:"
echo "  npm run dev"
echo ""
echo "🧪 To test PWA features:"
echo "  1. Open http://localhost:3000 in Chrome"
echo "  2. Look for notification badge in header"
echo "  3. Grant notification permission when prompted"
echo "  4. Go to /settings/notifications to test"
echo ""
echo "💡 If any steps failed, you can run them manually:"
echo "  npm install web-push@3.6.7"
echo "  node generate-vapid-keys.js"
echo "  npx prisma generate"
echo "  npx prisma migrate dev --name add_push_notifications --skip-seed"
echo ""

# Don't auto-start dev server to avoid hanging
echo "🚀 To start development server manually: npm run dev"
