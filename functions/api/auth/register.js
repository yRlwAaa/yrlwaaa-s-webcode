import { hashPassword, createToken } from '../../_lib/auth.js';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;
  try {
    const body = await request.json();
    const email = String(body.email || '').trim().toLowerCase();
    const password = String(body.password || '');
    const nickname = String(body.nickname || '').trim() || email.split('@')[0];

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return json({ error: '邮箱格式不正确' }, 400);
    }
    if (password.length < 6) {
      return json({ error: '密码至少 6 位' }, 400);
    }

    const existing = await env.DB.prepare('SELECT id FROM users WHERE email = ?').bind(email).first();
    if (existing) return json({ error: '该邮箱已注册' }, 409);

    const id = crypto.randomUUID();
    const now = Date.now();
    const passwordHash = await hashPassword(password);

    await env.DB.prepare(
      'INSERT INTO users (id, email, password_hash, role, nickname, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).bind(id, email, passwordHash, 'user', nickname, now, now).run();

    const token = await createToken(env.DB, id);
    return json({ ok: true, token, user: { id, email, nickname, role: 'user' } });
  } catch (e) {
    return json({ error: '注册失败：' + e.message }, 500);
  }
}