import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export const handle: Handle = async ({ event, resolve }) => {
    // 1. Grab environment variables safely (checking both Vite and Node styles)
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.SUPABASE_URL;
    const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    // 2. Handle CORS Preflight (OPTIONS) - MUST be first to prevent browser blocking
    if (event.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }

    // 3. Only attempt Auth if we have the keys, otherwise log the error
    if (!supabaseUrl || !serviceKey) {
        console.error("SERVER ERROR: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in Vercel Env Variables");
    } else {
        const authHeader = event.request.headers.get('Authorization');
        
        if (authHeader?.startsWith('Bearer ')) {
            try {
                const token = authHeader.split(' ')[1];
                const supabaseAdmin = createClient(supabaseUrl, serviceKey);
                
                const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
                
                if (!error && user) {
                    event.locals.user = user;
                }
            } catch (err) {
                console.error("AUTH HOOK ERROR:", err);
            }
        }
    }

    // 4. Resolve the request
    const response = await resolve(event);
    
    // 5. Inject CORS headers into every response
    response.headers.set('Access-Control-Allow-Origin', 'https://pager-king-client.vercel.app');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    return response;
};