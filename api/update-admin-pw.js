/**
 * /api/update-admin-pw.js — rota TEMPORÁRIA, removida após uso
 * Atualiza a senha do admin@brecho.com
 * Requer header: x-admin-setup: kenara-setup-2025
 */
import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { getPool } from './_db.js';

const scrypt = promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const key = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${key.toString('hex')}`;
}

export default async function handler(req, res) {
  if (req.headers['x-admin-setup'] !== 'kenara-setup-2025') {
    return res.status(403).json({ erro: 'Não autorizado.' });
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' });
  }
  try {
    const hash = await hashPassword('kenara25@');
    const db = getPool();
    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email',
      [hash, 'admin@brecho.com']
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ erro: 'Usuário não encontrado.' });
    }
    return res.status(200).json({ ok: true, email: result.rows[0].email });
  } catch (e) {
    return res.status(500).json({ erro: e.message });
  }
}
