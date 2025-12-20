import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function POST({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return json({ ok: false, error: 'No auth header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const sender = userData.user.email;
    const body = await request.json();
    const text = body.text?.trim();
    const receiver = body.receiver?.trim() || 'All';
    if (!text) return json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });

    const { data: inserted, error: insertError } = await supabase
      .from('messages')
      .insert({ sender_email: sender, receiver_email: receiver, text })
      .select();

    if (insertError) return json({ ok: false, error: insertError.message }, { status: 500 });

    return json({ ok: true, message: inserted[0] });

  } catch (err) {
    console.error('sendMessage error:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}