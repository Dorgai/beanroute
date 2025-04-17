FROM node:18-alpine

# Install PostgreSQL client for database migrations
RUN apk add --no-cache postgresql-client

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy Prisma schema
COPY prisma ./prisma/

# Copy all other files
COPY . .

# Make scripts executable
RUN chmod +x docker-entrypoint.sh

# Generate Prisma client
RUN npx prisma generate

# Build the Next.js app
RUN npm run build

# Set required environment variables
ENV PORT=3000
ENV NODE_ENV=production
ENV SEED_DATABASE=true

# Expose the app's port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "railway:start"] 