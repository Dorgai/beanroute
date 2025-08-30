# FORCE RAILWAY REBUILD - Push notification fixes deployed
# LAST UPDATE: 2025-01-28 15:30 - FORCE RAILWAY TO USE NEW DEPLOYMENT
# UNIQUE ID: $(date +%s) - This should force Railway to rebuild
FROM node:18-alpine

# Force rebuild by adding unique identifier
LABEL build_id="$(date +%s)"
LABEL version="mobile-fixes-v2"

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

# Start the app
CMD ["npm", "start"]
