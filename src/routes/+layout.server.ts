// src/routes/+layout.server.ts

import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

// ... (your existing load function logic, e.g., safeGetSession) ...

export const load = async (event) => {
    const { session, user } = await event.locals.safeGetSession();

    return {
        session,
        user,
        // CRITICAL: Explicitly pass the public keys so they are available to the client
        // You should check if they are already in the 'data' object on the client side
        supabaseUrl: PUBLIC_SUPABASE_URL,
        supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY
    };
};