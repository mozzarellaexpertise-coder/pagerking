import { json } from '@sveltejs/kit';

export function GET({ locals }) {
  if (!locals.user) {
    return json({ ok: false, user: null }, { status: 401 });
  }

  return json({
    ok: true,
    user: {
      id: locals.user.id,
      email: locals.user.email,
      name: locals.user.user_metadata?.name || locals.user.email
    }
  });
}