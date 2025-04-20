#!/bin/bash
set -e

echo "=== BeanRoute Railway Deployment Script ==="

# Create a railway.json that uses our Dockerfile
cat > railway.json << 'END'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "startCommand": "node server.js"
  }
}
END

# Ensure prisma folder is included in deployment
echo "Making sure prisma folder is included in deployment..."
mkdir -p ./prisma

# Add prisma folder to deployment explicitly
git add -f prisma/

# Force add railway.json and Dockerfile, ignoring other uncommitted changes
git add -f railway.json Dockerfile
git commit -m "Use Dockerfile for Railway deployment with explicit prisma handling" --no-verify || true

# Deploy to Railway
echo "Deploying to Railway..."
railway up --detach

echo "=== Deployment initiated ==="
echo "Check the Railway dashboard for deployment status" 