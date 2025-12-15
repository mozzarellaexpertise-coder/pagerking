<script lang="ts">
import { onMount, onDestroy } from 'svelte';
import { getSupabaseClient } from '$lib/supabaseClient';
import type { User } from '@supabase/supabase-js';
import type { PageData } from './$types';

const supabase = getSupabaseClient();
export let data: PageData;
let currentUser: User | null = data.session?.user ?? null;

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

onMount(() => {
    alertAudio = new Audio('/beep2.mp3');
    alertAudio.loop = true;

    if (typeof window !== 'undefined') {
        new Audio().play().then(()=>audioUnlocked=true).catch(()=>showAudioUnlockPrompt=true);
    }

    loadUsers();
    setupRealtime();
    if (selectedContactId) loadMessages();
});

onDestroy(() => { supabase.removeAllChannels(); stopAlert(); });

async function loadUsers() {
    if (!currentUser) return;
    isLoading = true;
    const { data: userData, error } = await supabase
        .from('users')
        .select('id,email')
        .not('id','eq',currentUser.id)
        .limit(10);
    if (error) { console.error(error); errorMsg='Failed to load contacts'; }
    else { users = userData || []; if(users.length>0){selectedContactId=users[0].id;selectedContactName=users[0].email;loadMessages();} }
    isLoading = false;
}

async function loadMessages() {
    if(!currentUser||!selectedContactId){ messages=[]; return; }
    isLoading=true; messages=[];
    const { data: messageData, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${selectedContactId}),and(sender_id.eq.${selectedContactId},receiver_id.eq.${currentUser.id})`)
        .order('created_at',{ascending:true});
    if(error){ console.error(error); errorMsg='Failed to load messages'; }
    else { messages=messageData||[]; scrollToBottom(); }
    isLoading=false;
}

async function sendMessage() {
    if(!currentUser||!selectedContactId||newMessage.trim()==='') return;
    const messageToSend = newMessage.trim();
    newMessage=''; errorMsg='';

    // Ensure sender exists
    const { data: senderExists } = await supabase.from('users').select('id').eq('id',currentUser.id).single();
    if(!senderExists) await supabase.from('users').insert({id:currentUser.id,username:currentUser.email.split('@')[0],email:currentUser.email});

    // Ensure receiver exists
    const { data: receiverExists } = await supabase.from('users').select('id').eq('id',selectedContactId).single();
    if(!receiverExists) await supabase.from('users').insert({id:selectedContactId,username:selectedContactName,email:`${selectedContactName}@example.com`});

    const { error } = await supabase.from('messages').insert({sender_id:currentUser.id,receiver_id:selectedContactId,text:messageToSend});
    if(error){ console.error(error); errorMsg='Failed to send message'; newMessage=messageToSend; }
}

function setupRealtime() {
    supabase.channel('messages').on('postgres_changes',{event:'INSERT',schema:'public',table:'messages'},payload=>{
        const newMsg=payload.new;
        if((newMsg.sender_id===currentUser?.id && newMsg.receiver_id===selectedContactId)||
           (newMsg.sender_id===selectedContactId && newMsg.receiver_id===currentUser?.id)){
            messages=[...messages,newMsg]; scrollToBottom();
        }
        if(newMsg.receiver_id===currentUser?.id) startAlert(newMsg.text);
    }).subscribe();
}

function startAlert(content:string){ if(isAlerting||!audioUnlocked) return; isAlerting=true; alertAudio.play(); console.log(`PAGER ALERT from ${content.substring(0,20)}...`);}
function stopAlert(){ if(!isAlerting) return; isAlerting=false; alertAudio.pause(); alertAudio.currentTime=0;}
function unlockAudio(){ if(audioUnlocked) return; const s=new Audio(); s.volume=0; s.play().then(()=>{audioUnlocked=true; showAudioUnlockPrompt=false;}).catch(console.error);}
function scrollToBottom(){ setTimeout(()=>{const c=document.getElementById('msgContainer'); if(c)c.scrollTop=c.scrollHeight; },100);}
</script>

<main on:click={unlockAudio}>
{#if showAudioUnlockPrompt}<div class="audio-prompt">Tap to enable pager sound</div>{/if}

<div class="header">
<h1>📟 Pager King</h1>
<div class="user-info">
Logged in as: <strong>{currentUser?.email}</strong>
<button on:click={()=>supabase.auth.signOut()}>Logout</button>
</div>
</div>

<div class="control-group">
<label>Contact:</label>
<select bind:value={selectedContactId} on:change={()=>{selectedContactName=users.find(u=>u.id===selectedContactId)?.email||'Select Contact'; loadMessages();}}>
<option value={null} disabled>--- Select Contact ---</option>
{#each users as u}<option value={u.id}>{u.email}</option>{/each}
</select>
</div>

<div id="msgContainer" class="msg-container" on:click={stopAlert}>
{#if isLoading}<p class="loading-state">Loading messages...</p>
{:else if !selectedContactId}<p class="placeholder-state">Select a contact.</p>
{:else if messages.length===0}<p class="placeholder-state">No messages yet.</p>
{:else}
{#each messages as m (m.id)}
<div class="message-entry {m.sender_id===currentUser?.id?'out':'in'}">
<span>{m.text}</span>
<span class="timestamp">{new Date(m.created_at).toLocaleTimeString()}</span>
</div>
{/each}
{/if}
</div>

<form on:submit|preventDefault={sendMessage}>
<input type="text" bind:value={newMessage} placeholder="Type your message" disabled={!selectedContactId} required/>
<button type="submit" disabled={!selectedContactId || newMessage.trim()===''}>Send Page</button>
</form>

{#if errorMsg}<p class="error-message">{errorMsg}</p>{/if}
</main>

<style>
/* Simplified CSS for brevity; you can paste your existing styles here */
.pager-container {max-width:600px;margin:20px auto;padding:20px;display:flex;flex-direction:column;gap:15px;font-family:monospace;}
.header{display:flex;justify-content:space-between;align-items:center;}
.msg-container{height:350px;overflow-y:auto;border:1px solid #ddd;padding:10px;border-radius:4px;display:flex;flex-direction:column;gap:8px;background:#f9f9f9;}
.message-entry.in{align-self:flex-start;background:#e1ffc7;padding:8px 12px;border-radius:18px;}
.message-entry.out{align-self:flex-end;background:#d1eaff;padding:8px 12px;border-radius:18px;}
.send-form{display:flex;gap:10px;}
.send-form input{flex-grow:1;padding:10px;}
.send-form button{padding:10px 15px;}
.error-message{color:red;text-align:center;margin-top:10px;}
.audio-prompt{background:#ffeb3b;padding:10px;text-align:center;font-weight:bold;margin-bottom:10px;}
</style>