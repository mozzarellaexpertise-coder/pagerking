import type { Handle } from '@sveltejs/kit';
import { createServerClient } from '@supabase/ssr';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '$env/static/private';

export const handle: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) =>
          event.cookies.set(key, value, options),
        remove: (key, options) =>
          event.cookies.delete(key, options)
      }
    }
  );

  const {
    data: { user }
  } = await event.locals.supabase.auth.getUser();

  event.locals.user = user ?? null;

  return resolve(event);
};