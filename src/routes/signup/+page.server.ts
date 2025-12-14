// src/routes/signup/+page.server.ts

import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (session) {
		// If the user is already logged in, send them home
		throw redirect(303, '/');
	}

	return {};
};