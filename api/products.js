import { Pool } from 'pg';

import crypto from 'node:crypto';
import { ensureProductsTable } from './_db.js';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

function requireAdmin(req, res) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim()];
  }));
  const [payload, signature] = (cookies.kenara_admin_session || '').split('.');
  const expectedSignature = payload && process.env.AUTH_SECRET
    ? crypto.createHmac('sha256', process.env.AUTH_SECRET).update(payload).digest('base64url')
    : '';
  let claims;
  try {
    claims = payload ? JSON.parse(Buffer.from(payload, 'base64url').toString()) : null;
  } catch {
    claims = null;
  }
  const signaturesMatch = signature && expectedSignature &&
    signature.length === expectedSignature.length &&
    crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  if (
    !payload ||
    !signature ||
    !expectedSignature ||
    !signaturesMatch ||
    claims?.role !== 'administradora' ||
    claims.exp <= Math.floor(Date.now() / 1000)
  ) {
    res.status(401).json({ erro: 'Acesso administrativo não autorizado.' });
    return false;
  }
  return true;
}

function requireCsrf(req, res) {
  const cookies = Object.fromEntries((req.headers.cookie || '').split(';').filter(Boolean).map((cookie) => {
    const separator = cookie.indexOf('=');
    return [cookie.slice(0, separator).trim(), cookie.slice(separator + 1).trim()];
  }));
  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = cookies.kenara_csrf;
  const valid = typeof headerToken === 'string' &&
    typeof cookieToken === 'string' &&
    headerToken.length === cookieToken.length &&
    crypto.timingSafeEqual(Buffer.from(headerToken), Buffer.from(cookieToken));
  if (!valid) {
    res.status(403).json({ erro: 'Token CSRF inválido ou ausente.' });
    return false;
  }
  return true;
}

function validateProduct(body) {
  if (!body || !String(body.name || '').trim()) {
    return 'Nome é obrigatório.';
  }
  if (!Number.isFinite(Number(body.price)) || Number(body.price) < 0) {
    return 'Preço deve ser um número maior ou igual a zero.';
  }
  return null;
}

export default async function handler(req, res) {
  try {
    await ensureProductsTable();

    // GET /api/products
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM products ORDER BY id DESC'
      );

      return res.status(200).json(result.rows);
    }

    // POST /api/products
    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;
      if (!requireCsrf(req, res)) return;
      const {
        name,
        category,
        categoryName,
        size,
        condition,
        conditionLabel,
        price,
        originalPrice,
        brand,
        description,
        photo,
        supplierId,
        supplierName,
        createdBy,
        status,
      } = req.body;

      const validationError = validateProduct(req.body);
      if (validationError) return res.status(400).json({ erro: validationError });

      const result = await pool.query(
        `INSERT INTO products
        (
          name,
          category,
          category_name,
          size,
          condition,
          condition_label,
          price,
          original_price,
          brand,
          description,
          photo,
          supplier_id,
          supplier_name,
          created_by,
          status
        )
        VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9, $10,
          $11, $12, $13, $14, $15
        )
        RETURNING *`,
        [
          name,
          category || null,
          categoryName || null,
          size || null,
          condition || null,
          conditionLabel || null,
          price,
          originalPrice ?? null,
          brand || null,
          description || null,
          photo || null,
          supplierId || null,
          supplierName || null,
          createdBy || null,
          status || 'disponivel',
        ]
      );

      return res.status(201).json({
        mensagem: 'Produto cadastrado com sucesso!',
        produto: result.rows[0],
      });
    }

    // DELETE /api/products/:id
    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) return;
      if (!requireCsrf(req, res)) return;
      const id = Number(req.query.id);
      if (!Number.isInteger(id)) {
        return res.status(400).json({ erro: 'ID de produto inválido.' });
      }
      const result = await pool.query('DELETE FROM products WHERE id = $1 RETURNING id', [id]);
      if (result.rowCount === 0) return res.status(404).json({ erro: 'Produto não encontrado.' });
      return res.status(204).end();
    }

    return res.status(405).json({
      erro: 'Método não permitido.',
    });
  } catch (error) {
    console.error('Erro na API:', error);

    return res.status(500).json({
      erro: 'Erro interno ao processar a solicitação.',
    });
  }
}