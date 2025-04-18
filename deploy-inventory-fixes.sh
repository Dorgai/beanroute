#!/bin/bash

echo "=== Deploying Inventory Alert System Fixes ==="

# Make sure middleware.js changes are included in build
echo "1. Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

# Set the environment variables in Railway
echo "2. Setting up environment variables in Railway..."
# Using individual commands for each variable as per Railway CLI docs
railway variables INVENTORY_CHECK_API_KEY=random_inventory_key
railway variables SMTP_USER=noreply@example.com
railway variables SMTP_PASSWORD=dummy_password

# Deploy to Railway
echo "3. Deploying to Railway..."
railway up

echo "=== Deployment complete ===" 