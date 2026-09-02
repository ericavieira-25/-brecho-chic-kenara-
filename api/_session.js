import crypto from 'node:crypto';

const SESSION_COOKIE = 'kenara_user_session';
const ADMIN_COOKIE = 'kenara_admin_session';
const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

function secret() {
  return process.env.AUTH_SECRET || 'development-only-change-me';
}

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf('=');
        return [cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim()];
      })
  );
}

export function createSession(user) {
  const payload = encode({
    id: user.id,
    email: user.email,
    role: user.role,
    supplierId: user.supplierId || null,
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  });

  return `${payload}.${sign(payload)}`;
}

export function readSession(req) {
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[SESSION_COOKIE] || cookies[ADMIN_COOKIE];
  const [payload, signature] = (token || '').split('.');

  if (!payload || !signature) return null;

  const expected = sign(payload);
  if (
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    return null;
  }

  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString());
    return claims.exp > Math.floor(Date.now() / 1000) ? claims : null;
  } catch {
    return null;
  }
}

export function setSessionCookies(res, user) {
  const token = createSession(user);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  const cookies = [
    `${SESSION_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${secure}`,
  ];

  if (user.role === 'administradora') {
    const csrfToken = crypto.randomBytes(32).toString('base64url');
    cookies.push(
      `${ADMIN_COOKIE}=${token}; HttpOnly; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${secure}`,
      `kenara_csrf=${csrfToken}; Path=/; Max-Age=${SESSION_MAX_AGE}; SameSite=Lax${secure}`
    );
  }

  res.setHeader('Set-Cookie', cookies);
}

export function clearSessionCookies(res) {
  res.setHeader('Set-Cookie', [
    `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    `${ADMIN_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`,
    'kenara_csrf=; Path=/; Max-Age=0; SameSite=Lax',
  ]);
}
