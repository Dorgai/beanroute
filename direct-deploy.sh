#!/bin/bash

# Set environment to production
echo "=== Setting environment to production ==="
railway environment production
if [ $? -ne 0 ]; then
  echo "Failed to set environment to production"
  exit 1
fi

# Deploy with direct database reset and admin user creation
echo "=== Deploying to production ==="
railway up
if [ $? -ne 0 ]; then
  echo "Failed to deploy to production"
  exit 1
fi

echo "=== Deployment initiated ==="
echo "The application is being deployed with database reset"
echo "Default admin credentials:"
echo "  Username: admin"
echo "  Password: admin123"

echo "=== Deployment URL ==="
railway service -o 