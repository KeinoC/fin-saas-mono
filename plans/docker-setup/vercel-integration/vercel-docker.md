# Vercel + Docker Integration for K-Fin

This guide explains how to leverage Docker for improved Vercel deployments, ensuring consistent builds and better performance.

## 🎯 Goals

- **Consistent Builds**: Same environment locally and on Vercel
- **Faster Deployments**: Better dependency caching and optimization
- **Easier Debugging**: Reproduce Vercel issues locally
- **Build Optimization**: Reduced build times and better layer caching

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Vercel Deployment Flow                      │
├─────────────────────────────────────────────────────────────────┤
│  Local Development          │  Vercel Build Environment        │
│  ┌─────────────────────┐     │  ┌─────────────────────────┐      │
│  │ Docker Development  │────→│  │ Node.js 20 Runtime     │      │
│  │ - Same Node version │     │  │ - npm ci                │      │
│  │ - Same dependencies │     │  │ - Prisma generate       │      │
│  │ - Same build process│     │  │ - Turbo build           │      │
│  └─────────────────────┘     │  └─────────────────────────┘      │
│                              │                                   │
│  ┌─────────────────────┐     │  ┌─────────────────────────┐      │
│  │ Production Testing  │────→│  │ Edge Functions          │      │
│  │ - Docker prod build │     │  │ - Serverless Functions  │      │
│  │ - Same optimizations│     │  │ - Static Generation     │      │
│  └─────────────────────┘     │  └─────────────────────────┘      │
└─────────────────────────────────────────────────────────────────┘
```

## 🚀 Implementation Strategies

### Strategy 1: Docker-Optimized Build (Recommended)

Use Docker to optimize the build process while deploying normally to Vercel.

#### Benefits:
- ✅ Consistent dependency resolution
- ✅ Better build caching
- ✅ Easier local reproduction of issues
- ✅ No Vercel configuration changes needed

#### Setup:

1. **Update build script** in `package.json`:
```json
{
  "scripts": {
    "build": "docker run --rm -v $(pwd):/app -w /app node:20-alpine sh -c 'npm ci && cd packages/database && npx prisma generate && cd ../../apps/web && npm run build'",
    "build:local": "cd packages/database && npx prisma generate && cd ../../apps/web && next build",
    "build:docker": "./plans/docker-setup/scripts/build.sh"
  }
}
```

2. **Create `.vercelignore`**:
```
node_modules
.git
*.log
.next
dist
coverage
plans/docker-setup
Dockerfile*
docker-compose*
```

3. **Update Vercel build settings**:
```json
{
  "buildCommand": "npm run build:local",
  "devCommand": "npm run dev",
  "installCommand": "npm ci"
}
```

### Strategy 2: Containerized Vercel (Advanced)

Deploy the entire application as a container to Vercel (requires Pro plan).

#### Benefits:
- ✅ Complete environment control
- ✅ Complex dependency management
- ✅ Custom runtime configurations
- ❌ Requires Vercel Pro plan
- ❌ More complex setup

#### Setup:

1. **Create `vercel.json`**:
```json
{
  "functions": {
    "app/server.js": {
      "runtime": "@vercel/node@3.0.0"
    }
  },
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/app/server.js"
    }
  ]
}
```

2. **Create server entry point** (`app/server.js`):
```javascript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev, dir: './apps/web' });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  }).listen(process.env.PORT || 3000);
});
```

## 📦 Build Optimization Techniques

### 1. Multi-Stage Dockerfile for Vercel

```dockerfile
# Vercel-optimized Dockerfile
FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/*/package.json ./packages/
RUN npm ci --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN cd packages/database && npx prisma generate
RUN npx turbo run build --filter=web

# For Vercel deployment, we only need the built files
FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/public ./apps/web/public
COPY --from=builder /app/packages ./packages
COPY package.json ./
EXPOSE 3000
CMD ["npm", "start"]
```

### 2. Dependency Optimization

**Cache Dependencies Effectively:**

```bash
# In your build process
npm ci --prefer-offline --no-audit --no-fund
```

**Minimize Bundle Size:**

```javascript
// next.config.js optimizations
const nextConfig = {
  experimental: {
    optimizePackageImports: ['lucide-react', '@headlessui/react'],
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.optimization.splitChunks.chunks = 'all';
    }
    return config;
  },
};
```

### 3. Build Caching Strategy

**Docker Layer Caching:**

```dockerfile
# Optimize layer caching by copying package files first
COPY package*.json ./
COPY turbo.json ./
RUN npm ci

# Then copy source code (changes more frequently)
COPY . .
RUN npx turbo run build
```

**Vercel Build Cache:**

```json
{
  "cacheDirectories": [
    "node_modules",
    ".next/cache",
    "apps/web/.next/cache",
    "packages/*/node_modules"
  ]
}
```

## 🔧 Local Development Integration

### Development Workflow

1. **Start development environment**:
```bash
./plans/docker-setup/scripts/dev.sh start
```

2. **Test production build locally**:
```bash
./plans/docker-setup/scripts/build.sh
./plans/docker-setup/scripts/dev.sh production
```

3. **Deploy to Vercel**:
```bash
./plans/docker-setup/scripts/deploy.sh vercel
```

### Debugging Vercel Issues Locally

```bash
# Reproduce Vercel environment
docker run --rm -it \
  -v $(pwd):/app \
  -w /app \
  -e NODE_ENV=production \
  -e DATABASE_URL="your-prod-db-url" \
  node:20-alpine \
  sh -c "npm ci && npm run build && npm start"
