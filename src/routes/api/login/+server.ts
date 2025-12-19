import { json } from '@sveltejs/kit';
import { createClient } from '@supabase/supabase-js';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
  'Access-Control-Allow-Methods': 'POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST({ request }) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return json(
        { ok: false, error: 'Missing email or password' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

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

    // IMPORTANT: Set cookie for browser
    const response = json(
      { ok: true, user: data.user },
      { headers: CORS_HEADERS }
    );

    return response;
  } catch (err: any) {
    return json(
      { ok: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
