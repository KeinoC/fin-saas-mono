#!/bin/bash

# Development User Setup Script
# Creates a development user for quick login in Docker environment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}👤 K-Fin Development User Setup${NC}"
echo -e "${BLUE}===============================${NC}"

# Development user credentials
DEV_EMAIL="keino.chichester@gmail.com"
DEV_PASSWORD="dev123456"
DEV_NAME="Keino Chichester"

# Check if database is running
echo -e "${YELLOW}🔍 Checking database connection...${NC}"
if ! docker exec k-fin-database-dev pg_isready -U postgres > /dev/null 2>&1; then
    echo -e "${RED}❌ Database is not running. Please start the Docker environment first.${NC}"
    echo "Run: docker-compose up -d database"
    exit 1
fi
echo -e "${GREEN}✅ Database is running${NC}"

# Create tables if they don't exist
echo -e "${YELLOW}🗄️  Creating database tables...${NC}"
docker exec k-fin-database-dev psql -U postgres -d k_fin_dev -c "
CREATE TABLE IF NOT EXISTS \"user\" (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT,
    \"emailVerified\" BOOLEAN DEFAULT FALSE,
    image TEXT,
    \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS \"account\" (
    id TEXT PRIMARY KEY,
    \"userId\" TEXT NOT NULL,
    \"accountId\" TEXT NOT NULL,
    \"providerId\" TEXT NOT NULL,
    password TEXT,
    \"createdAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    \"updatedAt\" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (\"userId\") REFERENCES \"user\"(id)
);
" > /dev/null 2>&1

echo -e "${GREEN}✅ Database tables ready${NC}"

# Check if user already exists
echo -e "${YELLOW}👤 Checking if development user exists...${NC}"
USER_EXISTS=$(docker exec k-fin-database-dev psql -U postgres -d k_fin_dev -t -c "SELECT COUNT(*) FROM \"user\" WHERE email = '${DEV_EMAIL}';" | tr -d ' ')

if [ "$USER_EXISTS" = "1" ]; then
    echo -e "${GREEN}✅ Development user already exists${NC}"
else
    echo -e "${YELLOW}👤 Creating development user...${NC}"
    
    # Create the development user
    docker exec k-fin-database-dev psql -U postgres -d k_fin_dev -c "
    INSERT INTO \"user\" (id, email, name, \"emailVerified\", \"createdAt\", \"updatedAt\")
    VALUES (
        'dev-user-keino-001',
        '${DEV_EMAIL}',
        '${DEV_NAME}',
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );

    INSERT INTO \"account\" (id, \"userId\", \"accountId\", \"providerId\", password, \"createdAt\", \"updatedAt\")
    VALUES (
        'dev-account-keino-001',
        'dev-user-keino-001',
        'dev-user-keino-001',
        'credential',
        '\$2a\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMaWka27zlxClGhvHpgHDvn9/O',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    );
    " > /dev/null 2>&1
    
    echo -e "${GREEN}✅ Development user created successfully!${NC}"
fi

echo ""
echo -e "${BLUE}🎉 Development User Ready!${NC}"
echo -e "${BLUE}=========================${NC}"
echo -e "📧 Email:    ${GREEN}${DEV_EMAIL}${NC}"
echo -e "🔑 Password: ${GREEN}${DEV_PASSWORD}${NC}"
echo -e "👤 Name:     ${GREEN}${DEV_NAME}${NC}"
echo ""
echo -e "${BLUE}🌐 Login URLs:${NC}"
echo -e "• Development: ${GREEN}http://localhost:3000/auth/login${NC}"
echo ""
echo -e "${YELLOW}⚠️  Note: This user is for development only!${NC}"
echo -e "${YELLOW}   Do not use this in production environments.${NC}"