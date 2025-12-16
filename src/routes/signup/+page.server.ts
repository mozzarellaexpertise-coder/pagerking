import { getSupabaseClient } from '$lib/supabaseClient';
import type { Actions } from './$types';

export const actions: Actions = {
  default: async ({ request }) => {
    const formData = await request.formData();
    const email = formData.get('email')?.toString() || '';
    const password = formData.get('password')?.toString() || '';

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) return { success: false, error: error.message };

    return { success: true, user: data.user };
  }
};