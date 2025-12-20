import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request }) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return json({ ok: false, users: [] }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);

    if (userErr || !userData?.user?.email) {
      return json({ ok: false, users: [] }, { status: 401 });
    }

    const myEmail = userData.user.email;

    // Fetch all users from profiles except the current user
    const { data: profiles, error: profilesErr } = await supabase
      .from('profiles')
      .select('id, email')
      .neq('email', myEmail)
      .order('email', { ascending: true });

    if (profilesErr) {
      console.error('Error fetching profiles:', profilesErr.message);
      return json({ ok: false, users: [] }, { status: 500 });
    }

    return json({ ok: true, users: profiles });

  } catch (err) {
    console.error('Unexpected error in getUsers:', err);
    return json({ ok: false, users: [] }, { status: 500 });
  }
}