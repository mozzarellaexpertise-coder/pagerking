// src/routes/+server.ts
import { json } from '@sveltejs/kit';

export const GET = () => {
  return json({
    status: 'ok',
    service: 'PagerKing API',
    time: new Date().toISOString()
  });
};