# Docker Setup Troubleshooting Guide

Common issues and solutions for the K-Fin Docker setup.

## 🚨 Common Issues

### 1. Port Conflicts

**Problem**: Port already in use errors
```
Error: Port 3000 is already in use
Error: Port 5432 is already in use
```

**Solutions**:

```bash
# Check what's using the port
lsof -i :3000
netstat -tulpn | grep :3000

# Kill the process using the port
sudo kill -9 <PID>

# Or use different ports in docker-compose.yml
services:
  app:
    ports:
      - "3001:3000"  # Host:Container
  database:
    ports:
      - "5433:5432"  # Host:Container
```

### 2. Permission Issues

**Problem**: Permission denied errors
```
Permission denied: './docker-scripts/dev.sh'
EACCES: permission denied, mkdir '/app/.next'
```

**Solutions**:

```bash
# Make scripts executable
chmod +x ./docker-scripts/*.sh
chmod +x ./plans/docker-setup/scripts/*.sh

# Fix ownership issues (Linux/macOS)
sudo chown -R $(whoami):$(whoami) .

# For Windows WSL2
wsl --shutdown
wsl --user root
chown -R 1000:1000 /path/to/k-fin
exit
wsl
```

### 3. Docker Not Running

**Problem**: Docker daemon not accessible
```
Cannot connect to the Docker daemon
```

**Solutions**:

```bash
# Start Docker Desktop (GUI)
# Or start Docker service (Linux)
sudo systemctl start docker
sudo systemctl enable docker

# Check Docker status
docker info
docker version

# Restart Docker if needed
# macOS: Restart Docker Desktop
# Linux: sudo systemctl restart docker
```

### 4. Out of Memory Issues

**Problem**: Build fails due to memory constraints
```
JavaScript heap out of memory
Docker build killed
```

**Solutions**:

```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Increase Docker memory allocation
# Docker Desktop: Settings > Resources > Memory > 8GB+

# Use swap if available
# Build with smaller concurrency
docker build --memory=4g --memory-swap=8g .
```

### 5. Network Issues

**Problem**: Cannot connect to services
```
Connection refused
Host not found
```

**Solutions**:

```bash
# Check Docker networks
docker network ls
docker network inspect k-fin-network

# Recreate network
docker-compose down
docker network prune
docker-compose up -d

# Use service names, not localhost
# Inside containers: http://app:3000, not http://localhost:3000
# From host: http://localhost:3000
```

## 🐛 Debugging Commands

### Container Debugging

```bash
# Check container status
docker-compose ps
docker ps -a

# Check container logs
docker-compose logs app
docker-compose logs database
docker-compose logs --follow --tail=100 app

# Get shell access
docker-compose exec app sh
docker-compose exec database bash

# Check container resources
docker stats
docker-compose top

# Inspect container configuration
docker inspect k-fin-app-dev
```

### Service Health Checks

```bash
# Test application
curl -v http://localhost:3000
curl -v http://localhost:3000/api/health

# Test database
docker-compose exec database pg_isready -U postgres
docker-compose exec app npx prisma db pull

# Test Redis (if enabled)
docker-compose exec redis redis-cli ping

# Check environment variables
docker-compose exec app env | grep -E "(DATABASE|AUTH|EMAIL)"
```

### Network Debugging

```bash
# Check network connectivity
docker-compose exec app ping database
docker-compose exec app nslookup database
docker-compose exec app telnet database 5432

# Check exposed ports
docker-compose port app 3000
docker-compose port database 5432

# Check iptables (Linux)
sudo iptables -L DOCKER
```

## 🔧 Build Issues

### Dependency Problems

**Problem**: npm install failures
```
npm ERR! network timeout
npm ERR! peer dep missing
```

**Solutions**:

```bash
# Clear npm cache
docker-compose exec app npm cache clean --force
docker-compose down
docker-compose build --no-cache

# Use different npm registry
docker-compose exec app npm config set registry https://registry.npmjs.org/

# Install dependencies manually
docker-compose exec app npm ci --verbose
```

### Prisma Issues

**Problem**: Prisma client not generated
```
PrismaClient is unable to be run in the browser
```

**Solutions**:

```bash
# Generate Prisma client
docker-compose exec app sh -c "cd packages/database && npx prisma generate"

# Check Prisma schema
docker-compose exec app sh -c "cd packages/database && npx prisma validate"

# Reset database
docker-compose exec app sh -c "cd packages/database && npx prisma migrate reset"

# Check database connection
docker-compose exec app sh -c "cd packages/database && npx prisma db pull"
```

### Next.js Build Issues

**Problem**: Next.js build failures
```
Module not found
Type errors
```

**Solutions**:

```bash
# Clear Next.js cache
docker-compose exec app rm -rf apps/web/.next
docker-compose restart app

# Check TypeScript
docker-compose exec app npm run type-check

# Build manually
docker-compose exec app sh -c "cd apps/web && npm run build"

# Check environment variables
docker-compose exec app sh -c "cd apps/web && npm run build 2>&1 | grep -i env"
```

## 📊 Performance Issues

### Slow Build Times

**Problem**: Docker builds take too long
```
Build time > 10 minutes
```

**Solutions**:

```bash
# Use BuildKit
export DOCKER_BUILDKIT=1
docker build .

# Enable caching
docker build --cache-from k-fin:latest .

# Use multi-stage builds efficiently
# Check .dockerignore is comprehensive

# Use faster base images
# node:20-alpine instead of node:20

# Parallel builds
docker-compose build --parallel
```

### Slow Container Startup

