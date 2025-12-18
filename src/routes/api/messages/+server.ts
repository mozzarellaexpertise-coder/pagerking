import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// Helper to get user ID from Supabase JWT in Authorization header
async function getUserId(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;
  return user.id;
}

export async function POST({ request }: { request: Request }) {
  try {
    const sender_id = await getUserId(request);
    if (!sender_id) return json({ ok: false, error: 'Unauthorized' }, { status: 401, headers: CORS_HEADERS });

    const { receiver_id, text } = await request.json();

    if (!text) return json({ ok: false, error: 'Missing text' }, { status: 400, headers: CORS_HEADERS });

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id, receiver_id: receiver_id || null, text }])
      .select()
      .single();

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('POST /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}
