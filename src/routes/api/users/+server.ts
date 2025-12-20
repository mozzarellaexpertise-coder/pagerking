import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request }) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return json({ ok: false, users: [] }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '').trim();
  const { data: userData, error } = await supabase.auth.getUser(token);

  if (error || !userData?.user?.email) {
    return json({ ok: false, users: [] }, { status: 401 });
  }

  const myEmail = userData.user.email;

  const { data, error: dbErr } = await supabase
    .from('profiles')
    .select('email')
    .neq('email', myEmail)
    .order('email');

  if (dbErr) {
    return json({ ok: false, users: [] }, { status: 500 });
  }

  return json({
    ok: true,
    users: data ?? []
  });
}
