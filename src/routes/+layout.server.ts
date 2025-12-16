// src/routes/+layout.server.ts
import { getSupabaseClient } from '$lib/supabaseClient';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ depends }) => {
  // Initialize Supabase client (server-side)
  const supabase = getSupabaseClient();

  // Let SvelteKit know this depends on auth
  depends('supabase:auth');

  return { supabase };
};