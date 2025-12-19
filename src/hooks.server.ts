import type { Handle } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

export const handle: Handle = async ({ event, resolve }) => {
    const authHeader = event.request.headers.get('Authorization');
    
    // 1. Setup Supabase Admin
    const supabaseAdmin = createClient(
        import.meta.env.SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // 2. Extract Token
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        
        // 3. Verify the user with Supabase
        const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
        
        if (!error && user) {
            event.locals.user = user;
        }
    }

    // 4. Handle CORS Preflight (Crucial for Vercel)
    if (event.request.method === 'OPTIONS') {
        return new Response(null, {
            headers: {
                'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true'
            }
        });
    }

    const response = await resolve(event);
    
    // 5. Add CORS to every response
    response.headers.set('Access-Control-Allow-Origin', 'https://pager-king-client.vercel.app');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
};
};