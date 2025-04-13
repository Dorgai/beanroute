FROM node:18-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl

# Set working directory
WORKDIR /app

# Copy package.json and prisma directory first
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install --production
RUN npx prisma generate

# Copy application files
COPY . .

# Build the application
RUN npm run build

# Expose the port
EXPOSE 8080

# Make entrypoint script executable
RUN chmod +x /app/docker-entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/app/docker-entrypoint.sh"] 