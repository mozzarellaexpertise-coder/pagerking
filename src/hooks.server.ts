// src/hooks.server.ts
import { createServerClient } from '@supabase/ssr';
import { type Handle } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

export const handle: Handle = async ({ event, resolve }) => {
    // 1. Initialize Supabase Client (Server-Side)
    event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        cookies: {
            getAll: () => event.cookies.getAll(),
            setAll: (cookiesToSet) => {
                cookiesToSet.forEach(({ name, value, options }) => {
                    event.cookies.set(name, value, { ...options, path: '/' });
                });
            },
            removeAll: (cookiesToRemove) => {
                cookiesToRemove.forEach(({ name, options }) => {
                    event.cookies.delete(name, { ...options, path: '/' });
                });
            },
        },
    });

    // 2. Expose safeGetSession function to SvelteKit's 'locals'
    event.locals.safeGetSession = async () => {
        const { data: { session } } = await event.locals.supabase.auth.getSession();
        if (!session) return { session: null, user: null };
        const { data: { user }, error } = await event.locals.supabase.auth.getUser();
        if (error) return { session: null, user: null };
        return { session, user };
    };

    // 3. Resolve request and ensure necessary Supabase headers are preserved
    const response = await resolve(event, {
        filterSerializedResponseHeaders(name) {
            return name === 'content-range' || name === 'x-supabase-api-version';
        },
    });

    return response;
};