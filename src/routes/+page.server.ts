// src/routes/+page.server.ts
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

// Redirects unauthenticated users from the root page (/) to the login page (/login)
export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
	const { session } = await safeGetSession();

	if (!session) {
		// If no session exists, redirect immediately
		throw redirect(303, '/login');
	}

	// If logged in, page continues to load
	return {};
};