#!/bin/bash

# Ensure we're in the project root
cd "$(dirname "$0")/.."

# Check if .env exists
if [ ! -f .env ]; then
    echo "Error: .env file not found. Please create one from .env.example"
    exit 1
fi

# Run the script
node scripts/delete-orders.js 