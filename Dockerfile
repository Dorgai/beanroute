FROM node:18-alpine

WORKDIR /app

# Install dependencies needed for PostgreSQL client
RUN apk add --no-cache postgresql-client

# Copy package files and Prisma schema
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

# Copy application code
COPY . .

# Make scripts executable
RUN chmod +x docker-entrypoint.sh deploy-db.sh

# Generate Prisma client
RUN npx prisma generate

# Build the application
RUN npm run build

# Expose port
EXPOSE 3000

# Start the application
CMD ["./docker-entrypoint.sh"] 