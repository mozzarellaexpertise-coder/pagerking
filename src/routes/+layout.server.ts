// src/routes/+layout.server.ts
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals: { safeGetSession }, cookies }) => {
	// Fetch the session and user data
    const { session, user } = await safeGetSession();

	return {
		session,
		user,
		// Pass the cookies to +layout.ts so it can initialize the browser client correctly
		cookies: cookies.getAll(),
	};
};