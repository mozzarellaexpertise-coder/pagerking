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

// GET last 50 messages
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    console.error('GET /api/messages failed:', err);
    return json(
      { ok: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

// POST a new message
export async function POST({ request }: { request: Request }) {
  try {
    const body = await request.json();

    const text = body.text?.trim();
    const sender_id = body.sender_id ?? 'Gerald';
    const receiver_id = body.receiver_id ?? null;

    if (!text) {
      return json(
        { ok: false, error: 'Text is required' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([{ text, sender_id, receiver_id }])
      .select()
      .single();

    if (error) throw error;

    return json(
      { ok: true, message: `Hello ${sender_id} to ${receiver_id ?? 'All'}!`, data },
      { headers: CORS_HEADERS }
    );
  } catch (err: any) {
    console.error('POST /api/messages failed:', err);
    return json(
      { ok: false, error: err.message },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}