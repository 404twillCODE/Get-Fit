/**
 * Supabase client configuration
 */

import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

// These should be set as environment variables
// For now, using placeholder values - user will need to set these
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let supabaseClient: ReturnType<typeof createClient> | null = null;

if (isSupabaseConfigured) {
  supabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

export const getSupabaseClient = () => {
  if (!supabaseClient) {
    console.warn('Supabase client not initialized. Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY environment variables.');
    // Return a mock client that won't crash the app
    return createClient('https://placeholder.supabase.co', 'placeholder-key', {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
  return supabaseClient;
};

export default supabaseClient;

