# Docker Setup Implementation Guide

Step-by-step guide to implement Docker for the K-Fin project, optimized for Vercel deployments.

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] Docker Desktop installed and running
- [ ] Docker Compose available (v2.0+)
- [ ] Node.js 20+ (for local development)
- [ ] Git (for version control)
- [ ] Vercel CLI (optional: `npm install -g vercel`)

### System Requirements

- **Operating System**: macOS, Linux, or Windows with WSL2
- **Docker**: Version 24.0+
- **Available RAM**: 8GB+ recommended
- **Available Storage**: 10GB+ free space

## 🚀 Implementation Steps

### Step 1: Copy Docker Files to Project Root

```bash
# Navigate to your project root
cd /path/to/k-fin

# Copy Dockerfile templates
cp plans/docker-setup/dockerfile-templates/Dockerfile ./
cp plans/docker-setup/dockerfile-templates/Dockerfile.dev ./

# Copy docker-compose files
cp plans/docker-setup/docker-compose/docker-compose.yml ./
cp plans/docker-setup/docker-compose/docker-compose.prod.yml ./
cp plans/docker-setup/docker-compose/docker-compose.ci.yml ./

# Copy helper scripts (optional)
cp -r plans/docker-setup/scripts ./docker-scripts
chmod +x ./docker-scripts/*.sh
```

### Step 2: Create .dockerignore File

```bash
# Create .dockerignore in project root
cat > .dockerignore << 'EOF'
# Development files
*.md
*.log
.git
.gitignore
.env*
!.env.example

# Dependencies (will be installed in container)
node_modules
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE and editor files
.vscode
.idea
*.swp
*.swo
*.sublime-*

# OS generated files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db

# Build outputs
.next
dist
coverage
out
.turbo

# Testing
cypress
tests/cypress/videos
tests/cypress/screenshots
coverage/

# Docker files (avoid recursion)
Dockerfile*
docker-compose*
.docker/
docker-scripts/

# Vercel
.vercel

# Database files
*.db
*.sqlite
k-fin-dev*.db

# Temporary files
tmp/
temp/
*.tmp
*.temp

# Log files
logs/
*.log

# Cache directories
.npm
.yarn
.cache
.turbo

# Documentation (not needed in container)
docs/
README*.md
CHANGELOG.md
LICENSE*

# Plans and documentation
plans/
EOF
```

### Step 3: Environment Configuration

```bash
# Create development environment file
cat > .env.docker << 'EOF'
# Docker Development Environment
NODE_ENV=development

# Database (Docker PostgreSQL)
DATABASE_URL=postgresql://postgres:postgres@database:5432/k_fin_dev
DIRECT_URL=postgresql://postgres:postgres@database:5432/k_fin_dev

# Authentication
BETTER_AUTH_SECRET=dev-secret-key-change-in-production
BETTER_AUTH_URL=http://localhost:3000

# Email (add your Resend API key)
RESEND_API_KEY=your_resend_api_key_here
EMAIL_FROM=K-Fin <dev@localhost>

# Google OAuth (optional - add your credentials)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Docker-specific settings
CHOKIDAR_USEPOLLING=true
NEXT_TELEMETRY_DISABLED=1
EOF

echo "⚠️  Update .env.docker with your actual API keys and secrets"
```

### Step 4: Update Package.json Scripts

Add Docker-related scripts to your root `package.json`:

```json
{
  "scripts": {
    "docker:dev": "./docker-scripts/dev.sh start",
    "docker:build": "./docker-scripts/build.sh",
    "docker:stop": "./docker-scripts/dev.sh stop",
    "docker:logs": "./docker-scripts/dev.sh logs",
    "docker:shell": "./docker-scripts/dev.sh shell",
    "docker:clean": "./docker-scripts/dev.sh cleanup",
    "docker:prod": "docker-compose -f docker-compose.prod.yml up",
    "docker:prod:build": "./docker-scripts/build.sh && docker-compose -f docker-compose.prod.yml up"
  }
}
```

### Step 5: Test Development Environment

```bash
# Start the development environment
npm run docker:dev

# Wait for services to start (30-60 seconds)
# Check service status
docker-compose ps

# View logs
npm run docker:logs

# Test the application
curl http://localhost:3000
```

### Step 6: Database Setup

```bash
# Setup database (run after containers are running)
./docker-scripts/dev.sh setup-db

# Or manually:
docker-compose exec app sh -c "cd packages/database && npx prisma migrate dev --name init"
docker-compose exec app npm run db:seed
```

### Step 7: Production Build Testing

```bash
# Build production image
npm run docker:build

# Test production build locally
npm run docker:prod

# Test the production application
curl http://localhost:3000
```

## 🔧 Advanced Configuration

### Custom Environment Variables

Create environment-specific files:

```bash
# Production environment
cat > .env.production << 'EOF'
NODE_ENV=production
DATABASE_URL=your_production_database_url
BETTER_AUTH_SECRET=your_production_secret
BETTER_AUTH_URL=https://your-domain.com
RESEND_API_KEY=your_production_resend_key
EMAIL_FROM=K-Fin <noreply@your-domain.com>
EOF

# Staging environment
cat > .env.staging << 'EOF'
NODE_ENV=production
DATABASE_URL=your_staging_database_url
BETTER_AUTH_SECRET=your_staging_secret
BETTER_AUTH_URL=https://staging.your-domain.com
RESEND_API_KEY=your_staging_resend_key
EMAIL_FROM=K-Fin <staging@your-domain.com>
EOF
```

