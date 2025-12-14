// src/routes/login/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// This function redirects logged-in users AWAY from the login page.
export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (session) {
		// If a session IS found, redirect to the home page.
		throw redirect(303, '/');
	}

	// If no session exists, allow the login page to render.
	return {};
};