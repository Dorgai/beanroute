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

# Check if email environment variables are set in Railway
echo "🔍 Checking email configuration..."
railway run "echo 'EMAIL_USER: '\$EMAIL_USER; echo 'EMAIL_FROM: '\$EMAIL_FROM" 2>/dev/null | grep -q "EMAIL_USER:" && {
    echo "✅ Email environment variables are configured"
} || {
    echo "⚠️  WARNING: Email environment variables may not be set!"
    echo "📧 Don't forget to set EMAIL_USER, EMAIL_PASSWORD, and EMAIL_FROM in Railway dashboard"
    echo "📚 See RAILWAY_PRODUCTION_DEPLOYMENT.md for details"
}

echo ""
echo "🎯 Next Steps:"
echo "1. 📊 View deployment status: railway status"
echo "2. 📝 View logs: railway logs --service $SERVICE_NAME"
echo "3. 🗄️  Apply database migration (see RAILWAY_PRODUCTION_DEPLOYMENT.md)"
echo "4. 🧪 Test email system: https://your-app.railway.app/admin/order-email-notifications"
echo "5. 📧 Create your first email notification rule" 