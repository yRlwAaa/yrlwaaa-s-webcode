function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  const rows = await env.DB.prepare(
    'SELECT id, title FROM sessions ORDER BY updated_at DESC LIMIT 100'
  ).all();
  return json(rows.results || []);
}