**Problem**: Containers take long to start
```
Container startup > 2 minutes
```

**Solutions**:

```bash
# Check resource allocation
docker stats

# Reduce startup operations
# Move heavy operations to build time

# Use healthchecks properly
# Don't wait unnecessarily

# Check disk I/O
docker system df
docker system prune
```

### Hot Reload Issues

**Problem**: Code changes not reflected
```
Files not updating in container
```

**Solutions**:

```bash
# Check volume mounts
docker-compose config | grep volumes

# Enable polling (especially on Windows)
# CHOKIDAR_USEPOLLING=true in .env

# Check file permissions
ls -la apps/web/

# Restart with clean volumes
docker-compose down -v
docker-compose up -d
```

## 🔍 Database Issues

### Connection Problems

**Problem**: Cannot connect to database
```
Connection timeout
Authentication failed
```

**Solutions**:

```bash
# Check database container
docker-compose logs database

# Check connection string
echo $DATABASE_URL

# Test connection manually
docker-compose exec database psql -U postgres -d k_fin_dev

# Reset database container
docker-compose down database
docker volume rm k-fin_k-fin-postgres-data
docker-compose up database -d
```

### Migration Issues

**Problem**: Prisma migrations fail
```
Migration failed
Database schema out of sync
```

**Solutions**:

```bash
# Check migration status
docker-compose exec app sh -c "cd packages/database && npx prisma migrate status"

# Reset migrations
docker-compose exec app sh -c "cd packages/database && npx prisma migrate reset"

# Deploy migrations
docker-compose exec app sh -c "cd packages/database && npx prisma migrate deploy"

# Generate new migration
docker-compose exec app sh -c "cd packages/database && npx prisma migrate dev --name fix_schema"
```

## 🛡️ Security Issues

### SSL/TLS Problems

**Problem**: HTTPS/SSL certificate issues
```
SSL certificate error
TLS handshake failed
```

**Solutions**:

```bash
# For development, disable SSL verification
export NODE_TLS_REJECT_UNAUTHORIZED=0

# Generate self-signed certificates
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem

# Update nginx configuration
# Point to correct certificate paths
```

### Environment Variable Leaks

**Problem**: Sensitive data in logs
```
API keys visible in logs
Database URLs exposed
```

**Solutions**:

```bash
# Check for leaked secrets
docker-compose logs | grep -i "api\|key\|secret\|password"

# Use Docker secrets (production)
# Mask sensitive environment variables

# Review .env files
# Never commit .env files to git
echo ".env*" >> .gitignore
```

## 🧹 Cleanup Commands

### Container Cleanup

```bash
# Stop and remove all containers
docker-compose down -v

# Remove unused containers
docker container prune

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune

# Remove unused networks
docker network prune

# Complete system cleanup
docker system prune -a --volumes
```

### Cache Cleanup

```bash
# Clear build cache
docker builder prune

# Clear npm cache
docker-compose exec app npm cache clean --force

# Clear Next.js cache
docker-compose exec app rm -rf apps/web/.next

# Clear Turbo cache
docker-compose exec app rm -rf .turbo
```

## 📋 Health Check Scripts

### Automated Diagnostics

```bash
#!/bin/bash
# diagnose.sh - Automated Docker health check

echo "🔍 K-Fin Docker Diagnostics"
echo "=========================="

# Check Docker
echo "Checking Docker..."
if docker info > /dev/null 2>&1; then
  echo "✅ Docker is running"
else
  echo "❌ Docker is not running"
  exit 1
fi

# Check containers
echo "Checking containers..."
if docker-compose ps | grep -q "Up"; then
  echo "✅ Containers are running"
else
  echo "❌ Containers are not running"
  echo "Starting containers..."
  docker-compose up -d
fi

# Check application
echo "Checking application..."
if curl -f http://localhost:3000 > /dev/null 2>&1; then
  echo "✅ Application is responding"
else
  echo "❌ Application is not responding"
  echo "Checking logs..."
  docker-compose logs --tail=20 app
fi

# Check database
echo "Checking database..."
if docker-compose exec -T database pg_isready -U postgres > /dev/null 2>&1; then
  echo "✅ Database is ready"
else
  echo "❌ Database is not ready"
  echo "Checking database logs..."
  docker-compose logs --tail=20 database
fi

echo "Diagnostics complete"
```

## 🆘 Getting Additional Help

### Log Collection

```bash
# Collect all logs for support
mkdir -p debug-logs
docker-compose logs > debug-logs/docker-compose.log
docker system info > debug-logs/docker-info.txt
docker version > debug-logs/docker-version.txt
docker-compose config > debug-logs/compose-config.yml

# Create support bundle
tar -czf k-fin-debug-$(date +%Y%m%d-%H%M%S).tar.gz debug-logs/
```

### System Information

```bash
# Collect system information
echo "=== System Information ===" > system-info.txt
uname -a >> system-info.txt
docker version >> system-info.txt
docker-compose version >> system-info.txt
df -h >> system-info.txt
free -h >> system-info.txt
```

### Common Support Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Next.js Docker Guide](https://nextjs.org/docs/deployment#docker-image)
- [Node.js Docker Best Practices](https://github.com/nodejs/docker-node/blob/main/docs/BestPractices.md)

### When to Seek Help

1. **Check this troubleshooting guide first**
2. **Search existing issues on GitHub**
3. **Check Docker and Next.js documentation**
4. **Collect logs and system information**
5. **Create a minimal reproduction case**
6. **Open an issue with detailed information**

Remember: Most Docker issues are environment-specific. The key is systematic debugging and understanding the containerized environment.