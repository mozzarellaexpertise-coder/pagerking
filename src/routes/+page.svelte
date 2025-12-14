<script lang="ts">
import { onMount, tick, onDestroy } from 'svelte';
import type { Database } from '$lib/types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

// Get supabase and session from the layout loader
export let data;
$: ({ supabase, session } = data);

type User = Database['public']['Tables']['users']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];
type MessageWithUsername = Message & { sender_username: string | null };

let users: User[] = [];
let currentUser: any = null;
let selectedContactId: string | null = null;
let messages: MessageWithUsername[] = [];
let newMessage = '';
let realtimeChannel: RealtimeChannel | null = null;

// --- Audio ---
const beepFiles = ['/beep1.mp3','/beep2.mp3','/beep3.mp3','/Pager.wav'];
let preferredBeep = beepFiles[0];
let beep: HTMLAudioElement | null = null;
let isAudioUnlocked = false;
let showAudioUnlockPrompt = true;

$: preferredBeep, createAudio();

function createAudio() {
    if (beep) { beep.pause(); }
    if (typeof window !== 'undefined') {
        beep = new Audio(preferredBeep);
    }
}

async function unlockAudio() {
    if (isAudioUnlocked || !beep) return;
    try {
        await beep.play();
        beep.pause();
        isAudioUnlocked = true;
        showAudioUnlockPrompt = false;
    } catch(e) { console.error(e); }
}

function startAlert() {
    if (!isAudioUnlocked || !beep) return;
    beep.loop = true;
    beep.play().catch(()=>{});
}

function stopAlert() {
    if (beep) { beep.pause(); beep.loop = false; }
}

// --- Data Fetching ---
async function loadUsers() {
    const { data: userData } = await supabase.from('users').select('*').order('created_at');
    users = userData ?? [];
    if (!selectedContactId && currentUser) {
        selectedContactId = users.find(u => u.id !== currentUser.id)?.id ?? null;
    }
}

async function loadMessages() {
    if (!currentUser || !selectedContactId) return;
    const { data: msgData } = await supabase.from('messages')
        .select('*, sender:sender_id (username)')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${currentUser.id})`)
        .order('created_at',{ascending:false})
        .limit(50);

    messages = (msgData ?? []).map(m => ({
        ...m,
        sender_username: (m.sender as any)?.username ?? 'Unknown'
    })).reverse();
}

async function sendMessage() {
    if (!newMessage.trim() || !currentUser || !selectedContactId) return;
    const text = newMessage;
    newMessage = '';
    await supabase.rpc('send_pager_message', {
        p_sender_id: currentUser.id,
        p_receiver_id: selectedContactId,
        p_text: text
    });
    loadMessages().then(() => tick().then(scrollToBottom));
}

function subscribeRealtime() {
    if (!currentUser) return;
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
    
    realtimeChannel = supabase.channel(`messages-updates`)
        .on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'}, payload => {
            const msg = payload.new as Message;
            if (msg.receiver_id === currentUser?.id) startAlert();
            loadMessages().then(() => tick().then(scrollToBottom));
        }).subscribe();
}

function scrollToBottom() {
    const container = document.getElementById('msgContainer');
    if (container) container.scrollTop = container.scrollHeight;
}

// Reactive Sync
$: if (session?.user) {
    currentUser = { id: session.user.id, username: session.user.email };
    loadUsers();
    loadMessages();
    subscribeRealtime();
}

onMount(() => {
    window.addEventListener('click', unlockAudio, {once:true});
});

onDestroy(() => {
    if (realtimeChannel) supabase.removeChannel(realtimeChannel);
});
</script>

<main class="pager-container" on:click={unlockAudio}>
    {#if showAudioUnlockPrompt}
        <div class="audio-prompt">
            <p>🌈 Tap to enable sound</p>
        </div>
    {/if}

    <div class="control-group">
        <label>Contact:</label>
        <select bind:value={selectedContactId} on:change={loadMessages}>
            {#each users.filter(u => u.id !== currentUser?.id) as u}
                <option value={u.id}>{u.username}</option>
            {/each}
        </select>
    </div>

    <div id="msgContainer" class="msg-container" on:click={stopAlert}>
        {#each messages as m (m.id)}
            <div class="message-entry {m.sender_id === currentUser?.id ? 'out' : 'in'}">
                <span class="message-text">{m.text}</span>
            </div>
        {/each}
    </div>

    <div class="input-send-group">
        <input type="text" bind:value={newMessage} on:keydown={(e)=>e.key==='Enter' && sendMessage()}/>
        <button on:click={sendMessage}>Send</button>
    </div>
</main>

<style>
    /* Use your existing CSS here */
    .pager-container { max-width: 400px; margin: auto; background: #673ab7; padding: 20px; border-radius: 15px; color: white; }
    .msg-container { height: 300px; overflow-y: auto; background: #f3e5f5; color: black; padding: 10px; border-radius: 5px; }
    .out { text-align: right; color: blue; }
    .in { text-align: left; color: red; }
</style>