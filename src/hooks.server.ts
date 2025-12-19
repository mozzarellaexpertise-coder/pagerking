import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export const handle: Handle = async ({ event, resolve }) => {
    // 1. Handle OPTIONS (Preflight) manually just in case
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

    const authHeader = event.request.headers.get('Authorization');
    const supabaseAdmin = createClient(
        import.meta.env.SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const { data: { user } } = await supabaseAdmin.auth.getUser(token);
        if (user) event.locals.user = user;
    }

    return resolve(event);
};