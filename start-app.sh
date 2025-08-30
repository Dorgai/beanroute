#!/bin/sh
set -e

echo "=== Starting BeanRoute Application ==="

# Start the application
echo "Starting Next.js server..."
exec next start -p ${PORT:-3000} 