import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function POST({ request }) {
  try {
    // -------------------- AUTH --------------------
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.warn('❌ No auth header provided');
      return json({ ok: false, error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData?.user) {
      console.warn('❌ Unauthorized token:', userErr?.message);
      return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const sender = userData.user.email;
    if (!sender) {
      console.error('❌ User email is missing in token payload');
      return json({ ok: false, error: 'Invalid user data' }, { status: 401 });
    }

    // -------------------- BODY PARSING --------------------
    const body = await request.json();
    const text = body.text?.trim();
    const receiver = body.receiver?.trim() || 'All';

    if (!text) return json({ ok: false, error: 'Message cannot be empty' }, { status: 400 });

    console.log('📨 sendMessage payload:', { sender, receiver, text });

    // -------------------- DELETE PREVIOUS MESSAGE --------------------
    try {
      const { error: delError } = await supabase
        .from('messages')
        .delete()
        .eq('sender_email', sender);

      if (delError) {
        console.warn('⚠️ Delete previous message failed (may be empty):', delError.message);
      } else {
        console.log('🗑 Previous message deleted (if existed)');
      }
    } catch (err) {
      console.warn('⚠️ Exception during delete previous message:', err);
    }

    // -------------------- INSERT NEW MESSAGE --------------------
    try {
      const { data: inserted, error: insertError } = await supabase
        .from('messages')
        .insert({
          sender_email: sender,
          receiver_email: receiver,
          text
          // created_at: auto-handled by DB default now()
        })
        .select();

      if (insertError) {
        console.error('❌ Insert message failed:', insertError.message);
        return json({ ok: false, error: insertError.message }, { status: 500 });
      }

      console.log('✅ Message inserted successfully:', inserted);
      return json({ ok: true, message: inserted[0] });

    } catch (err) {
      console.error('❌ Exception during insert:', err);
      return json({ ok: false, error: 'Failed to insert message' }, { status: 500 });
    }

  } catch (err) {
    console.error('❌ Unexpected sendMessage error:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}