#!/bin/bash

# Setup Supabase Storage for k-fin project
# This script applies the storage bucket and policies

set -e

echo "🚀 Setting up Supabase Storage for k-fin..."

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed. Installing..."
    npm install -g supabase
fi

# Check if we're in a Supabase project
if [ ! -f "supabase/config.toml" ]; then
    echo "❌ Not in a Supabase project directory"
    exit 1
fi

echo "📦 Applying storage migration..."

# Option 1: Apply migration to remote project
read -p "Do you want to apply to remote Supabase project? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔗 Linking to remote project..."
    supabase link --project-ref wvfsubcfybdgylqbnjzq
    
    echo "🔄 Pushing migration to remote..."
    supabase db push
    
    echo "✅ Storage setup complete on remote!"
fi

# Option 2: Set up local development
read -p "Do you want to set up local Supabase? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🏠 Starting local Supabase..."
    supabase start
    
    echo "📊 Local Supabase is running:"
    echo "  - API URL: http://localhost:54321"
    echo "  - Studio: http://localhost:54323"
    echo "  - Database: postgresql://postgres:postgres@localhost:54322/postgres"
    
    echo "✅ Local setup complete!"
fi

echo "🎉 Done! Next steps:"
echo "1. Add environment variables to apps/web/.env.local:"
echo "   NEXT_PUBLIC_SUPABASE_URL=https://wvfsubcfybdgylqbnjzq.supabase.co"
echo "   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
echo ""
echo "2. Test file upload at: http://localhost:3000/org/[orgId]/data/uploads" 