# Production Multi-Stage Dockerfile for K-Fin
# Optimized for Vercel deployments and monorepo structure

# ================================
# Base Image
# ================================
FROM node:20-alpine AS base

# Install system dependencies required for native modules
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Set working directory
WORKDIR /app

# Enable corepack for modern package management
RUN corepack enable

# ================================
# Dependencies Stage
# ================================
FROM base AS deps

# Copy package files for dependency installation
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/services/package.json ./packages/services/
COPY packages/integrations/package.json ./packages/integrations/

# Install dependencies with npm ci for faster, reliable, reproducible builds
RUN npm ci --only=production && npm cache clean --force

# ================================
# Build Dependencies Stage
# ================================
FROM base AS build-deps

# Copy package files
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/database/package.json ./packages/database/
COPY packages/config/package.json ./packages/config/
COPY packages/ui/package.json ./packages/ui/
COPY packages/services/package.json ./packages/services/
COPY packages/integrations/package.json ./packages/integrations/

# Install all dependencies (including devDependencies for building)
RUN npm ci && npm cache clean --force

# ================================
# Build Stage
# ================================
FROM build-deps AS builder

# Copy source code
COPY . .

# Copy turbo configuration
COPY turbo.json ./

# Generate Prisma client first (required for build)
WORKDIR /app/packages/database
RUN npx prisma generate

# Return to app root for build
WORKDIR /app

# Build the application with Turbo
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Build all packages and the web app
RUN npx turbo run build --filter=web

# Remove development dependencies to reduce image size
RUN npm prune --production

# ================================
# Runtime Stage
# ================================
FROM node:20-alpine AS runner

# Install runtime dependencies only
RUN apk add --no-cache \
    libc6-compat \
    cairo \
    jpeg \
    pango \
    musl \
    giflib \
    pixman \
    pangomm \
    libjpeg-turbo \
    freetype

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy production dependencies
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next ./apps/web/.next
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/package.json ./apps/web/

# Copy built packages
COPY --from=builder --chown=nextjs:nodejs /app/packages ./packages

# Copy necessary configuration files
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./
COPY --from=builder --chown=nextjs:nodejs /app/turbo.json ./

# Set up Prisma
WORKDIR /app/packages/database
RUN npx prisma generate
WORKDIR /app

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start the application
WORKDIR /app/apps/web
CMD ["npm", "start"]

# ================================
# Build Arguments & Labels
# ================================
ARG BUILD_DATE
ARG VCS_REF
ARG VERSION

LABEL org.label-schema.build-date=$BUILD_DATE \
      org.label-schema.name="k-fin" \
      org.label-schema.description="K-Fin Financial Management Platform" \
      org.label-schema.url="https://k-fin.com" \
      org.label-schema.vcs-ref=$VCS_REF \
      org.label-schema.vcs-url="https://github.com/your-org/k-fin" \
      org.label-schema.vendor="K-Fin" \
      org.label-schema.version=$VERSION \
      org.label-schema.schema-version="1.0"