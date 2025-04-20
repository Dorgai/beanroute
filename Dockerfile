FROM node:18-alpine

WORKDIR /app

# Install build dependencies
RUN apk add --no-cache postgresql-client bash

# Create the fix-prisma-railway.sh script
RUN echo '#!/bin/bash\n\
set -e\n\
\n\
echo "=== Fixing Prisma Configuration for Railway ==="\n\
\n\
# Ensure prisma directory exists\n\
mkdir -p ./prisma\n\
\n\
# Check if schema.prisma exists in the prisma directory\n\
if [ ! -f ./prisma/schema.prisma ]; then\n\
  echo "ERROR: schema.prisma is missing in the prisma directory!"\n\
  \n\
  # Try to find it in other locations\n\
  if [ -f ./schema.prisma ]; then\n\
    echo "Found schema.prisma in root directory, copying to prisma/..."\n\
    cp -f ./schema.prisma ./prisma/schema.prisma\n\
  else\n\
    echo "Creating minimal schema.prisma file..."\n\
    # Create a minimal schema file that can be used for initial connection\n\
    cat > ./prisma/schema.prisma << END\n\
// This is a minimal Prisma schema file generated automatically\n\
// For more information about Prisma, see: https://pris.ly/d/getting-started\n\
\n\
generator client {\n\
  provider = "prisma-client-js"\n\
}\n\
\n\
datasource db {\n\
  provider = "postgresql"\n\
  url      = env("DATABASE_URL")\n\
}\n\
END\n\
  fi\n\
fi\n\
\n\
# Run prisma generate to create the client\n\
echo "Running prisma generate..."\n\
npx prisma generate\n\
\n\
echo "Prisma configuration fixed successfully."\n\
' > /app/fix-prisma-railway.sh && chmod +x /app/fix-prisma-railway.sh

# Copy package files first for better caching
COPY package.json package-lock.json ./

# Modify package.json to update postinstall script
RUN sed -i 's/"postinstall": "chmod +x .\/fix-prisma-railway.sh && .\/fix-prisma-railway.sh"/"postinstall": "prisma generate"/' package.json

# Copy prisma directory separately to ensure schema is available
COPY prisma ./prisma/

# Install dependencies
RUN npm ci

# Generate Prisma client with explicit schema path
RUN npx prisma generate --schema=./prisma/schema.prisma

# Copy the rest of the application code
COPY . .

# Create a fallback fix-and-run script if not present in the copied files
RUN if [ ! -f /app/fix-and-run.sh ]; then \
    echo '#!/bin/sh' > /app/fix-and-run.sh && \
    echo 'set -e' >> /app/fix-and-run.sh && \
    echo 'echo "Starting BeanRoute"' >> /app/fix-and-run.sh && \
    echo 'npx prisma generate' >> /app/fix-and-run.sh && \
    echo 'exec next start -p ${PORT:-3000}' >> /app/fix-and-run.sh; \
    fi
RUN chmod +x /app/fix-and-run.sh

# Build the Next.js application
RUN npm run build

# Expose the port the app runs on
EXPOSE 3000
ENV PORT=3000
ENV NODE_ENV=production

# Run the application with database setup
CMD ["./fix-and-run.sh"] 