#!/bin/bash

echo "🚂 Railway Connection & Inventory Fix Deployment"
echo "================================================"

# Project and service information
PROJECT_ID="f430b9a3-0a83-479e-8539-ffa7cf126dec"
SERVICE_ID="1e4c4d28-a582-4574-bb30-7b8a2b47770a"
ENVIRONMENT_ID="b4e80eea-cabe-4ce6-bb0a-6c1a2af0738e"

echo "📋 Project Information:"
echo "- Project: beanroute ($PROJECT_ID)"
echo "- Service: beanroute ($SERVICE_ID)"
echo "- Environment: production ($ENVIRONMENT_ID)"
echo ""

# Check if Railway CLI is available
if ! command -v railway &> /dev/null; then
    echo "❌ Error: Railway CLI not found. Please install it first:"
    echo "   npm install -g @railway/cli"
    exit 1
fi

# Check if logged in
echo "🔍 Checking Railway authentication..."
if railway whoami > /dev/null 2>&1; then
    echo "✅ Logged in as: $(railway whoami)"
else
    echo "❌ Not logged in to Railway. Please run: railway login"
    exit 1
fi

echo ""
echo "🔧 Manual Connection Steps (since interactive linking isn't working):"
echo "======================================================================"
echo ""
echo "1. 📁 Create Railway configuration file:"
echo "   Create a file called '.railway' with this content:"
echo "   {\"projectId\":\"$PROJECT_ID\",\"serviceId\":\"$SERVICE_ID\",\"environmentId\":\"$ENVIRONMENT_ID\"}"
echo ""

# Create the Railway configuration file
echo "📝 Creating Railway configuration file..."
cat > .railway << EOF
{"projectId":"$PROJECT_ID","serviceId":"$SERVICE_ID","environmentId":"$ENVIRONMENT_ID"}
EOF

echo "✅ Railway configuration file created"
echo ""

echo "2. 🧪 Test connection by checking variables:"
echo "   railway variables"
echo ""

echo "3. 📊 Check current deployment status:"
echo "   railway status"
echo ""

echo "4. 📝 View logs:"
echo "   railway logs"
echo ""

echo "5. 🚀 Deploy the inventory fix:"
echo "   railway up"
echo ""

echo "🎯 What the inventory fix does:"
echo "==============================="
echo "- Fixes progress bar calculation in ShopStockSummary component"
echo "- Handles both old (smallBags) and new (smallBagsEspresso + smallBagsFilter) data formats"
echo "- Adds enhanced debugging for production troubleshooting"
echo ""

echo "📋 After deployment, test the fix:"
echo "=================================="
echo "1. Go to your Railway app URL"
echo "2. Navigate to Orders page"
echo "3. Select a shop"
echo "4. Check if inventory progress bars show correct data"
echo "5. Open browser console to see debug logs"
echo ""

echo "🔗 Useful Railway Commands:"
echo "=========================="
echo "- railway variables                    # Show environment variables"
echo "- railway logs                         # View application logs"
echo "- railway status                       # Check deployment status"
echo "- railway up                           # Deploy current code"
echo "- railway connect                      # Connect to database"
echo "- railway run 'npm run build'         # Run commands in Railway environment"
echo ""

echo "🎉 Ready to deploy! Run the commands above to connect and deploy the fix."
