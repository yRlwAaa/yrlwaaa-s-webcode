import { verifyPassword, createToken } from '../../_lib/auth.js';

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

    const user = await env.DB.prepare('SELECT * FROM users WHERE email = ?').bind(email).first();
    if (!user) return json({ error: '邮箱或密码错误' }, 401);

    const ok = await verifyPassword(password, user.password_hash);
    if (!ok) return json({ error: '邮箱或密码错误' }, 401);

    const token = await createToken(env.DB, user.id);
    return json({
      ok: true,
      token,
      user: { id: user.id, email: user.email, nickname: user.nickname, role: user.role },
    });
  } catch (e) {
    return json({ error: '登录失败：' + e.message }, 500);
  }
}