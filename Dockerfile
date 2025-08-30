FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache postgresql-client bash

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy prisma directory separately to ensure schema is available
COPY prisma ./prisma/

# Generate Prisma client with explicit schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the application code
COPY . .

# Create the fix-and-run script
RUN echo '#!/bin/sh' > /app/fix-and-run.sh && \
    echo 'set -e' >> /app/fix-and-run.sh && \
    echo 'echo "Starting BeanRoute"' >> /app/fix-and-run.sh && \
    echo 'npx prisma generate' >> /app/fix-and-run.sh && \
    echo 'exec next start -p ${PORT:-3000}' >> /app/fix-and-run.sh
RUN chmod +x /app/fix-and-run.sh

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run the application with database setup
CMD ["./fix-and-run.sh"]
