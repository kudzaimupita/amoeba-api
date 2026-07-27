FROM node:18-alpine AS base

WORKDIR /usr/src/app

# Install git and other dependencies
RUN apk add --no-cache git

# Copy package files
COPY package*.json ./
COPY tsconfig.json ecosystem.config.json ./

# Install all dependencies (including dev dependencies for TypeScript compilation)
RUN npm ci

# Copy source code
COPY ./src ./src

# Compile TypeScript
RUN npm run compile

# Production stage
FROM node:18-alpine AS production

WORKDIR /usr/src/app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Copy package files and install only production dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copy compiled application from base stage
COPY --from=base /usr/src/app/dist ./dist
COPY --from=base /usr/src/app/src/public ./dist/public
COPY --from=base /usr/src/app/ecosystem.config.json ./

# Create logs directory
RUN mkdir -p logs && chown -R nodejs:nodejs logs

# Change ownership to nodejs user
RUN chown -R nodejs:nodejs /usr/src/app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })" || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/index.js"]
