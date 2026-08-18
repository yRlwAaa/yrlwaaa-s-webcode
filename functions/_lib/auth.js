// 密码加密 / token 校验共用工具
const PBKDF2_ITERATIONS = 120000;
export const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 天

function bufferToHex(buf) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToBuffer(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < arr.length; i++) {
    arr[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return arr;
}

export async function hashPassword(password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    key,
    256
  );
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bufferToHex(salt.buffer)}:${bufferToHex(bits)}`;
}

export async function verifyPassword(password, stored) {
  try {
    const [scheme, iterStr, saltHex, hashHex] = stored.split(':');
    if (scheme !== 'pbkdf2') return false;
    const salt = hexToBuffer(saltHex);
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );
    const bits = await crypto.subtle.deriveBits(
      { name: 'PBKDF2', salt, iterations: parseInt(iterStr, 10), hash: 'SHA-256' },
      key,
      256
    );
    return bufferToHex(bits) === hashHex;
  } catch (e) {
    return false;
  }
}

function randomToken() {
  return bufferToHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

export async function createToken(db, userId) {
  const token = randomToken();
  const now = Date.now();
  await db.prepare(
    'INSERT INTO auth_tokens (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)'
  ).bind(token, userId, now + TOKEN_TTL_MS, now).run();
  return token;
}

export async function getUserByToken(db, token) {
  if (!token) return null;
  const row = await db.prepare(
    `SELECT u.id, u.email, u.role, u.nickname, u.created_at
     FROM auth_tokens t JOIN users u ON u.id = t.user_id
     WHERE t.token = ? AND t.expires_at > ?`
  ).bind(token, Date.now()).first();
  return row || null;
}

export async function deleteToken(db, token) {
  if (!token) return;
  await db.prepare('DELETE FROM auth_tokens WHERE token = ?').bind(token).run();
}