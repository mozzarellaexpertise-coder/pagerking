import { writable } from 'svelte/store';
import { supabase } from '$lib/supabaseClient';
import type { Session, User } from '@supabase/supabase-js';

export const session = writable<Session | null>(null);
export const user = writable<User | null>(null);

// Listen for auth changes
supabase.auth.onAuthStateChange((_event, sessionData) => {
    session.set(sessionData);
    user.set(sessionData?.user ?? null);
});
