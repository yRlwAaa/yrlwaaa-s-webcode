import { deleteToken } from '../../_lib/auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  await deleteToken(env.DB, token);
  return json({ ok: true });
}