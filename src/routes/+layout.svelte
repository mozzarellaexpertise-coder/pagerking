<script lang="ts">
  import { onMount } from 'svelte';
  import { invalidate } from '$app/navigation';

  export let data;

  // Destructure supabase and session from the data provided by +layout.ts
  $: ({ supabase, session } = data);

  onMount(() => {
    // This listener detects when a user logs in or out
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, _session) => {
      /* 
         If the session's access_token changes, we need to re-run 
         all load functions to ensure +layout.server.ts and +page.server.ts 
         have the correct auth context.
      */
      if (_session?.access_token !== session?.access_token) {
        invalidate('supabase:auth');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  });
</script>

<!-- Slot allows your pages (like +page.svelte) to render inside the layout -->
<slot />

<style>
  /* Global styles */
  :global(body) {
    margin: 0;
    padding: 0;
    font-family: sans-serif;
  }
</style>