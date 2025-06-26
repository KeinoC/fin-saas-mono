#!/usr/bin/env node

/**
 * Setup script for Supabase Storage
 * Creates the data-uploads bucket and necessary policies
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env.local');

dotenv.config({ path: envPath });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

// Create admin client with service role key
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('🚀 Setting up Supabase Storage...');

  try {
    // Create the data-uploads bucket
    console.log('📦 Creating data-uploads bucket...');
    const { data: bucket, error: bucketError } = await supabase.storage.createBucket('data-uploads', {
      public: false,
      allowedMimeTypes: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
      fileSizeLimit: 10485760 // 10MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      throw bucketError;
    }

    if (bucketError?.message.includes('already exists')) {
      console.log('✅ data-uploads bucket already exists');
    } else {
      console.log('✅ data-uploads bucket created successfully');
    }

    // Create storage policies
    console.log('🔐 Setting up storage policies...');
    
    // Policy for authenticated users to upload files
    const { error: uploadPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Users can upload data files',
      definition: `(bucket_id = 'data-uploads' AND auth.role() = 'authenticated')`,
      action: 'INSERT'
    });

    // Policy for authenticated users to read their own files
    const { error: readPolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Users can read data files',
      definition: `(bucket_id = 'data-uploads' AND auth.role() = 'authenticated')`,
      action: 'SELECT'
    });

    // Policy for authenticated users to delete their own files
    const { error: deletePolicyError } = await supabase.rpc('create_policy', {
      table_name: 'objects',
      policy_name: 'Users can delete data files',
      definition: `(bucket_id = 'data-uploads' AND auth.role() = 'authenticated')`,
      action: 'DELETE'
    });

    if (uploadPolicyError) console.log('Upload policy already exists or error:', uploadPolicyError.message);
    if (readPolicyError) console.log('Read policy already exists or error:', readPolicyError.message);
    if (deletePolicyError) console.log('Delete policy already exists or error:', deletePolicyError.message);

    console.log('✅ Storage setup completed successfully!');
    console.log('\nBucket configuration:');
    console.log('- Name: data-uploads');
    console.log('- Public: false');
    console.log('- Allowed types: CSV, Excel');
    console.log('- Size limit: 10MB');

  } catch (error) {
    console.error('❌ Storage setup failed:', error);
    process.exit(1);
  }
}

// Test the storage connection
async function testStorage() {
  console.log('\n🧪 Testing storage connection...');
  
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      throw error;
    }

    console.log('✅ Storage connection successful!');
    console.log('📋 Available buckets:');
    buckets.forEach(bucket => {
      console.log(`  - ${bucket.name} (${bucket.public ? 'public' : 'private'})`);
    });

  } catch (error) {
    console.error('❌ Storage connection failed:', error);
    process.exit(1);
  }
}

// Run the setup
async function main() {
  await testStorage();
  await setupStorage();
  console.log('\n🎉 Supabase Storage setup complete!');
}

main().catch(console.error); 