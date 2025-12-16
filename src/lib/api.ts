const BASE_URL = import.meta.env.VITE_API_URL;

export async function getMessages() {
  const res = await fetch(`${BASE_URL}/messages`);
  return res.json();
}

export async function sendMessage(sender_id: string, receiver_id: string, text: string) {
  const res = await fetch(`${BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sender_id, receiver_id, text })
  });
  return res.json();
}