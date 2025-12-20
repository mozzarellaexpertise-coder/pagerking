import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ request, url }) {
  try {
    console.log('🔹 testMessages GET called');

    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.warn('❌ No auth header provided');
      return json({ ok: false, error: 'No auth header' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '').trim();

    // Validate token
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr) {
      console.error('❌ supabase.auth.getUser error:', userErr);
      return json({ ok: false, error: userErr.message }, { status: 401 });
    }
    console.log('✅ User validated:', userData.user?.email);

    // Test reading messages table
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Supabase table read error:', error);
      return json({ ok: false, error: error.message }, { status: 500 });
    }

    console.log('✅ Messages table read success:', data);
    return json({ ok: true, sample: data });

  } catch (err) {
    console.error('❌ Unexpected error in testMessages:', err);
    return json({ ok: false, error: 'Internal server error' }, { status: 500 });
  }
}