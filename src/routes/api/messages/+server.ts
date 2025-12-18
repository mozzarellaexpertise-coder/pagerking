import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization'
};

// OPTIONS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * GET — Pager mode
 * Returns latest message per sender/receiver pair, including sender name
 */
export async function GET({ request }: { request: Request }) {
  try {
    // Pull messages with sender name from profiles
    const { data, error } = await supabase
      .from('messages')
      .select(`
        id,
        text,
        sender_id,
        receiver_id,
        created_at,
        profiles!messages_sender_id_fkey (name)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Deduplicate by sender + receiver
    const seen = new Set<string>();
    const latestMessages = [];

    for (const msg of data) {
      const key = `${msg.sender_id}->${msg.receiver_id ?? 'ALL'}`;
      if (!seen.has(key)) {
        seen.add(key);
        latestMessages.push({
          ...msg,
          sender_name: msg.profiles?.name || 'Unknown'
        });
      }
    }

    return json({ ok: true, data: latestMessages }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('GET /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

/**
 * POST — Insert a message (history preserved)
 */
export async function POST({ request, locals }: { request: Request; locals: any }) {
  try {
    const body = await request.json();
    const { sender_id, receiver_id, text } = body;

    if (!sender_id || !text) {
      return json({ ok: false, error: 'Missing fields' }, { status: 400, headers: CORS_HEADERS });
    }

    // Optional: enforce that sender_id matches logged-in user
    // Assuming you pass user info in locals (JWT session)
    // if (locals.user?.id !== sender_id) {
    //   return json({ ok: false, error: 'Unauthorized sender' }, { status: 403, headers: CORS_HEADERS });
    // }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id, receiver_id: receiver_id || null, text }])
      .select();

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('POST /api/messages failed:', err);
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}