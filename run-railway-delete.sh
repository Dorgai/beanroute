#!/bin/bash
set -e

echo "===== Running data deletion in Railway production environment ====="

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Ensure we have the latest Railway CLI
npm install -g @railway/cli

# Log in to Railway if not already logged in
echo "Checking Railway login status..."
if ! railway whoami &>/dev/null; then
  echo "Please log in to Railway"
  railway login
fi

# Connect to the Railway project
echo "Connecting to Railway project..."
railway link

# Run the deletion script in the Railway environment
echo "Running deletion script..."
railway run node delete-data.js

echo "===== Railway data deletion operation completed =====" 