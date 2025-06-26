# Supabase Storage Setup (File-Based Approach)

This guide shows you how to set up Supabase storage using configuration files and migrations instead of the web console.

## 🎯 Benefits of File-Based Setup

✅ **Version Control** - All policies and settings are tracked in git  
✅ **Reproducible** - Same setup across development, staging, and production  
✅ **Team Collaboration** - Everyone gets the same storage configuration  
✅ **CI/CD Ready** - Can be automated in deployment pipelines  

## 📁 Files Created

```
├── supabase/
│   ├── config.toml                    # Supabase project configuration
│   └── migrations/
│       └── 002_storage_setup.sql     # Storage bucket and policies
├── scripts/
│   └── setup-supabase-storage.sh     # Automated setup script
└── docs/
    └── STORAGE_SETUP.md              # This guide
```

## 🚀 Quick Setup

### Option 1: Automated Script (Recommended)

```bash
# Run the setup script
npm run setup:storage
```

This will:
1. Check if Supabase CLI is installed
2. Link to your remote project
3. Apply the storage migration
4. Set up local development (optional)

### Option 2: Manual Steps

1. **Install Supabase CLI** (if not already installed):
   ```bash
   npm install -g supabase
   ```

2. **Link to your project**:
   ```bash
   supabase link --project-ref wvfsubcfybdgylqbnjzq
   ```

3. **Apply the migration**:
   ```bash
   supabase db push
   ```

## 📋 Environment Variables

Add these to your `apps/web/.env.local`:

```bash
# Supabase Configuration (for file storage)
NEXT_PUBLIC_SUPABASE_URL=https://wvfsubcfybdgylqbnjzq.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

**To find your anon key:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `wvfsubcfybdgylqbnjzq`
3. Go to **Settings** → **API**
4. Copy the **anon/public** key

## 🗂️ What Gets Created

### Storage Bucket: `uploads`
- **Public access** for easy file downloads
- **10MB file size limit**
- **Allowed types**: CSV, Excel files

### Storage Policies

1. **Upload Policy**: Authenticated users can upload files
2. **Download Policy**: Public access for downloads
3. **Delete Policy**: Authenticated users can delete files
4. **Update Policy**: Authenticated users can update metadata

### File Organization
```
uploads/
  └── data-imports/
      └── {orgId}/
          └── {importId}-{filename}
```

## 🧪 Testing

1. **Start your dev server**:
   ```bash
   npm run dev
   ```

2. **Navigate to uploads page**:
   ```
   http://localhost:3000/org/[your-org-id]/data/uploads
   ```

3. **Test upload** with this sample CSV:
   ```csv
   date,amount,description,category
   2024-01-01,150.00,Grocery Store,Food
   2024-01-02,-75.50,Gas Station,Transportation
   2024-01-03,2500.00,Salary Deposit,Income
   ```

4. **Verify**:
   - File uploads successfully
   - Green "Download" button appears
   - Download retrieves original file
   - Data preview shows parsed content

## 🔧 Local Development

For local Supabase development:

```bash
# Start local Supabase
supabase start

# Your local endpoints:
# - API: http://localhost:54321
# - Studio: http://localhost:54323
# - DB: postgresql://postgres:postgres@localhost:54322/postgres
```

Update your `.env.local` for local development:
```bash
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-local-anon-key
```

## 🛠️ Advanced Configuration

### Custom Policies

Edit `supabase/migrations/002_storage_setup.sql` to customize policies:

```sql
-- Example: Restrict access to org members only
CREATE POLICY "Users can only access their org files" ON storage.objects
FOR ALL TO authenticated
USING (
  bucket_id = 'uploads' 
  AND (storage.foldername(name))[1] = (
    SELECT org_id FROM org_users 
    WHERE user_id = auth.uid() 
    LIMIT 1
  )
);
```

### File Type Restrictions

Update `supabase/config.toml`:

```toml
[storage.buckets.uploads]
public = true
file_size_limit = "10MB"
allowed_mime_types = [
  "text/csv", 
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/json"  # Add JSON support
]
```

## 🐛 Troubleshooting

### Migration Fails
```bash
# Reset and retry
supabase db reset
supabase db push
```

### Permission Errors
- Check your project permissions in Supabase dashboard
- Ensure you're linked to the correct project

### Local Setup Issues
```bash
# Stop and restart local Supabase
supabase stop
supabase start
```

## 📚 Additional Commands

```bash
# Apply specific migration
supabase db push --dry-run  # Preview changes
supabase db push            # Apply changes

# Generate TypeScript types
npm run generate-types

# Reset local database
npm run db:reset
```

## 🎉 You're Done!

Your Supabase storage is now set up using file-based configuration. All settings are version controlled and can be easily deployed to different environments.

Next: Test the file upload feature and start building data visualization components! 