# Install the app dependencies in a full Node docker image
FROM registry.access.redhat.com/ubi9/nodejs-20:latest

# Create a non-root user and group named 'node'
USER root
RUN groupadd -r node && useradd -r -g node -s /bin/bash -m node

# Set the working directory
WORKDIR /opt/app-root/src

# Copy package.json, and optionally package-lock.json if it exists
COPY package.json package-lock.json* ./

# Adjust permissions for the package files
RUN chown -R node:node /opt/app-root/src

# Switch to the node user
USER node

# Clear npm cache
RUN npm cache clean --force

# Install app dependencies
RUN npm ci --no-strict-ssl --no-shrinkwrap --verbose || npm install --prefer-online --verbose

# Switch back to root user to copy the application code
USER root

# Copy the application code
COPY . ./

# Adjust permissions for the application code
RUN chown -R node:node /opt/app-root/src

# Switch back to the node user
USER node

# Build the Next.js application
RUN npm run build

# Start the application
CMD ["npm", "start"]