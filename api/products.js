import crypto from 'node:crypto';
import { ensureProductsTable, getPool } from './_db.js';
import { readSession } from './_session.js';

function parseCookies(header = '') {
  return Object.fromEntries(
    header
      .split(';')
      .filter(Boolean)
      .map((cookie) => {
        const separator = cookie.indexOf('=');

        return [
          cookie.slice(0, separator).trim(),
          cookie.slice(separator + 1).trim(),
        ];
      })
  );
}

function requireAdmin(req, res) {
  if (readSession(req)?.role === 'administradora') return true;
  res.status(401).json({ erro: 'Acesso administrativo não autorizado.' });
  return false;
}

function requireCsrf(req, res) {
  const cookies = parseCookies(req.headers.cookie || '');

  const headerToken = req.headers['x-csrf-token'];
  const cookieToken = cookies.kenara_csrf;

  if (
    typeof headerToken !== 'string' ||
    typeof cookieToken !== 'string' ||
    !headerToken ||
    !cookieToken
  ) {
    res.status(403).json({
      erro: 'Token CSRF inválido ou ausente.',
    });

    return false;
  }

  const valid =
    Buffer.byteLength(headerToken) === Buffer.byteLength(cookieToken) &&
    crypto.timingSafeEqual(
      Buffer.from(headerToken),
      Buffer.from(cookieToken)
    );

  if (!valid) {
    res.status(403).json({
      erro: 'Token CSRF inválido ou ausente.',
    });

    return false;
  }

  return true;
}

function validateProduct(body) {
  if (body?.tags !== undefined && (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string'))) {
    return 'Tags devem ser uma lista de textos.';
  }
  if (!body || !String(body.name || '').trim()) {
    return 'Nome é obrigatório.';
  }

  if (
    !Number.isFinite(Number(body.price)) ||
    Number(body.price) < 0
  ) {
    return 'Preço deve ser um número maior ou igual a zero.';
  }

  if (
    body.originalPrice !== null &&
    body.originalPrice !== undefined &&
    body.originalPrice !== '' &&
    (
      !Number.isFinite(Number(body.originalPrice)) ||
      Number(body.originalPrice) < 0
    )
  ) {
    return 'Preço original inválido.';
  }

  if (!body.supplierId) {
    return 'Fornecedora é obrigatória.';
  }

  return null;
}

export default async function handler(req, res) {
  try {
    await ensureProductsTable();

    /*
     * GET /api/products
     */
    if (req.method === 'GET') {
      const result = await getPool().query(
        'SELECT * FROM products ORDER BY id DESC'
      );

      return res.status(200).json(result.rows);
    }

    /*
     * POST /api/products
     */
    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) {
        return;
      }

      if (!requireCsrf(req, res)) {
        return;
      }

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
      } = req.body || {};

      const validationError = validateProduct(req.body);

      if (validationError) {
        return res.status(400).json({
          erro: validationError,
        });
      }

      const db = getPool();

      /*
       * Gera o próximo ID.
       */
      const idResult = await db.query("SELECT nextval('products_id_seq') AS id");
      const nextId = Number(idResult.rows[0].id);

      /*
       * Insere a peça.
       */
      const result = await db.query(
        `
        INSERT INTO products (
          id,
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
          status,
          tags
        )
        VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17::jsonb
        )
        RETURNING *
        `,
        [
          nextId,
          String(name).trim(),
          category || null,
          categoryName || null,
          size || null,
          condition || null,
          conditionLabel || null,
          Number(price),
          originalPrice !== undefined &&
          originalPrice !== null &&
          originalPrice !== ''
            ? Number(originalPrice)
            : null,
          brand || null,
          description || null,
          photo || null,
          supplierId || null,
          supplierName || null,
          createdBy || null,
          status || 'disponivel',
          JSON.stringify(req.body.tags || []),
        ]
      );

      return res.status(201).json({
        mensagem: 'Produto cadastrado com sucesso!',
        produto: result.rows[0],
      });
    }

    if (req.method === 'PATCH') {
      if (!requireAdmin(req, res) || !requireCsrf(req, res)) return;
      const id = Number(req.query?.id);
      if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({ erro: 'ID de produto inválido.' });
      const body = req.body || {};
      const error = validateProduct(body);
      if (error) return res.status(400).json({ erro: error });
      if (!['disponivel', 'indisponivel'].includes(body.status)) return res.status(400).json({ erro: 'Disponibilidade inválida.' });
      const result = await getPool().query(
        `UPDATE products SET name=$1, category=$2, category_name=$3, size=$4, condition=$5, condition_label=$6,
          price=$7, original_price=$8, brand=$9, description=$10, photo=$11, supplier_id=$12, supplier_name=$13, status=$14, tags=$16::jsonb
         WHERE id=$15 AND status NOT IN ('reservado','vendido') RETURNING *`,
        [String(body.name).trim(), body.category || null, body.categoryName || null, body.size || null,
          body.condition || null, body.conditionLabel || null, Number(body.price), body.originalPrice === '' || body.originalPrice == null ? null : Number(body.originalPrice),
          body.brand || null, body.description || null, body.photo || null, body.supplierId, body.supplierName || null, body.status, id, JSON.stringify(body.tags || [])]
      );
      if (!result.rowCount) return res.status(409).json({ erro: 'Peça não encontrada, reservada ou já vendida.' });
      return res.status(200).json({ produto: result.rows[0] });
    }

    /* DELETE /api/products/:id */
    if (req.method === 'DELETE') {
      if (!requireAdmin(req, res)) {
        return;
      }

      if (!requireCsrf(req, res)) {
        return;
      }

      const id = Number(req.query?.id);

      if (!Number.isInteger(id)) {
        return res.status(400).json({
          erro: 'ID de produto inválido.',
        });
      }

      const result = await getPool().query(
        `
        DELETE FROM products
        WHERE id = $1
        RETURNING id
        `,
        [id]
      );

      if (result.rowCount === 0) {
        return res.status(404).json({
          erro: 'Produto não encontrado.',
        });
      }

      return res.status(204).end();
    }

    /*
     * Método não permitido.
     */
    return res.status(405).json({
      erro: 'Método não permitido.',
    });
  } catch (error) {
    console.error('Erro na API /api/products:', error);

    return res.status(500).json({
      erro:
        'Erro interno ao processar a solicitação.',
    });
  }
}
