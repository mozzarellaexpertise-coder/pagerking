<script lang="ts">
    import { onMount, onDestroy } from 'svelte';
    import { getSupabaseClient } from '$lib/supabaseClient';
    import { fly } from 'svelte/transition';
    import type { User } from '@supabase/supabase-js';
    import type { PageData } from './$types';

    // Props passed from +layout.server.ts via +layout.ts
    const supabase = getSupabaseClient();
    export let data: PageData;
    let currentUser: User | null = data.session?.user ?? null;

    // --- State Variables ---
    let users: any[] = []; // List of all users/contacts
    let messages: any[] = []; // Messages between current user and selected contact
    let selectedContactId: string | null = null;
    let selectedContactName: string = 'Select Contact';
    let newMessage: string = '';
    let isLoading: boolean = false;
    let errorMsg: string = '';
    let alertAudio: HTMLAudioElement;

    // --- Audio Control State ---
    let isAlerting: boolean = false;
    let showAudioUnlockPrompt: boolean = false;
    let audioUnlocked: boolean = false;


    // --- Lifecycle and Initialization ---

    onMount(() => {
        // 1. Initialize Audio Element for the 'Beep'
        alertAudio = new Audio('/beep2.mp3'); // Assumes you have a file at static/pager-beep.mp3
        alertAudio.loop = true;
        
        // Check if audio needs unlocking (for mobile/Chrome autoplay policy)
        if (typeof window !== 'undefined') {
            const testAudio = new Audio();
            testAudio.play().then(() => {
                audioUnlocked = true;
            }).catch(() => {
                showAudioUnlockPrompt = true;
            });
        }

        // 2. Load all possible contacts
        loadUsers();

        // 3. Set up the Realtime Subscription
        setupRealtime();

        // 4. Load initial messages if a contact is already selected (e.g., from a deep link)
        if (selectedContactId) {
            loadMessages();
        }
    });

    onDestroy(() => {
        // Clean up the Supabase Realtime subscription when leaving the page
        supabase.removeAllChannels();
        stopAlert();
    });

    // --- Data Loading Functions ---

    async function loadUsers() {
        if (!currentUser) return;
        isLoading = true;
        
        // Fetch all users from the public.users table (or auth.users if RLS allows)
        const { data: userData, error } = await supabase
            .from('users')
            .select('id, email')
            .not('id', 'eq', currentUser.id) // Exclude the current user from the contact list
            .limit(10); // Limit to a manageable number

        if (error) {
            console.error('Error loading users:', error);
            errorMsg = 'Failed to load contacts.';
        } else if (userData) {
            users = userData;
            // Optionally auto-select the first contact for immediate interaction
            if (users.length > 0) {
                 selectedContactId = users[0].id;
                 selectedContactName = users[0].email;
                 loadMessages();
            }
        }
        isLoading = false;
    }

    async function loadMessages() {
        if (!currentUser || !selectedContactId) {
            messages = [];
            return;
        }

        isLoading = true;
        messages = []; // Clear previous messages

        // Fetch messages where sender/receiver match either direction
        const { data: messageData, error } = await supabase
            .from('messages')
            .select('*')
            .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${currentUser.id})`)
            .order('created_at', { ascending: true });
            
        if (error) {
            console.error('Error loading messages:', error);
            errorMsg = 'Failed to load messages.';
        } else if (messageData) {
            messages = messageData;
            scrollToBottom();
        }
        isLoading = false;
    }

    // --- Messaging Functions ---

    async function sendMessage() {
        if (!currentUser || !selectedContactId || newMessage.trim() === '') return;

        const messageToSend = newMessage.trim();
        newMessage = ''; // Clear input immediately for better UX
        errorMsg = '';

        const { error } = await supabase
            .from('messages')
            .insert({
                sender_id: currentUser.id,
                receiver_id: selectedContactId,
                content: messageToSend,
            });

        if (error) {
            console.error('Error sending message:', error);
            errorMsg = 'Failed to send message.';
            // Revert the input field content
            newMessage = messageToSend; 
        }
        // No need to manually update `messages` array here, 
        // as the Realtime listener handles the insertion/update!
    }

    // --- Realtime / Beeping Functions ---

    function setupRealtime() {
        // 1. Subscribe to the 'messages' table
        supabase
            .channel('messages')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'messages' },
                (payload) => {
                    const newMsg = payload.new as any;
                    
                    // 2. Add the new message to the display if it involves the current user and selected contact
                    if (
                        (newMsg.sender_id === currentUser?.id && newMsg.receiver_id === selectedContactId) || 
                        (newMsg.sender_id === selectedContactId && newMsg.receiver_id === currentUser?.id)
                    ) {
                        messages = [...messages, newMsg];
                        scrollToBottom();
                    }

                    // 3. Trigger alert only for incoming messages directed to the current user
                    if (newMsg.receiver_id === currentUser?.id) {
                        startAlert(newMsg.content); // Optionally show content in alert
                    }
                }
            )
            .subscribe();
    }

    function startAlert(content: string) {
        if (isAlerting || !audioUnlocked) return;
        isAlerting = true;
        alertAudio.play();
        
        // Optional: Use a browser notification or a simple window alert for the message
        console.log(`PAGER ALERT from ${content.length > 20 ? content.substring(0, 20) + '...' : content}`);
    }

    function stopAlert() {
        if (!isAlerting) return;
        isAlerting = false;
        alertAudio.pause();
        alertAudio.currentTime = 0; // Reset beep audio
    }

    function unlockAudio() {
        if (audioUnlocked) return;
        // Attempt to play a silent sound on user interaction to unlock audio
        const silentAudio = new Audio(); 
        silentAudio.volume = 0;
        silentAudio.play().then(() => {
            audioUnlocked = true;
            showAudioUnlockPrompt = false;
        }).catch(err => {
            console.error("Audio unlock failed:", err);
        });
    }

    // --- Utility Functions ---

    function scrollToBottom() {
        // Use a slight delay to ensure the DOM has updated with the new message
        setTimeout(() => {
            const msgContainer = document.getElementById('msgContainer');
            if (msgContainer) {
                msgContainer.scrollTop = msgContainer.scrollHeight;
            }
        }, 100);
    }
</script>

<svelte:head>
    <title>Pager King</title>
</svelte:head>

<main class="pager-container" on:click={unlockAudio}>
    {#if showAudioUnlockPrompt}
        <div class="audio-prompt" transition:fly={{ y: -50, duration: 500 }}>
            <p>Tap anywhere to enable pager sound alerts.</p>
        </div>
    {/if}

    <div class="header">
        <h1>📟 Pager King</h1>
        <div class="user-info">
            Logged in as: <strong>{currentUser?.email ?? 'Unknown User'}</strong>
            <button class="logout-button" on:click={() => supabase.auth.signOut()}>Logout</button>
        </div>
    </div>

    <div class="control-group">
        <label for="contact-select">Contact:</label>
        <select 
            id="contact-select"
            bind:value={selectedContactId} 
            on:change={() => {
                selectedContactName = users.find(u => u.id === selectedContactId)?.email || 'Select Contact';
                loadMessages();
            }}
        >
            <option value={null} disabled>--- Select Contact ---</option>
            {#each users.filter(u => u.id !== currentUser?.id) as u}
                <option value={u.id}>{u.email}</option>
            {/each}
        </select>
    </div>

<div 
    id="msgContainer" 
    class="msg-container" 
    class:alerting={isAlerting} 
    on:click={stopAlert}
    role="button"              tabindex="0"               >
    </div>

        {#if isLoading}
            <p class="loading-state">Loading messages...</p>
        {:else if !selectedContactId}
            <p class="placeholder-state">Select a contact to start paging.</p>
        {:else if messages.length === 0}
            <p class="placeholder-state">No messages yet. Send a page!</p>
        {:else}
            {#each messages as m (m.id)}
                <div class="message-entry {m.sender_id === currentUser?.id ? 'out' : 'in'}">
                    <span class="message-content">{m.content}</span>
                    <span class="timestamp">
                        {new Date(m.created_at).toLocaleTimeString()}
                    </span>
                </div>
            {/each}
        {/if}
    
    <form on:submit|preventDefault={sendMessage} class="send-form">
        <input
            type="text"
            bind:value={newMessage}
            placeholder="Type your page message..."
            disabled={!selectedContactId}
            required
        />
        <button type="submit" disabled={!selectedContactId || newMessage.trim() === ''}>
            Send Page
        </button>
    </form>
    
    {#if errorMsg}
        <p class="error-message">{errorMsg}</p>
    {/if}
</main>

<style>
    .pager-container {
        max-width: 600px;
        margin: 20px auto;
        padding: 20px;
        border: 2px solid #ccc;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        display: flex;
        flex-direction: column;
        gap: 15px;
        font-family: monospace;
        position: relative;
    }

    .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-bottom: 1px solid #eee;
        padding-bottom: 10px;
    }

    .header h1 {
        font-size: 1.8em;
        margin: 0;
    }

    .user-info {
        font-size: 0.85em;
        color: #555;
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .logout-button {
        padding: 5px 10px;
        font-size: 0.8em;
        background-color: #f44336;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }
    
    .control-group {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    select {
        padding: 8px;
        border-radius: 4px;
        border: 1px solid #ccc;
        flex-grow: 1;
        font-family: inherit;
    }

    .msg-container {
        height: 350px;
        overflow-y: auto;
        border: 1px solid #ddd;
        padding: 10px;
        border-radius: 4px;
        display: flex;
        flex-direction: column;
        gap: 8px;
        background-color: #f9f9f9;
        transition: background-color 0.5s;
    }
    
    .msg-container.alerting {
        /* Flashing effect when alert is active */
        background-color: #ffe0b2; 
        border-color: #ff9800;
        cursor: pointer; /* Indicate clicking stops the alert */
        animation: flash-border 1s infinite alternate;
    }

    @keyframes flash-border {
        from { border-color: #ff9800; }
        to { border-color: #f44336; }
    }

    .message-entry {
        max-width: 80%;
        padding: 8px 12px;
        border-radius: 18px;
        line-height: 1.4;
        font-size: 0.9em;
        position: relative;
        display: flex;
        flex-direction: column;
    }

    .message-entry.in {
        align-self: flex-start;
        background-color: #e1ffc7; /* Light green for incoming */
        border-bottom-left-radius: 4px;
    }

    .message-entry.out {
        align-self: flex-end;
        background-color: #d1eaff; /* Light blue for outgoing */
        border-bottom-right-radius: 4px;
    }

    .timestamp {
        font-size: 0.7em;
        color: #777;
        margin-top: 2px;
        text-align: right;
    }

    .message-entry.in .timestamp {
        text-align: left;
    }

    .send-form {
        display: flex;
        gap: 10px;
    }

    .send-form input[type="text"] {
        flex-grow: 1;
        padding: 10px;
        border: 1px solid #ccc;
        border-radius: 4px;
        font-family: inherit;
    }

    .send-form button {
        padding: 10px 15px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
    }

    .send-form button:disabled {
        background-color: #a0c9f1;
        cursor: not-allowed;
    }
    
    .loading-state, .placeholder-state {
        text-align: center;
        color: #777;
        margin-top: 50px;
    }
    
    .audio-prompt {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        padding: 20px;
        background: #ffeb3b;
        color: #333;
        text-align: center;
        cursor: pointer;
        font-weight: bold;
        z-index: 10;
        border-top-left-radius: 8px;
        border-top-right-radius: 8px;
    }
</style>