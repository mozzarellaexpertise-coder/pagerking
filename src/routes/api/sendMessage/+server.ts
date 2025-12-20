import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return json({ ok: false, error: 'No auth header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const text = body.text?.trim();
    if (!text) return json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });

    const sender = userData.user.email;
    const receiver = body.receiver || 'All'; // default if you want broadcast

    // Delete previous message from this sender
    await supabase.from('messages').delete().eq('sender_email', sender);

    // Insert new message
    const { error } = await supabase.from('messages').insert({
      sender_email: sender,
      receiver_email: receiver,
      text,
    });

    if (error) return json({ ok: false, error: error.message }, { status: 500 });

    return json({ ok: true });
  } catch (err) {
    console.error(err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}