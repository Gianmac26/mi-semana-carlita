import { createClient } from '@supabase/supabase-js';

// Factory function — never evaluated at module load time, only when called inside a request handler.
// This avoids Next.js "collect page data" failures when env vars are server-only secrets.
export function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
