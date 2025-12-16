import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*', // allow all origins (for dev)
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  // preflight response
  return new Response(null, { headers: CORS_HEADERS });
}

export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return json({ ok: true, data }, { headers: CORS_HEADERS });
}

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const { sender_id, receiver_id, content } = body;

  if (!sender_id || !receiver_id || !content) {
    return json({ ok: false, error: 'Missing fields' }, { status: 400, headers: CORS_HEADERS });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ sender_id, receiver_id, text: content }])
    .select()
    .single();

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });
  }

  return json({ ok: true, data }, { headers: CORS_HEADERS });
}