#!/bin/bash

echo "🚀 Deploying Inventory Progress Bar Fix to Railway"
echo "=================================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Error: Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

echo "📋 What this deployment includes:"
echo "- Fixed inventory progress bar calculation"
echo "- Support for both old (smallBags) and new (smallBagsEspresso + smallBagsFilter) data formats"
echo "- Enhanced debugging for production troubleshooting"
echo ""

# Show the current git status
echo "📊 Current Git Status:"
git status --porcelain

echo ""
echo "🔧 Files modified:"
echo "- src/components/retail/ShopStockSummary.js (inventory calculation fix)"

echo ""
read -p "🤔 Do you want to proceed with the deployment? (y/N): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""
echo "🚀 Starting deployment process..."

# Commit the changes
echo "📝 Committing changes..."
git add src/components/retail/ShopStockSummary.js
git commit -m "Fix inventory progress bar calculation

- Handle both old (smallBags) and new (smallBagsEspresso + smallBagsFilter) data formats
- Add enhanced debugging for production troubleshooting
- Fixes incorrect progress bar data in Railway production"

if [ $? -ne 0 ]; then
    echo "⚠️  No changes to commit or commit failed. Continuing with deployment..."
fi

# Push to git (Railway will auto-deploy)
echo "📤 Pushing to repository..."
git push origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Successfully pushed to repository!"
    echo "🚂 Railway should automatically start deploying the changes."
    echo ""
    echo "📊 Monitor deployment:"
    echo "   - Check Railway dashboard: https://railway.app"
    echo "   - View logs: railway logs"
    echo ""
    echo "🧪 After deployment, test the fix:"
    echo "   1. Go to your production app"
    echo "   2. Navigate to the Orders page"
    echo "   3. Select a shop"
    echo "   4. Check if the inventory progress bars show correct data"
    echo "   5. Check browser console for debug logs"
    echo ""
    echo "🎯 Expected result:"
    echo "   - Progress bars should now show correct percentages"
    echo "   - Console logs should show proper inventory data structure"
else
    echo "❌ Failed to push to repository. Please check your git configuration."
    exit 1
fi

echo ""
echo "🎉 Deployment initiated successfully!"
