// src/routes/+layout.ts

import { getSupabaseClient, initializeSupabaseClient } from '$lib/supabaseClient';
import { load as serverLoad } from './+layout.server.js';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data, fetch, depends }) => {
    // 1. Initialize the shared client using the keys passed from the server
    const supabase = initializeSupabaseClient(data.supabaseUrl, data.supabaseAnonKey);

    // 2. Make the client available to child components via the store
    // (You likely have a different method, but this is the goal)

    // 3. Keep existing logic for passing data
    depends('supabase:auth');

    return {
        ...data,
        supabase
    };
};