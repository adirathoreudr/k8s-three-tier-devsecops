# ── Stage 1: Dependency installation ──────────────────────────────────────────
FROM node:18-alpine AS deps

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# ── Stage 2: Production image ──────────────────────────────────────────────────
FROM node:18-alpine AS production

# Security: create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser  -u 1001 -S appuser -G nodejs

WORKDIR /app

# Copy only production node_modules from deps stage
COPY --from=deps --chown=appuser:nodejs /app/node_modules ./node_modules

# Copy application source
COPY --chown=appuser:nodejs ./src ./src
COPY --chown=appuser:nodejs package*.json ./

# Security: drop to non-root user
USER appuser

# Expose API port
EXPOSE 3500

# Health check for Docker/Kubernetes
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3500/health', r => process.exit(r.statusCode===200?0:1))"

# Start the API server
CMD ["node", "src/index.js"]
