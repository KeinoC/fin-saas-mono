import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For build time, create a dummy client if env vars are missing
const createSupabaseClient = () => {
  if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
      // During build time, return a dummy client
      return createClient('https://dummy.supabase.co', 'dummy-key');
    }
    throw new Error('Missing Supabase environment variables');
  }
  return createClient(supabaseUrl, supabaseAnonKey);
};

export const supabase = createSupabaseClient();

export type { Database } from './types/supabase'; 