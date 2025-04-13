#!/bin/bash

# Script to apply migrations directly to Railway PostgreSQL database
# This is useful when you need to apply raw SQL instead of Prisma migrations

# Set script to exit immediately if a command exits with a non-zero status
set -e

echo "======================================="
echo "Direct SQL Migration to Railway Database"
echo "======================================="

# Ensure we're in the Railway environment
echo "Checking Railway connection..."
if ! railway version &> /dev/null; then
  echo "❌ Railway CLI not found or not logged in."
  echo "Please install Railway CLI with 'npm i -g @railway/cli'"
  echo "Then log in with 'railway login'"
  exit 1
fi

# Check if we're linked to a project
echo "Checking project link..."
if ! railway status &> /dev/null; then
  echo "❌ Not linked to a Railway project."
  echo "Please run 'railway link' first."
  exit 1
fi

# Get database URL from Railway
echo "Fetching database URL from Railway..."
DB_URL=$(railway variables get DATABASE_URL)

if [ -z "$DB_URL" ]; then
  echo "❌ Failed to get DATABASE_URL from Railway."
  echo "Make sure you're linked to the correct project and the database service exists."
  exit 1
fi

# Mask the URL for display
MASKED_URL=$(echo $DB_URL | sed 's/postgresql:\/\/[^:]*:[^@]*@/postgresql:\/\/user:password@/')
echo "Target database: $MASKED_URL"

# Apply the migration
echo "Applying migration..."
echo "Using deploy-shop-update.sql"

# Check if the migration file exists
if [ ! -f "deploy-shop-update.sql" ]; then
  echo "❌ Migration file 'deploy-shop-update.sql' not found!"
  exit 1
fi

# Apply the migration using a temporary script that fetches the DATABASE_URL
echo "Creating temporary connection script..."
cat > temp_apply_migration.sh << EOF
#!/bin/bash
DATABASE_URL="\$(railway variables get DATABASE_URL)"
export PGPASSWORD=\$(echo \$DATABASE_URL | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+).*/\2/')
PGUSER=\$(echo \$DATABASE_URL | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+).*/\1/')
PGHOST=\$(echo \$DATABASE_URL | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+).*/\3/')
PGDATABASE=\$(echo \$DATABASE_URL | sed -E 's/postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^?]+).*/\4/')

echo "Connecting to PostgreSQL as \$PGUSER on \$PGHOST..."
psql -h \$PGHOST -U \$PGUSER -d \$PGDATABASE -f deploy-shop-update.sql
EOF

chmod +x temp_apply_migration.sh

echo "Executing migration..."
./temp_apply_migration.sh

# Clean up
rm temp_apply_migration.sh

echo "✅ Migration successfully applied!"
echo "If you need to verify the changes, you can connect to the database using:"
echo "railway connect"

# Final instructions
echo ""
echo "Next steps:"
echo "1. Verify your database schema with 'railway connect'"
echo "2. Redeploy your application with 'railway up'" 