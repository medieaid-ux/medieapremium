import { createClient } from '@supabase/supabase-js';

// Client-side Supabase client (uses anon key, respects RLS)
let browserClient = null;

export function createClientBrowser() {
  if (browserClient) return browserClient;
  
  browserClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  return browserClient;
}

// Server-side Supabase client (uses service_role key, bypasses RLS)
export function createClientServer() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}
