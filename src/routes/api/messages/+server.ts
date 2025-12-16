import { json } from '@sveltejs/kit';

// CORS headers
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',        // allow all origins (dev)
  'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// OPTIONS preflight (no Supabase import)
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET messages
export async function GET() {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}

// POST new message
export async function POST({ request }: { request: Request }) {
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!
    );

    const body = await request.json();
    const { sender_id, receiver_id, text } = body;

    if (!sender_id || !receiver_id || !text)
      return json({ ok: false, error: 'Missing fields' }, { status: 400, headers: CORS_HEADERS });

    const { data, error } = await supabase
      .from('messages')
      .insert([{ sender_id, receiver_id, text }])
      .select()
      .single();

    if (error) return json({ ok: false, error: error.message }, { status: 500, headers: CORS_HEADERS });

    return json({ ok: true, data }, { headers: CORS_HEADERS });
  } catch (err: any) {
    return json({ ok: false, error: err.message }, { status: 500, headers: CORS_HEADERS });
  }
}