#!/bin/bash
set -e

echo "===== Running data deletion in Railway production environment ====="

# Make sure we're in the right directory
cd "$(dirname "$0")"

# Log in to Railway if not already logged in
echo "Checking Railway login status..."
if ! npx railway whoami &>/dev/null; then
  echo "Please log in to Railway"
  npx railway login
fi

# Print Railway project information for debugging
echo "Listing available Railway projects and environments..."
npx railway status

# Connect to the Railway project
echo "Connecting to Railway project..."
npx railway connect

# Verify the database connection
echo "Verifying database connection..."
npx railway run -s beanroute env | grep DATABASE

# Run the deletion script in the Railway environment
echo "Running deletion script..."
npx railway run -s beanroute node delete-data.js

echo "===== Railway data deletion operation completed =====" 