#!/bin/sh
set -e

echo "=== BeanRoute Deployment Script ==="

# Step 1: Build the application
echo "Building application..."
npm run build

# Step 2: Set required environment variables
echo "Setting environment variables..."
railway variables --set INVENTORY_CHECK_API_KEY=random_inventory_key --set SMTP_USER=noreply@example.com --set SMTP_PASSWORD=dummy_password

# Step 3: Fix permissions for docker-entrypoint.sh
echo "Fixing permissions..."
chmod +x docker-entrypoint.sh

# Step 4: Deploy to Railway
echo "Deploying to Railway..."
railway up

echo "Deployment process completed." 