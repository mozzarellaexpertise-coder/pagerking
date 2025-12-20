import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request, url }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return json({ ok: false, error: 'No auth header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const email = userData.user.email;

    // Fetch messages where user is sender or receiver, or public (receiver = 'All')
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .or(`sender_email.eq.${email},receiver_email.eq.${email},receiver_email.eq.All`)
      .order('created_at', { ascending: false })
      .limit(20); // last 20 messages

    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    return json({
      ok: true,
      messages: data.map(msg => ({
        sender: msg.sender_email,
        receiver: msg.receiver_email,
        text: msg.text,
        created_at: msg.created_at
      }))
    });

  } catch (err) {
    console.error('getIncomingMessage error:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}