FROM node:22-alpine

# Install required system dependencies
RUN apk add --no-cache bash git python3 make g++ curl ca-certificates

# Set working directory
WORKDIR /app

# Copy package files for dependency installation
COPY package*.json ./

# Install Node.js dependencies
RUN npm ci

# Create necessary directories matching the actual project structure
RUN mkdir -p /app/contracts \
             /app/scripts \
             /app/test \
             /app/ignition \
             /app/compiled \
             /app/deployed \
             /app/cache

# Keep container running
CMD ["/bin/bash"]
