FROM node:22-alpine

WORKDIR /app

# Create a non-root user and group
RUN addgroup -g 10001 -S appgroup && adduser -u 10001 -S appuser -G appgroup

# Set proper ownership for the application directory
RUN chown -R appuser:appgroup /app

# Copy package.json and package-lock.json with correct ownership
COPY --chown=appuser:appgroup package*.json ./

# Switch to the non-root user
USER appuser

# Install dependencies
RUN npm install

# Copy application files explicitly to avoid copying sensitive data
COPY --chown=appuser:appgroup next.config.js jsconfig.json ./
COPY --chown=appuser:appgroup app ./app
COPY --chown=appuser:appgroup components ./components
COPY --chown=appuser:appgroup lib ./lib

# Build the Next.js application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
