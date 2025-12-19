import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    // 1. Immediate Preflight Response
    if (event.request.method === 'OPTIONS') {
        return new Response(null, {
            status: 204,
            headers: {
                'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization',
                'Access-Control-Allow-Credentials': 'true',
                'Access-Control-Max-Age': '86400',
            }
        });
    }

    const response = await resolve(event);
    
    // 2. Add headers to the final response
    response.headers.set('Access-Control-Allow-Origin', 'https://pager-king-client.vercel.app');
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    
    return response;
};