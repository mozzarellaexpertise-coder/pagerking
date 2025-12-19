import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export const handle: Handle = async ({ event, resolve }) => {
  const supabaseAdmin = createClient(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY // MUST be service role key
  );

  // Get user from cookie (sent from browser)
  const {
    data: { user }
  } = await supabaseAdmin.auth.getUserByCookie(event.request);

  event.locals.user = user ?? null;

  return resolve(event);
};