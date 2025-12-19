import { json } from '@sveltejs/kit';

/**
 * Define CORS headers to allow your specific client domain.
 * In production, replace '*' with 'https://pager-king-client.vercel.app'
 */
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Credentials': 'true'
};

/**
 * Handle OPTIONS preflight requests (Required for Cross-Origin requests)
 */
export async function OPTIONS() {
    return new Response(null, { 
        status: 204, 
        headers: CORS_HEADERS 
    });
}

/**
 * GET — Returns the current authenticated user's data
 */
export async function GET({ locals }) {
    // locals.user is populated by the handle hook in src/hooks.server.ts
    // if the Authorization header was valid.
    if (!locals.user) {
        return json(
            { ok: false, user: null, error: 'Unauthorized' }, 
            { status: 401, headers: CORS_HEADERS }
        );
    }

    return json(
        {
            ok: true,
            user: {
                id: locals.user.id,
                email: locals.user.email,
                name: locals.user.user_metadata?.name || locals.user.email,
                last_sign_in: locals.user.last_sign_in_at
            }
        },
        { headers: CORS_HEADERS }
    );
}