```

## 📈 Performance Monitoring

### Build Time Tracking

```bash
# Add to your build script
echo "Build started at $(date)"
time npm run build
echo "Build completed at $(date)"
```

### Bundle Analysis

```bash
# Analyze bundle size
npm install -g @next/bundle-analyzer
ANALYZE=true npm run build
```

### Vercel Analytics Integration

```javascript
// apps/web/lib/analytics.js
import { Analytics } from '@vercel/analytics/react';

export function VercelAnalytics() {
  return <Analytics />;
}
```

## 🛡️ Security Considerations

### Environment Variables

```bash
# Required for production
BETTER_AUTH_SECRET=your-secret
DATABASE_URL=your-db-url
RESEND_API_KEY=your-key
EMAIL_FROM=your-email

# Vercel-specific
VERCEL_URL=$VERCEL_URL
NEXT_PUBLIC_VERCEL_URL=$VERCEL_URL
```

### Build Security

```dockerfile
# Use specific Node version
FROM node:20.10.0-alpine

# Don't run as root
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
USER nextjs

# Scan for vulnerabilities
RUN npm audit --audit-level moderate
```

## 🚨 Troubleshooting

### Common Issues

**Build Timeout:**
```json
{
  "functions": {
    "apps/web/api/**/*.js": {
      "maxDuration": 30
    }
  }
}
```

**Memory Issues:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

**Prisma Issues:**
```bash
# Ensure Prisma client is generated
cd packages/database && npx prisma generate
```

### Debug Commands

```bash
# Check build locally
./plans/docker-setup/scripts/deploy.sh check

# Test production build
docker run --rm -p 3000:3000 k-fin:latest

# Analyze bundle
npm run build -- --analyze
```

## 📊 Performance Benchmarks

### Target Metrics

- **Build Time**: < 3 minutes
- **Cold Start**: < 2 seconds
- **Bundle Size**: < 1MB (gzipped)
- **Core Web Vitals**: All green

### Monitoring Setup

```javascript
// apps/web/lib/performance.js
export function reportWebVitals(metric) {
  console.log(metric);
  // Send to analytics service
}
```

## 🔄 CI/CD Integration

### GitHub Actions with Docker

```yaml
name: Build and Deploy
on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Build with Docker
        run: ./plans/docker-setup/scripts/build.sh
      
      - name: Deploy to Vercel
        run: ./plans/docker-setup/scripts/deploy.sh vercel --production
        env:
          VERCEL_TOKEN: ${{ secrets.VERCEL_TOKEN }}
```

This integration provides a robust, scalable deployment strategy that leverages the best of both Docker and Vercel platforms.