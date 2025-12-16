import { json } from '@sveltejs/kit';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

// OPTIONS preflight
export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

// GET health check
export async function GET() {
  return json(
    { status: 'ok', server: 'PagerKing' },
    { headers: CORS_HEADERS }
  );
}