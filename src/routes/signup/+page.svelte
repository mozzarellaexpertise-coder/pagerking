<script lang="ts">
    import { onMount } from 'svelte';
    import type { PageData } from './$types'; // For the type of the page's data prop

    // 1. Get Supabase client from the layout data
    export let data: PageData;
    $: ({ supabase } = data); 

    let email = '';
    let password = '';
    let userName = ''; 
    let loading = false;
    let successMessage: string | null = null; // Use success message instead of redirecting
    let errorMessage: string | null = null;

    async function handleSignup() {
        loading = true;
        errorMessage = null;
        successMessage = null;

        const { error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                // CRITICAL FIX: Tells Supabase where to send the user for confirmation
                emailRedirectTo: `${window.location.origin}/auth/callback`,
                data: {
                    user_name: userName,
                },
            },
        });

        if (error) {
            errorMessage = error.message;
        } else {
            // CORRECT SUCCESS FLOW: Show a message; DO NOT immediately redirect.
            // The user is not yet logged in until they click the confirmation link.
            successMessage = "Success! Please check your email to confirm your account before logging in.";
            email = '';
            password = '';
            userName = '';
        }

        loading = false;
    }
</script>

<div class="signup-container">
    <h2>Create Pager Account</h2>
    
    <form on:submit|preventDefault={handleSignup}>
        <input
            type="text"
            placeholder="Your Name (e.g., Bob)"
            bind:value={userName}
            required
            disabled={loading}
        />
        
        <input
            type="email"
            placeholder="Your Email"
            bind:value={email}
            required
            disabled={loading}
        />
        
        <input
            type="password"
            placeholder="Password"
            bind:value={password}
            required
            disabled={loading}
        />
        
        <button type="submit" disabled={loading}>
            {#if loading}
                Processing...
            {:else}
                Sign Up
            {/if}
        </button>
    </form>
    
    {#if successMessage}
        <p class="success-message">{successMessage}</p>
    {/if}

    {#if errorMessage}
        <p class="error-message">{errorMessage}</p>
    {/if}
    
    <p>
        Already have an account? <a href="/login">Log In</a>
    </p>
</div>

<style>
    /* ... (Your original styles go here) ... */
    .signup-container {
        max-width: 400px;
        margin: 50px auto;
        padding: 20px;
        border: 1px solid #ccc;
        border-radius: 8px;
        text-align: center;
    }
    input, button {
        width: 100%;
        padding: 10px;
        margin-bottom: 10px;
        box-sizing: border-box;
    }
    .error-message {
        color: red;
    }
    .success-message {
        color: green;
        background-color: #e6ffe6;
        padding: 10px;
        border-radius: 4px;
        margin-top: 15px;
    }
</style>