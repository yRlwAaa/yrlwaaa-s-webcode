import { getUserByToken } from '../../_lib/auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const user = await getUserByToken(env.DB, token);
  if (!user) return json({ error: '请先登录' }, 401);

  const rows = await env.DB.prepare(
    'SELECT id, title FROM sessions WHERE user_id = ? ORDER BY updated_at DESC LIMIT 100'
  ).bind(user.id).all();
  return json(rows.results || []);
}