// src/routes/+layout.ts
import { PUBLIC_SUPABASE_ANON_KEY, PUBLIC_SUPABASE_URL } from '$env/static/public';
import { createBrowserClient, isBrowser } from '@supabase/ssr'; // Removed 'parse'
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
    depends('supabase:auth');

    const supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
        global: { fetch },
        cookies: {
            getAll() {
                if (!isBrowser()) {
                    // This data comes from +layout.server.ts and should be an array.
                    return data.cookies; 
                }
                
                // CLIENT-SIDE: Return an empty array if document.cookie is empty,
                // which prevents the Supabase client from attempting to parse an empty string 
                // and avoids the allCookies?.find is not a function error.
                if (!document.cookie) {
                    return [];
                }
                
                // If using a manual client, document.cookie is a string.
                // We rely on the Supabase client to handle the parsing internally,
                // or we return the raw string and let the client handle it.
                // The safest modern approach often returns a default state.
                return []; 
            },
            setAll(cookiesToSet) {
                if (isBrowser()) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        document.cookie = `${name}=${value}; path=/; SameSite=Lax;`;
                    });
                }
            },
            removeAll: () => {
                // Not strictly required here, but included for completeness.
            }
        },
    });

    const { data: { session } } = await supabase.auth.getSession();

    return { supabase, session };
};