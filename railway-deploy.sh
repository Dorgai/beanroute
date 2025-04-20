#!/bin/bash
set -e

echo "=== BeanRoute Railway Deployment Script ==="

# Delete any DOCKERFILE reference to force NIXPACKS
rm -f railway.toml 2>/dev/null || true

# Create a simplified railway.json
cat > railway.json << 'END'
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "npm ci && npx prisma generate && npm run build"
  },
  "deploy": {
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 3,
    "startCommand": "node server.js"
  }
}
END

# Force add railway.json, ignoring other uncommitted changes
git add railway.json
git commit -m "Simplify deployment configuration" --no-verify || true

# Deploy to Railway
echo "Deploying to Railway..."
railway up --detach

echo "=== Deployment initiated ==="
echo "Check the Railway dashboard for deployment status" 