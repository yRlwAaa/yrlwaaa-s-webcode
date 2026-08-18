export async function onRequest(context) {
  const { request, env } = context;

  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  const { results } = await env.DB.prepare(
    'SELECT id, title, updated_at FROM sessions ORDER BY updated_at DESC LIMIT 100'
  ).all();

  return Response.json(results);
}