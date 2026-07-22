import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anonymous Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment.'
  );
}

// If env vars are provided, initialize the real client. Otherwise export a
// lightweight stub that provides the commonly used `from()` chain methods so
// the app can continue running in local-only mode without throwing.
let _supabase: any = null;

if (supabaseUrl && supabaseAnonKey) {
  _supabase = createClient(supabaseUrl, supabaseAnonKey);
} else {
  const noopResponse = async () => ({ data: [], error: null });
  _supabase = {
    from: (_: string) => ({
      select: noopResponse,
      insert: noopResponse,
      update: noopResponse,
      delete: noopResponse,
      upsert: noopResponse,
    }),
  };
}

export const supabase = _supabase;
