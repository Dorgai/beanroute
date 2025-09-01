# FORCE RAILWAY REBUILD - Database migration fixes deployed
# LAST UPDATE: 2025-01-28 16:00 - Added database migration step
# UNIQUE ID: $(date +%s) - Force Railway rebuild
# FORCE RESTART: Adding database migration step
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
