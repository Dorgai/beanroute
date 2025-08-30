# BeanRoute Dockerfile - Force Railway Rebuild
FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache postgresql-client bash

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy prisma directory
COPY prisma ./prisma/

# Generate Prisma client
RUN npx prisma generate

# Copy the rest of the application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Start Next.js directly - NO CUSTOM SERVER
CMD ["npm", "start"]
