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
    const receiver = body.receiver || 'All';

    // Delete previous outgoing message safely (one-per-user)
    const { error: delError } = await supabase.from('messages').delete().eq('sender_email', sender);
    if (delError) console.warn('Delete previous message failed (might be empty)', delError.message);

    // Insert new message
    const { error: insertError } = await supabase.from('messages').insert({
      sender_email: sender,
      receiver_email: receiver,
      text,
      created_at: new Date().toISOString()
    });

    if (insertError) {
      console.error('Insert message error:', insertError.message);
      return json({ ok: false, error: insertError.message }, { status: 500 });
    }

    return json({ ok: true });

  } catch (err) {
    console.error('Unexpected sendMessage error:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}