import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '$env/static/private';

const supabaseAdmin = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY
);

export const handle: Handle = async ({ event, resolve }) => {
  const { data: { user }, error } =
    await supabaseAdmin.auth.getUserByCookie(event.request);

  if (error) {
    console.error('Supabase auth error:', error.message);
  }

  event.locals.user = user ?? null;

  return resolve(event);
};