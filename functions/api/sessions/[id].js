export async function onRequest(context) {
  const { request, env } = context;
  const { id } = context.params;

  if (request.method === 'GET') {
    const { results } = await env.DB.prepare(
      'SELECT role, content, created_at FROM messages WHERE session_id = ? ORDER BY id ASC'
    ).bind(id).all();
    return Response.json(results);
  }

  if (request.method === 'DELETE') {
    await env.DB.batch([
      env.DB.prepare('DELETE FROM messages WHERE session_id = ?').bind(id),
      env.DB.prepare('DELETE FROM sessions WHERE id = ?').bind(id),
    ]);
    return Response.json({ ok: true });
  }

  return new Response('Method not allowed', { status: 405 });
}