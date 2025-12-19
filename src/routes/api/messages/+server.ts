import { json } from '@sveltejs/kit';
import { supabase } from '$lib/server/supabaseClient';

export async function GET({ locals }) {
    if (!locals.user) {
        return json({ ok: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${locals.user.id},receiver_id.eq.${locals.user.id}`)
        .order('created_at', { ascending: true });

    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, data });
}

export async function POST({ request, locals }) {
    if (!locals.user) return json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const { text, receiver_id } = await request.json();

    const { data, error } = await supabase
        .from('messages')
        .insert([{ 
            text, 
            sender_id: locals.user.id, 
            receiver_id 
        }])
        .select()
        .single();

    if (error) return json({ ok: false, error: error.message }, { status: 500 });
    return json({ ok: true, data });
}