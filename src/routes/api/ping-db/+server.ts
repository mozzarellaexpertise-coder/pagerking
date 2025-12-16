import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET() {
  const { data, error } = await supabase
    .from('messages')
    .select('id')
    .limit(1);

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500 });
  }

  return json({ ok: true });
}