FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm install

# Generate Prisma Client
RUN npx prisma generate

# Copy the script
COPY update-production-password.js ./

# Run the script
CMD ["npm", "start"] 