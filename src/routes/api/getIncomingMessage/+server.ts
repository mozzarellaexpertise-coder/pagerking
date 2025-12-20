import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request, url }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) return json({ ok: false, error: 'No auth header' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const email = url.searchParams.get('email') || userData.user.email;

    // ✅ Use maybeSingle() instead of single() to avoid crashing if no messages
    const { data, error } = await supabase
      .from('messages')
      .select('text')
      .eq('receiver_email', email)
      .order('created_at', { ascending: false })
      .maybeSingle(); // <--- change here

    if (error) {
      console.error('Supabase query error:', error);
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    return json({ ok: true, message: data?.text || '' });

  } catch (err) {
    console.error('Unexpected error in getIncomingMessage:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}