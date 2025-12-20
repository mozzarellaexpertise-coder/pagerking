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

  const myEmail = userData.user.email;

  // 1️⃣ Fetch ALL messages involving me
  const { data, error: dbErr } = await supabase
    .from('messages')
    .select('*')
    .or(
      `sender_email.eq.${myEmail},receiver_email.eq.${myEmail}`
    )
    .order('created_at', { ascending: false });

  if (dbErr) {
    return json({ ok: false, messages: [] }, { status: 500 });
  }

  // 2️⃣ Reduce to ONE message per other user
  const seen = new Set<string>();
  const latestPerUser = [];

  for (const msg of data ?? []) {
    const otherUser =
      msg.sender_email === myEmail
        ? msg.receiver_email
        : msg.sender_email;

    if (!seen.has(otherUser)) {
      seen.add(otherUser);
      latestPerUser.push(msg);
    }
  }

  return json({
    ok: true,
    messages: latestPerUser
  });
}