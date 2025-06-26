import { createClient } from '@supabase/supabase-js';

// Use the actual environment variable names from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

// For build time, create a dummy client if env vars are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('Supabase environment variables missing - using dummy client for development');
    
    // Return a dummy client during development or build time
    return createClient('https://dummy.supabase.co', 'dummy-key');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

export type { Database } from './types/supabase'; 