import { json } from '@sveltejs/kit';
import { supabase } from '$lib/supabase';

export async function GET() {
  // Fetch latest 50 messages, newest first
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }

  return json({ ok: true, data });
}

export async function POST({ request }: { request: Request }) {
  const body = await request.json();
  const { user_id, content } = body;

  if (!user_id || !content) {
    return json({ ok: false, error: 'Missing user_id or content' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{ user_id, content }])
    .select()
    .single(); // return the inserted message

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }

  return json({ ok: true, data });
}
