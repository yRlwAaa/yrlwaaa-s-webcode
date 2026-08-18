import { getUserByToken } from '../../_lib/auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const user = await getUserByToken(env.DB, token);
  if (!user) return json({ error: '请先登录' }, 401);

  const id = decodeURIComponent(params.id || '');
  const session = await env.DB.prepare('SELECT id FROM sessions WHERE id = ? AND user_id = ?')
    .bind(id, user.id).first();
  if (!session) return json([]);

  const rows = await env.DB.prepare(
    'SELECT role, content FROM messages WHERE session_id = ? AND user_id = ? ORDER BY id ASC'
  ).bind(id, user.id).all();
  return json(rows.results || []);
}

export async function onRequestDelete(context) {
  const { request, env, params } = context;
  const token = (request.headers.get('Authorization') || '').replace(/^Bearer\s+/i, '');
  const user = await getUserByToken(env.DB, token);
  if (!user) return json({ error: '请先登录' }, 401);

  const id = decodeURIComponent(params.id || '');
  await env.DB.prepare('DELETE FROM messages WHERE session_id = ? AND user_id = ?').bind(id, user.id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE id = ? AND user_id = ?').bind(id, user.id).run();
  return json({ ok: true });
}