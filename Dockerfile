# BeanRoute Dockerfile - Simple and Clean
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Generate Prisma client
RUN npx prisma generate

# Build Next.js
RUN npm run build

# Expose port
EXPOSE 3000

# Start Next.js
CMD ["npm", "start"]
