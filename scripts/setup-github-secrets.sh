#!/bin/bash

# Setup GitHub Secrets Script
# Prerequisites: 
# 1. Install GitHub CLI: https://cli.github.com/
# 2. Authenticate: gh auth login
# 3. Set environment variables or update values below

set -e

echo "🔐 Setting up GitHub repository secrets..."

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI is not installed. Please install it first:"
    echo "   https://cli.github.com/"
    exit 1
fi

# Check if user is authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub. Please run: gh auth login"
    exit 1
fi

# Repository (auto-detect or set manually)
REPO=$(gh repo view --json nameWithOwner -q .nameWithOwner)
echo "📁 Repository: $REPO"

# Function to set secret
set_secret() {
    local name=$1
    local value=$2
    local description=$3
    
    if [ -z "$value" ]; then
        echo "⚠️  Skipping $name (empty value)"
        return
    fi
    
    echo "🔑 Setting secret: $name"
    echo "$value" | gh secret set "$name" --body -
    echo "✅ $name set successfully"
}

# =============================================================================
# ENVIRONMENT VARIABLES
# Set these in your environment or update the values below
# =============================================================================

# Testing & Coverage
export CODECOV_TOKEN=${CODECOV_TOKEN:-""}  # Get from https://codecov.io/
export CYPRESS_RECORD_KEY=${CYPRESS_RECORD_KEY:-""}  # Get from Cypress Dashboard

# Deployment (Vercel)
export VERCEL_TOKEN=${VERCEL_TOKEN:-""}  # Personal Access Token from Vercel
export VERCEL_ORG_ID=${VERCEL_ORG_ID:-""}  # Team/User ID from Vercel
export VERCEL_PROJECT_ID=${VERCEL_PROJECT_ID:-""}  # Project ID from Vercel

# Notifications
export SLACK_WEBHOOK_URL=${SLACK_WEBHOOK_URL:-""}  # Slack webhook for notifications

# Database & Services (for staging/production)
export DATABASE_URL=${DATABASE_URL:-""}  # Production database URL
export NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL:-""}
export NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY:-""}
export SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY:-""}

# OAuth & Integrations
export GOOGLE_CLIENT_ID=${GOOGLE_CLIENT_ID:-""}
export GOOGLE_CLIENT_SECRET=${GOOGLE_CLIENT_SECRET:-""}
export PLAID_CLIENT_ID=${PLAID_CLIENT_ID:-""}
export PLAID_SECRET=${PLAID_SECRET:-""}

# =============================================================================
# SET SECRETS
# =============================================================================

echo ""
echo "🚀 Setting up secrets for $REPO..."
echo ""

# Testing & Coverage Secrets
set_secret "CODECOV_TOKEN" "$CODECOV_TOKEN" "Codecov token for coverage reports"
set_secret "CYPRESS_RECORD_KEY" "$CYPRESS_RECORD_KEY" "Cypress Dashboard recording key"

# Deployment Secrets
set_secret "VERCEL_TOKEN" "$VERCEL_TOKEN" "Vercel deployment token"
set_secret "VERCEL_ORG_ID" "$VERCEL_ORG_ID" "Vercel organization ID"
set_secret "VERCEL_PROJECT_ID" "$VERCEL_PROJECT_ID" "Vercel project ID"

# Notification Secrets
set_secret "SLACK_WEBHOOK_URL" "$SLACK_WEBHOOK_URL" "Slack webhook for CI notifications"

# Database & Service Secrets
set_secret "DATABASE_URL" "$DATABASE_URL" "Production database connection string"
set_secret "NEXT_PUBLIC_SUPABASE_URL" "$NEXT_PUBLIC_SUPABASE_URL" "Supabase project URL"
set_secret "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$NEXT_PUBLIC_SUPABASE_ANON_KEY" "Supabase anon key"
set_secret "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "Supabase service role key"

# OAuth & Integration Secrets
set_secret "GOOGLE_CLIENT_ID" "$GOOGLE_CLIENT_ID" "Google OAuth client ID"
set_secret "GOOGLE_CLIENT_SECRET" "$GOOGLE_CLIENT_SECRET" "Google OAuth client secret"
set_secret "PLAID_CLIENT_ID" "$PLAID_CLIENT_ID" "Plaid client ID"
set_secret "PLAID_SECRET" "$PLAID_SECRET" "Plaid secret key"

echo ""
echo "✅ All secrets have been set up!"
echo ""
echo "📋 Next steps:"
echo "   1. Verify secrets in GitHub: gh secret list"
echo "   2. Update any missing values and re-run this script"
echo "   3. Test your CI/CD pipeline with a test commit"
echo ""
echo "🔍 To view secret names (not values): gh secret list"
echo "" 