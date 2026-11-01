import { createClient } from '@supabase/supabase-js';

/**
 * Returns a Supabase client initialized with the Service Role key for elevated
 * server-side database operations (e.g. updating order_payments & online_orders).
 *
 * Strictly runs in Node.js server environment only.
 */
export function getSupabaseServerClient() {
  const supabaseUrl =
    process.env.SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL;

  const serviceRoleKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl) {
    throw new Error(
      'Missing Supabase URL: Please configure NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Missing Supabase Service Role Key: SUPABASE_SERVICE_ROLE_KEY is required for server-side payment updates.'
    );
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
