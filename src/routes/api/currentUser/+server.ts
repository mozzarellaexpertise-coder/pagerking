// src/routes/api/currentUser/+server.ts
import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

/**
 * CORS headers for Vercel + separate client domain
 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app', // your client URL
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Allow-Methods': 'GET, OPTIONS'
};

/**
 * OPTIONS handler for preflight
 */
export async function OPTIONS() {
  return new Response(null, { headers: CORS_HEADERS });
}

/**
 * GET /api/currentUser
 * Validates JWT from client and returns authenticated user
 */
export async function GET({ request }) {
  try {
    // 1️⃣ Read Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json(
        { error: 'Authorization header missing' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 2️⃣ Extract Bearer token
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) {
      return json(
        { error: 'Invalid authorization token' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 3️⃣ Ask Supabase who this token belongs to
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return json(
        { error: 'Invalid or expired token' },
        { status: 401, headers: CORS_HEADERS }
      );
    }

    // 4️⃣ Success — return user
    return json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
          role: data.user.role,
          created_at: data.user.created_at
        }
      },
      { status: 200, headers: CORS_HEADERS }
    );

  } catch (err) {
    console.error('❌ /api/currentUser error:', err);
    return json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}