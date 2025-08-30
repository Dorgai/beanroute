#!/bin/bash

# Simple migration runner for Railway production
# This script will run both migrations to fix the issues

PRODUCTION_URL="https://beanroute-production-3421.up.railway.app"

echo "🚀 Starting Railway Production Migrations..."
echo ""

# Run shop schema migration first
echo "🔄 Running Shop Schema Migration..."
SHOP_RESPONSE=$(curl -s -X POST "${PRODUCTION_URL}/api/public/fix-shop-schema")

if [[ $? -eq 0 ]]; then
    echo "✅ Shop Schema Migration completed successfully"
    echo "Response: $SHOP_RESPONSE"
else
    echo "❌ Shop Schema Migration failed"
    exit 1
fi

echo ""

# Run push subscription migration
echo "🔄 Running Push Subscription Migration..."
PUSH_RESPONSE=$(curl -s -X POST "${PRODUCTION_URL}/api/public/fix-push-subscriptions")

if [[ $? -eq 0 ]]; then
    echo "✅ Push Subscription Migration completed successfully"
    echo "Response: $PUSH_RESPONSE"
else
    echo "❌ Push Subscription Migration failed"
    exit 1
fi

echo ""
echo "🎉 All migrations completed successfully!"
echo "✅ Shop selector should now work"
echo "✅ Push notifications should now work"
echo ""
echo "🔗 Test your app at: $PRODUCTION_URL"
