# FORCE RAILWAY REBUILD - Push notification database migration
# LAST UPDATE: 2025-01-28 18:30 - Force push notification DB migration
# UNIQUE ID: push-migration-20250102 - Force Railway rebuild
# FORCE RESTART: Push notification database schema migration
FROM node:18-alpine

# Force rebuild by adding unique identifier
LABEL build_id="$(date +%s)"
LABEL version="database-migration-fixes-v1"
LABEL force_restart="true"

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies for build)
RUN npm ci

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build the app
RUN npm run build

# Remove dev dependencies to reduce image size
RUN npm prune --production

# Expose port
EXPOSE 3000

# Start the app with database migration
CMD ["sh", "-c", "npx prisma migrate deploy && npm start"]
