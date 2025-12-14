import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request }) {
	const { sender_id, receiver_id, text } = await request.json();

	if (!sender_id || !receiver_id || !text) {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	// Push into PGMQ via RPC (service_role)
	const { error } = await supabaseAdmin.rpc('send_pager_message', {
		p_sender_id: sender_id,
		p_receiver_id: receiver_id,
		p_text: text
	});

	if (error) {
		console.error('send_pager_message error:', error);
		return json({ error: error.message }, { status: 500 });
	}

	return json({ success: true });
}