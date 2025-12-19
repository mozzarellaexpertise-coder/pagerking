import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://pager-king-client.vercel.app',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': 'true'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET messages
export async function GET({ locals }: any) {
  try {
    const user_id = locals?.user?.id;
    let query = supabase
      .from('messages')
      .select(`
        id,
        text,
        created_at,
        sender:sender_id(id,email,name),
        receiver:receiver_id(id,email,name)
      `)
      .order('created_at', { ascending: true });

    if (user_id) {
      query = query.or(`sender_id.eq.${user_id},receiver_id.eq.${user_id},receiver_id.is.null`);
    }

    const { data, error } = await query;

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('GET /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST message
export async function POST({ request, locals }: { request: Request; locals: any }) {
  try {
    const { text, receiver_id } = await request.json();
    const sender_id = locals.user?.id;

    if (!text || !sender_id) {
      return json({ ok: false, error: 'Missing text or sender_id' }, { status: 400, headers: CORS_HEADERS });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, sender_id, receiver_id: receiver_id || null }])
      .select(`
        id,
        text,
        created_at,
        sender:profiles!sender_id(id,email,name)
      `)
      .single();

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('POST /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}