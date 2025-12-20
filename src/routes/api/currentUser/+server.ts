import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

/**
 * GET /api/currentUser
 * Purpose:
 *  - Validate JWT sent from client
 *  - Return the authenticated Supabase user
 */
export async function GET({ request }) {
  try {
    // 1️⃣ Read Authorization header
    const authHeader = request.headers.get('authorization');

    if (!authHeader) {
      return json(
        { error: 'Authorization header missing' },
        { status: 401 }
      );
    }

    // 2️⃣ Extract Bearer token
    const token = authHeader.replace('Bearer ', '').trim();

    if (!token) {
      return json(
        { error: 'Invalid authorization token' },
        { status: 401 }
      );
    }

    // 3️⃣ Ask Supabase who this token belongs to
    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data?.user) {
      return json(
        { error: 'Invalid or expired token' },
        { status: 401 }
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
      { status: 200 }
    );

  } catch (err) {
    console.error('❌ /api/currentUser error:', err);

    return json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}