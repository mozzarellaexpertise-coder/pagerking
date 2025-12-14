// src/routes/auth/callback/+server.ts

import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
    const {
        url,
        locals: { supabase }
    } = event;
    
    // 1. Extract the token from the URL query parameters
    const code = url.searchParams.get('code');
    const next = url.searchParams.get('next') ?? '/'; 

    if (code) {
        // 2. Exchange the token for a session
        await supabase.auth.exchangeCodeForSession(code);
    }

    // 3. Redirect the user to the home page
    throw redirect(303, next);
};