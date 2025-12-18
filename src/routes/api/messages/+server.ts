import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET — Fetch latest messages relevant to current user
 */
export async function GET({ locals }: any) {
  try {
    // You can pass current user id via query or locals
    const user_id = locals?.user_id;

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

/**
 * POST — Insert a new message
 */
export async function POST({ request }: { request: Request }) {
  try {
    const { text, sender_id, receiver_id } = await request.json();

    if (!text || !sender_id) {
      return json({ ok: false, error: 'Missing text or sender_id' }, { status: 400, headers: CORS_HEADERS });
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([
        {
          text,
          sender_id,
          receiver_id: receiver_id || null
        }
      ])
      .select(`
        id,
        text,
        created_at,
        sender:sender_id(id,email,name),
        receiver:receiver_id(id,email,name)
      `)
      .single();

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('POST /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}