import crypto from 'node:crypto';

function encode(value) {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function sign(payload) {
  return crypto
    .createHmac('sha256', process.env.AUTH_SECRET)
    .update(payload)
    .digest('base64url');
}

export default function handler(req, res) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', [
      'kenara_admin_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax',
      'kenara_csrf=; Path=/; Max-Age=0; SameSite=Lax',
    ]);
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }

  const { email, password } = req.body || {};
  const configuredEmail = process.env.ADMIN_EMAIL;
  const configuredPassword = process.env.ADMIN_PASSWORD;

  if (!process.env.AUTH_SECRET || !configuredEmail || !configuredPassword) {
    return res.status(500).json({ erro: 'Autenticação não configurada.' });
  }

  if (email !== configuredEmail || password !== configuredPassword) {
    return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
  }

  const payload = encode({
    role: 'administradora',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8,
  });

  const token = `${payload}.${sign(payload)}`;
  const csrfToken = crypto.randomBytes(32).toString('base64url');
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    [
      `kenara_admin_session=${token}; HttpOnly; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax${secure}`,
      `kenara_csrf=${csrfToken}; Path=/; Max-Age=${60 * 60 * 8}; SameSite=Lax${secure}`,
    ]
  );
  return res.status(200).json({ autenticado: true });
}
