import { json } from '@sveltejs/kit';
import { supabaseAdmin } from '$lib/server/supabaseAdmin';

export async function POST({ request }) {
	const { user_id } = await request.json();

	if (!user_id) {
		return json({ error: 'Missing user_id' }, { status: 400 });
	}

	// Read from queue
	const { data, error } = await supabaseAdmin.rpc('read_pager_messages', {
		max_messages: 5
	});

	if (error || !data) {
		console.error('read_pager_messages error:', error);
		return json({ error: 'Failed to read queue' }, { status: 500 });
	}

	const messages = [];

	for (const item of data) {
		const msg = item.message as any;

		// Only deliver messages for this user
		if (msg.receiver_id !== user_id) continue;

		// Insert into main messages table
		const { error: insertError } = await supabaseAdmin
			.from('messages')
			.insert({
				sender_id: msg.sender_id,
				receiver_id: msg.receiver_id,
				text: msg.text
			});

		if (insertError) {
			console.error('Insert error:', insertError);
			continue;
		}

		// ACK the queue message
		await supabaseAdmin.rpc('ack_pager_message', {
			message_id: item.msg_id
		});

		messages.push({
			id: crypto.randomUUID(),
			sender_id: msg.sender_id,
			receiver_id: msg.receiver_id,
			text: msg.text,
			created_at: new Date().toISOString()
		});
	}

	return json({ messages });
}