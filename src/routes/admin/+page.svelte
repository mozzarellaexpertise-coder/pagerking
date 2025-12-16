<script lang="ts">
  import { onMount } from 'svelte';
  import { getSupabaseClient } from '$lib/supabaseClient';

  let users = [];

  onMount(async () => {
    const supabase = getSupabaseClient();
    const { data } = await supabase.from('users').select('*');
    users = data || [];
  });
</script>

<h1>Admin Panel</h1>

<ul>
  {#each users as user}
    <li>{user.email}</li>
  {/each}
</ul>
