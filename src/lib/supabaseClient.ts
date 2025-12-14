// $lib/supabaseClient.ts (Revised)

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

// Initialize with placeholder or null, and expect it to be set by the layout
let supabase: SupabaseClient | null = null; 

/**
 * Initializes and returns the Supabase client.
 * This is designed to be called once by the root +layout.ts file.
 */
export function initializeSupabaseClient(supabaseUrl: string, supabaseAnonKey: string) {
    if (supabase) {
        return supabase;
    }
    
    // Check for required values before creating the client
    if (!supabaseUrl || !supabaseAnonKey) {
        throw new Error('Supabase URL and Anon Key are required for client initialization.');
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey);
    return supabase;
}

// Export a getter function for components that need the client
export function getSupabaseClient(): SupabaseClient {
    if (!supabase) {
        // This indicates a missing initialization call in +layout.ts
        throw new Error('Supabase client has not been initialized. Ensure it is initialized in +layout.ts');
    }
    return supabase;
}

// Rename your existing export in components like +page.svelte to use getSupabaseClient()
// e.g., const supabase = getSupabaseClient();