#!/bin/bash

# Railway Deployment Script
set -e

# Set project and service variables
PROJECT_NAME="Bean Route"
SERVICE_NAME="beanroute"

echo "🚂 Preparing for deployment to $PROJECT_NAME project, $SERVICE_NAME service..."

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI not found. Installing..."
    npm install -g @railway/cli
fi

# Check if logged in to Railway
railway whoami &> /dev/null || {
    echo "🔑 Please log in to Railway:"
    railway login
}

# Ensure we're linked to the right project
echo "🔍 Linking to Railway project: $PROJECT_NAME..."
railway link --project "$PROJECT_NAME"

# Make sure environment is clean
echo "🧹 Cleaning build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application locally to catch any build errors before deploying
echo "🏗️ Building application locally..."
npm run build

# Deploy to Railway, targeting the specific service
echo "🚀 Deploying to Railway service: $SERVICE_NAME..."
railway up --service "$SERVICE_NAME"

echo "✅ Deployment initiated successfully!"
echo "📊 View deployment status: railway status"
echo "📝 View logs: railway logs --service $SERVICE_NAME" 