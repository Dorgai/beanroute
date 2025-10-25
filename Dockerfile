# FORCE RAILWAY REBUILD - 500g Bag Support Deployment
# LAST UPDATE: 2025-01-28 20:00 - 500g bag support deployment
# UNIQUE ID: medium-bags-$(date +%s) - Force Railway rebuild
# FORCE RESTART: 500g bag support database schema migration
FROM node:18-alpine

# Force rebuild by adding unique identifier
LABEL build_id="$(date +%s)"
LABEL version="final-medium-bags-removal-v9"
LABEL force_restart="true"
LABEL db_schema="fixed"
LABEL deployment="confirmed"
LABEL rebuild="aggressive"
LABEL prisma="updated"

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
