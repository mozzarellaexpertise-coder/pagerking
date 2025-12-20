import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ ok: false, messages: [] }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const { data: userData, error } = await supabase.auth.getUser(token);

  if (error || !userData?.user?.email) {
    return json({ ok: false, messages: [] }, { status: 401 });
  }

  const email = userData.user.email;

  const { data, error: dbErr } = await supabase
    .from('messages')
    .select('*')
    .or(`receiver_email.eq.${email},receiver_email.eq.All`)
    .order('created_at', { ascending: false });

  if (dbErr) {
    return json({ ok: false, messages: [] }, { status: 500 });
  }

  return json({
    ok: true,
    messages: data ?? []   // 🔒 GUARANTEED ARRAY
  });
}