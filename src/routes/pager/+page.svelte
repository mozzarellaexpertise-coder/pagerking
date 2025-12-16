<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { goto } from '$app/navigation';
import { getSupabaseClient } from '$lib/supabaseClient';
import { fly } from 'svelte/transition';
import type { User } from '@supabase/supabase-js';

// --- Supabase client (browser-only) ---
let supabase = getSupabaseClient();
let currentUser: User | null = null;

// --- State ---
let users: any[] = [];
let messages: any[] = [];
let selectedContactId: string | null = null;
let selectedContactName: string = 'Select Contact';
let newMessage: string = '';
let isLoading = false;
let errorMsg = '';

let alertAudio: HTMLAudioElement;
let isAlerting = false;
let showAudioUnlockPrompt = false;
let audioUnlocked = false;

// --- Lifecycle ---
onMount(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    currentUser = user;

    if (!currentUser) {
        goto('/login');
        return;
    }

    alertAudio = new Audio('/beep2.mp3');
    alertAudio.loop = true;

    const testAudio = new Audio();
    testAudio.play()
        .then(() => audioUnlocked = true)
        .catch(() => showAudioUnlockPrompt = true);

    await loadUsers();
    setupRealtime();
});

onDestroy(() => {
    supabase.removeAllChannels();
    stopAlert();
});

// --- Load users ---
async function loadUsers() {
    if (!currentUser) return;
    isLoading = true;

    const { data: userData, error } = await supabase
        .from('users')
        .select('id,email')
        .not('id','eq',currentUser.id)
        .limit(10);

    if (error) { console.error(error); errorMsg='Failed to load contacts'; }
    else if (userData) {
        users = userData;
        if(users.length>0) {
            selectedContactId = users[0].id;
            selectedContactName = users[0].email;
            await loadMessages();
        }
    }
    isLoading = false;
}

// --- Load last message ---
async function loadMessages() {
    if (!currentUser || !selectedContactId) { messages = []; return; }
    isLoading = true;

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${currentUser.id})`)
        .order('created_at',{ascending:false})
        .limit(1);

    if(error){ console.error(error); errorMsg='Failed to load messages'; }
    else messages = data.reverse();

    isLoading=false;
    scrollToBottom();
}

// --- Send message ---
async function sendMessage() {
    if (!currentUser || !selectedContactId || newMessage.trim()==='') return;
    const msg = newMessage.trim();
    newMessage=''; errorMsg='';

    const { data: inserted, error } = await supabase
        .from('messages')
        .insert({ sender_id: currentUser.id, receiver_id: selectedContactId, text: msg })
        .select().single();

    if(error){ console.error(error); errorMsg='Failed to send message'; newMessage=msg; return; }

    await supabase
        .from('messages')
        .delete()
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${currentUser.id})`)
        .not('id','eq',inserted.id);

    scrollToBottom();
}

// --- Realtime subscription ---
function setupRealtime() {
    supabase.channel('messages')
    .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'}, payload=>{
        const m = payload.new;
        if((m.sender_id===currentUser?.id && m.receiver_id===selectedContactId) ||
           (m.sender_id===selectedContactId && m.receiver_id===currentUser?.id)) {
            messages = [m];
        }
        if(m.receiver_id===currentUser?.id) startAlert(m.text);

        scrollToBottom();
    })
    .subscribe();
}

// --- Alerts ---
function startAlert(content: string){
    if(isAlerting || !audioUnlocked) return;
    isAlerting = true;
    alertAudio.play();
    console.log(`PAGER ALERT: ${content}`);
}

function stopAlert(){
    if(!isAlerting) return;
    isAlerting=false;
    alertAudio.pause();
    alertAudio.currentTime=0;
}

function unlockAudio(){
    if(audioUnlocked) return;
    const silent = new Audio();
    silent.volume=0;
    silent.play().then(()=>{audioUnlocked=true; showAudioUnlockPrompt=false;}).catch(err=>console.error(err));
}

async function markAsRead(messageId: string){
    await supabase.from('messages').update({read:true}).eq('id',messageId);
    stopAlert();
}

function scrollToBottom(){
    setTimeout(()=>{
        const c = document.getElementById('msgContainer');
        if(c) c.scrollTop = c.scrollHeight;
    },50);
}
</script>

<svelte:head>
    <title>Pager King 🦏</title>
</svelte:head>

<main class="pager-container" on:click={unlockAudio}>
    {#if showAudioUnlockPrompt}
    <div class="audio-prompt" transition:fly={{y:-50,duration:500}}>
        <p>Tap anywhere to enable pager sound alerts.</p>
    </div>
    {/if}

    <div class="rhino-header">
        <span>🦏 PAGER KING</span>
    </div>

    <div class="header">
        <div class="user-info">
            Logged in as: <strong>{currentUser?.email ?? 'Unknown User'}</strong>
            <button class="logout-button" on:click={async ()=>{await supabase.auth.signOut(); goto('/login')}}>Logout</button>
        </div>
    </div>

    <div class="control-group">
        <label for="contact-select">Contact:</label>
        <select id="contact-select" bind:value={selectedContactId} on:change={()=>{
            selectedContactName = users.find(u=>u.id===selectedContactId)?.email || 'Select Contact';
            loadMessages();
        }}>
            <option value={null} disabled>--- Select Contact ---</option>
            {#each users.filter(u=>u.id!==currentUser?.id) as u}
                <option value={u.id}>{u.email}</option>
            {/each}
        </select>
    </div>

    <div id="msgContainer" class="msg-container" class:alerting={isAlerting} on:click={stopAlert}>
        {#if isLoading}<p class="loading-state">Loading messages...</p>
        {:else if !selectedContactId}<p class="placeholder-state">Select a contact to start paging.</p>
        {:else if messages.length===0}<p class="placeholder-state">No messages yet. Send a page!</p>
        {:else}
            {#each messages as m (m.id)}
                <div class="message-entry {m.sender_id===currentUser?.id?'out':'in'}" on:introend={()=>{if(m.receiver_id===currentUser?.id&&!m.read) markAsRead(m.id)}}>
                    <span class="message-content">{m.text}</span>
                    <span class="timestamp">{new Date(m.created_at).toLocaleTimeString()}</span>
                </div>
            {/each}
        {/if}
    </div>

    <form on:submit|preventDefault={sendMessage} class="send-form">
        <input type="text" bind:value={newMessage} placeholder="Type your page message..." disabled={!selectedContactId} required/>
        <button type="submit" disabled={!selectedContactId||newMessage.trim()===''}>Send Page</button>
    </form>

    {#if errorMsg}<p class="error-message">{errorMsg}</p>{/if}
</main>

<style>
/* Keep your existing styles */
</style>