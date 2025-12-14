<script lang="ts">
 import { onMount } from 'svelte';
 import { invalidate } from '$app/navigation'; // <-- ADD THIS IMPORT
 import type { PageData } from './$types';

 // Data passed from +layout.ts
 export let data: PageData;
 $: ({ supabase, session } = data);

 let email = '';
 let password = '';
 let errorMsg = '';
 let isLoading = false;

 // --------------------------------
 // 🟢 SIGN UP FUNCTION (New User)
 // --------------------------------
 async function handleSignUp() {
  isLoading = true;
  errorMsg = '';

  const { error } = await supabase.auth.signUp({
   email,
   password,
   options: {
    // CRITICAL: This is the URL Supabase sends the user to after they click the confirmation link.
    emailRedirectTo: `${window.location.origin}/auth/callback`,
   }
  });

  if (error) {
   errorMsg = error.message;
  } else {
   // Success Message - user now needs to check their email
   alert("🎉 Sign‑up successful! Please check your email inbox to confirm your account.");
   email = ''; 
   password = '';
  }
  isLoading = false;
 }

 // --------------------------------
 // 🟢 SIGN IN FUNCTION (Existing User)
 // --------------------------------
 async function handleSignIn() {
  isLoading = true;
  errorMsg = '';

  const { error } = await supabase.auth.signInWithPassword({
   email,
   password
  });

  if (error) {
   errorMsg = error.message;
  } else {
   // Success: The session update will automatically trigger the redirect 
   // via your +page.server.ts file.
   await invalidate('supabase:auth');
   console.log("Sign In successful. Session updated, redirecting...");
  }
  
  // Always reset password field on failure
  if (errorMsg) {
   password = '';
  }

  isLoading = false;
 }
</script>

<main>
 <h2>Pager System</h2>

 <form on:submit|preventDefault={handleSignIn}>
  <div class="field">
   <label for="email">Email</label>
   <input
    id="email"
    type="email"
    placeholder="you@example.com"
    bind:value={email}
    required
    disabled={isLoading}
   />
  </div>

  <div class="field">
   <label for="password">Password</label>
   <input
    id="password"
    type="password"
    placeholder="••••••••"
    bind:value={password}
    required
    disabled={isLoading}
   />
  </div>

    <button type="submit" disabled={isLoading}>
   {isLoading ? 'Processing…' : 'Sign In'}
  </button>

    <button 
   type="button" 
   class="secondary" 
   on:click={handleSignUp} 
   disabled={isLoading}
  >
   Create New Account
  </button>
 </form>

 {#if errorMsg}
  <p class="error" role="alert">{errorMsg}</p>
 {/if}

 <div class="footer-note">
  <p>Secure Pager Access Terminal v2.0</p>
 </div>
</main>

<style>
/* (Your existing CSS goes here) */
 main {
  max-width: 400px;
  margin: 60px auto;
  padding: 24px;
  border: 3px solid #4527a0;
  border-radius: 12px;
  background: #f3e5f5;
  font-family: 'Courier New', monospace;
  color: #222;
  box-shadow: 10px 10px 0px #4527a0;
 }
 h2 {
  text-align: center;
  color: #673ab7;
  text-transform: uppercase;
  letter-spacing: 2px;
 }
 .field {
  display: flex;
  flex-direction: column;
  margin-bottom: 15px;
 }
 .field label {
  font-weight: bold;
  margin-bottom: 5px;
  color: #4527a0;
 }
 .field input {
  padding: 10px;
  border: 2px solid #4527a0;
  border-radius: 0px; 
  background: #fff;
 }
 button {
  padding: 12px;
  background: #ff8a65;
  border: 2px solid #4527a0;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
  width: 100%;
  text-transform: uppercase;
 }
 button:hover:not(:disabled) {
  background: #f4511e;
  transform: translate(-2px, -2px);
  box-shadow: 2px 2px 0px #4527a0;
 }
 button.secondary {
  background: #9575cd;
  font-size: 0.8rem;
 }
 button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
 }
 .error {
  background: #ffcdd2;
  border: 1px solid #b71c1c;
  color: #b71c1c;
  padding: 8px;
  text-align: center;
  margin-top: 15px;
  font-size: 13px;
 }
 .footer-note {
  text-align: center;
  margin-top: 20px;
  font-size: 10px;
  color: #777;
 }
</style>