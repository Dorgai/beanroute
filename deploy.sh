#!/bin/bash

echo "=== BeanRoute Deployment Script ==="

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
  echo "Railway CLI not found. Please install it first:"
  echo "npm install -g @railway/cli"
  exit 1
fi

# Check if logged into Railway
railway whoami &> /dev/null
if [ $? -ne 0 ]; then
  echo "Not logged into Railway. Please run 'railway login' first."
  exit 1
fi

# Check if service is linked
railway service &> /dev/null
if [ $? -ne 0 ]; then
  echo "No Railway service linked. Please run 'railway service' first."
  exit 1
fi

# Build the app
echo "1. Building application..."
npm run build

# Check if build was successful
if [ $? -ne 0 ]; then
  echo "Build failed. Aborting deployment."
  exit 1
fi

# Set important environment variables
echo "2. Setting up environment variables in Railway..."
echo "Note: Some of these variables may already be set in your Railway project."
echo "If you want to skip variable setting, press Ctrl+C now and run 'railway up' manually."
echo "Continuing in 5 seconds..."
sleep 5

railway variables set \
  INVENTORY_CHECK_API_KEY=random_inventory_key \
  SMTP_USER=noreply@example.com \
  SMTP_PASSWORD=dummy_password \
  JWT_SECRET="beanroute-secure-production-fd73d7f0e3530f4fdf72e4c0513cee9b" \
  NODE_ENV="production" \
  SEED_DATABASE="false" \
  COOKIE_SECURE="true" \
  COOKIE_SAMESITE="strict" \
  BASE_URL="https://beanroute-production-3421.up.railway.app"

# Deploy to Railway
echo "3. Deploying to Railway..."
echo "This may take a few minutes. Please be patient..."
railway up

echo "=== Deployment complete ==="
echo "Visit your application at: https://beanroute-production-3421.up.railway.app"
echo ""
echo "If you encounter any issues:"
echo "1. Check the Railway dashboard for logs"
echo "2. Ensure your database migrations have been applied"
echo "3. Verify environment variables are correctly set" 