#!/bin/bash

echo "=== BeanRoute Coffee Edit Fix Deployment ==="

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

# Deploy to Railway
echo "2. Deploying coffee edit fix to Railway..."
echo "This may take a few minutes. Please be patient..."
railway up

echo "=== Deployment complete ==="
echo "Visit your application at: https://beanroute-production-3421.up.railway.app"
echo ""
echo "To test the coffee edit functionality:"
echo "1. Log in as admin2 with password admin123"
echo "2. Navigate to the Coffee section"
echo "3. Try to edit any coffee item" 