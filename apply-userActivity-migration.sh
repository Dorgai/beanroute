#!/bin/bash

# Script to apply the UserActivity schema migration to Railway
echo "Applying UserActivity schema migration to Railway..."

# Run SQL commands directly through railway run
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"UserActivity\\\" ADD COLUMN IF NOT EXISTS resource TEXT DEFAULT 'USER';\""
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"UserActivity\\\" ADD COLUMN IF NOT EXISTS resourceId TEXT;\""
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"UserActivity\\\" ADD COLUMN IF NOT EXISTS ipAddress TEXT;\""
railway run "psql \$DATABASE_URL -c \"ALTER TABLE \\\"UserActivity\\\" ADD COLUMN IF NOT EXISTS userAgent TEXT;\""

# Create indexes if they don't exist
railway run "psql \$DATABASE_URL -c \"CREATE INDEX IF NOT EXISTS UserActivity_resource_idx ON \\\"UserActivity\\\"(resource);\""
railway run "psql \$DATABASE_URL -c \"CREATE INDEX IF NOT EXISTS UserActivity_resourceId_idx ON \\\"UserActivity\\\"(resourceId);\""

# Update existing records
railway run "psql \$DATABASE_URL -c \"UPDATE \\\"UserActivity\\\" SET resource = 'USER' WHERE resource IS NULL;\""

echo "Migration completed successfully!" 