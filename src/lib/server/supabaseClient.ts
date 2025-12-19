import { createClient } from '@supabase/supabase-js';
// We use $env/static/private to ensure these NEVER leak to the browser
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('CRITICAL: Supabase Environment Variables are missing in Vercel Settings');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});