### Custom Docker Compose Override

```yaml
# docker-compose.override.yml (for local customizations)
version: '3.8'

services:
  app:
    environment:
      - DEBUG=true
    volumes:
      # Mount additional directories if needed
      - ./custom-config:/app/config
    ports:
      # Expose additional ports if needed
      - "9229:9229"  # Node.js debugger

  database:
    ports:
      # Change database port if conflicts occur
      - "5433:5432"
    environment:
      # Use different database name
      - POSTGRES_DB=k_fin_custom
```

### Nginx Configuration (Optional)

```bash
# Copy nginx configs if using nginx profile
mkdir -p nginx/conf.d
cp plans/docker-setup/scripts/nginx.dev.conf nginx/conf.d/default.conf
cp plans/docker-setup/scripts/nginx.prod.conf nginx/conf.d/production.conf

# Start with nginx proxy
docker-compose --profile proxy up -d
```

## 🔍 Verification Steps

### 1. Service Health Checks

```bash
# Check all services are running
docker-compose ps

# Check application health
curl http://localhost:3000/api/health

# Check database connection
docker-compose exec database pg_isready -U postgres

# Check Redis (if enabled)
docker-compose exec redis redis-cli ping
```

### 2. Application Testing

```bash
# Test API endpoints
curl http://localhost:3000/api/auth/session
curl http://localhost:3000/api/data/warehouse

# Test static files
curl http://localhost:3000/_next/static/chunks/main.js

# Test database operations
docker-compose exec app npm run test:api
```

### 3. Performance Verification

```bash
# Check resource usage
docker stats

# Check build time
time ./docker-scripts/build.sh

# Check image size
docker images k-fin:latest
```

## 📊 Monitoring Setup

### Development Monitoring

```bash
# Add monitoring services to docker-compose.yml
cat >> docker-compose.yml << 'EOF'

  # Optional monitoring services
  portainer:
    image: portainer/portainer-ce:latest
    ports:
      - "9000:9000"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - portainer_data:/data
    profiles:
      - monitoring

volumes:
  portainer_data:
EOF
```

### Log Management

```bash
# Configure log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker daemon
sudo systemctl restart docker
```

## 🚨 Troubleshooting

### Common Issues and Solutions

#### Port Conflicts

```bash
# Check what's using port 3000
lsof -i :3000

# Use different ports
export APP_PORT=3001
docker-compose up -d
```

#### Permission Issues

```bash
# Fix file permissions (macOS/Linux)
sudo chown -R $(whoami):$(whoami) .

# For Windows/WSL2
wsl --shutdown
wsl
```

#### Database Connection Issues

```bash
# Reset database
docker-compose down -v
docker-compose up database -d
sleep 10
./docker-scripts/dev.sh setup-db
```

#### Build Issues

```bash
# Clear Docker cache
docker system prune -a

# Clear npm cache
docker-compose exec app npm cache clean --force

# Rebuild from scratch
docker-compose down -v
docker-compose build --no-cache
```

### Debug Commands

```bash
# Get shell access to app container
docker-compose exec app sh

# Check environment variables
docker-compose exec app env

# View detailed logs
docker-compose logs --follow --tail=100 app

# Check network connectivity
docker-compose exec app ping database
docker-compose exec app nslookup database
```

## 🔄 CI/CD Integration

### GitHub Actions Setup

```yaml
# .github/workflows/docker.yml
name: Docker Build and Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  docker-build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Set up Docker Buildx
      uses: docker/setup-buildx-action@v3
    
    - name: Build Docker image
      run: |
        cp plans/docker-setup/dockerfile-templates/Dockerfile ./
        docker build -t k-fin:test .
    
    - name: Test Docker image
      run: |
        docker run --rm -d --name k-fin-test -p 3000:3000 k-fin:test
        sleep 30
        curl -f http://localhost:3000 || exit 1
        docker stop k-fin-test
```

### Vercel Integration

```bash
# Update vercel.json for Docker-optimized builds
cat > vercel.json << 'EOF'
{
  "version": 2,
  "buildCommand": "npm ci && cd packages/database && npx prisma generate && cd ../../apps/web && npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm ci",
  "cacheDirectories": [
    "node_modules",
    ".next/cache",
    "apps/web/.next/cache"
  ]
}
EOF
```

## ✅ Final Verification Checklist

- [ ] All Docker containers start successfully
- [ ] Application accessible at http://localhost:3000
- [ ] Database connection working
- [ ] API endpoints responding
- [ ] Hot reload working in development
- [ ] Production build completes successfully
- [ ] Environment variables properly configured
- [ ] Health checks passing
- [ ] Logs are readable and helpful
- [ ] Performance is acceptable

## 📖 Next Steps

1. **Team Setup**: Share this guide with your team
2. **CI/CD**: Implement automated builds and testing
3. **Production Deployment**: Set up production Docker registry
4. **Monitoring**: Add application monitoring and logging
5. **Security**: Implement security scanning and updates
6. **Documentation**: Update team documentation with Docker workflows

## 🆘 Getting Help

If you encounter issues:

1. Check the [troubleshooting guide](./troubleshooting.md)
2. Review Docker and compose logs
3. Verify all prerequisites are met
4. Check the [Docker documentation](https://docs.docker.com/)
5. Review [Next.js Docker documentation](https://nextjs.org/docs/deployment#docker-image)

Remember: Docker setup is iterative. Start simple and add complexity as needed.