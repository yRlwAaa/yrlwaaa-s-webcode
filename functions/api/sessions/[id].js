function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { env, params } = context;
  const id = decodeURIComponent(params.id || '');
  const rows = await env.DB.prepare(
    'SELECT role, content FROM messages WHERE session_id = ? ORDER BY id ASC'
  ).bind(id).all();
  return json(rows.results || []);
}

export async function onRequestDelete(context) {
  const { env, params } = context;
  const id = decodeURIComponent(params.id || '');
  await env.DB.prepare('DELETE FROM messages WHERE session_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id).run();
  return json({ ok: true });
}