FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache postgresql-client

# Copy package files first for better caching
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the application code
COPY . .

# Generate Prisma client
RUN npx prisma generate 

# Build the Next.js application
RUN npm run build

# Copy the fix-and-run script and make it executable
COPY fix-and-run.sh /app/fix-and-run.sh
RUN chmod +x /app/fix-and-run.sh

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run the application with database setup
CMD ["./fix-and-run.sh"] 