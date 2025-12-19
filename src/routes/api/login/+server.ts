import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
};

/**
 * Handle OPTIONS preflight
 */
export async function OPTIONS() {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST — Authenticate user and return session
 */
export async function POST({ request }) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return json(
                { ok: false, error: 'Email and password are required' },
                { status: 400, headers: CORS_HEADERS }
            );
        }

        // Authenticate with Supabase
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });

        if (error) {
            return json(
                { ok: false, error: error.message },
                { status: 401, headers: CORS_HEADERS }
            );
        }

        // Return the session object (contains access_token and refresh_token)
        return json(
            { 
                ok: true, 
                session: data.session, 
                user: data.user 
            },
            { headers: CORS_HEADERS }
        );

    } catch (err: any) {
        console.error('Login error:', err);
        return json(
            { ok: false, error: 'Internal Server Error' },
            { status: 500, headers: CORS_HEADERS }
        );
    }
}