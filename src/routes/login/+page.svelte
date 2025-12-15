<script lang="ts">
 import { invalidate } from '$app/navigation';
 import type { PageData } from './$types';

 export let data: PageData;
 $: ({ supabase, session } = data);

 let email = '';
 let password = '';
 let errorMsg = '';
 let isLoading = false;

 async function handleSignUp() {
  isLoading = true;
  errorMsg = '';

  const { error, data: signUpData } = await supabase.auth.signUp({
   email, password,
   options: { emailRedirectTo: `${window.location.origin}/auth/callback` }
  });

  if (error) {
   errorMsg = error.message;
  } else {
   // Ensure user row exists
   const { data: existing } = await supabase
     .from('users')
     .select('id')
     .eq('id', signUpData.user.id)
     .single();

   if (!existing) {
     await supabase.from('users').insert({
       id: signUpData.user.id,
       username: email.split('@')[0],
       email
     });
   }

   alert("🎉 Sign‑up successful! Check your email.");
   email = '';
   password = '';
  }

  isLoading = false;
 }

 async function handleSignIn() {
  isLoading = true;
  errorMsg = '';

  const { error, data: signInData } = await supabase.auth.signInWithPassword({
   email, password
  });

  if (!error) {
    // Ensure user row exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('id', signInData.user.id)
      .single();

    if (!existing) {
      await supabase.from('users').insert({
        id: signInData.user.id,
        username: email.split('@')[0],
        email
      });
    }

    await invalidate('supabase:auth');
    console.log("Sign In successful. Redirecting...");
  } else {
    errorMsg = error.message;
    password = '';
  }

  isLoading = false;
 }
</script>

<main>
 <h2>Pager System</h2>
 <form on:submit|preventDefault={handleSignIn}>
  <input type="email" placeholder="you@example.com" bind:value={email} required disabled={isLoading} />
  <input type="password" placeholder="••••••••" bind:value={password} required disabled={isLoading} />
  <button type="submit" disabled={isLoading}>{isLoading ? 'Processing…' : 'Sign In'}</button>
  <button type="button" on:click={handleSignUp} disabled={isLoading}>Create New Account</button>
 </form>
 {#if errorMsg}<p class="error">{errorMsg}</p>{/if}
</main>

<style>
main { max-width:400px;margin:60px auto;padding:24px;border:3px solid #4527a0;border-radius:12px;background:#f3e5f5;font-family:'Courier New',monospace;color:#222;box-shadow:10px10px0px #4527a0;}
h2 { text-align:center;color:#673ab7;text-transform:uppercase;letter-spacing:2px;}
input { width:100%; padding:10px;margin-bottom:12px;border:2px solid #4527a0;border-radius:0; }
button { width:100%; padding:12px;margin-top:6px;background:#ff8a65;border:2px solid #4527a0;color:#fff;font-weight:bold;cursor:pointer;text-transform:uppercase; }
button:disabled { opacity:0.5; cursor:not-allowed; }
.error { background:#ffcdd2;color:#b71c1c;padding:8px;text-align:center;margin-top:12px;}
</style>