import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/types/database';


/**
 * Creates a browser-side Supabase client strongly typed with the Database schema.
 * Safe to use in Client Components ("use client").
 *
 * Throws in non-demo environments if the required env vars are not set,
 * so misconfigured production deploys fail fast rather than silently falling
 * back to a non-existent Supabase instance.
 */
export function createClient() {

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      '[Campus Nexus] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set.'
    );
  }

  return createBrowserClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Singleton instance for client-side usage
let browserClient: ReturnType<typeof createBrowserClient<Database>> | null = null;

export function getSupabaseBrowserClient() {
  if (!browserClient) {
    browserClient = createClient();
  }
  return browserClient;
}
