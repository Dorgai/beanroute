#!/bin/bash

# Script to deploy to Railway with custom parameters
echo "===== Deploying to Railway with Cookie Fix ====="

# Set environment variables for deployment
echo "Setting up environment variables..."
railway vars set COOKIE_SECURE=false
railway vars set COOKIE_SAMESITE=lax
railway vars set NEXT_PUBLIC_DEBUGGING=true

# Deploy with production environment
echo "Deploying to Railway..."
railway up

echo "===== Deployment Complete ====="
echo "Your application has been deployed with relaxed cookie settings."
echo "This should fix the login redirection issues."
echo ""
echo "Visit your application at: https://bean-route-production.up.railway.app"
echo ""
echo "If you still experience issues, try accessing the application in a private/incognito window." 