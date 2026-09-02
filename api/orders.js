import { ensureOrdersTable, getPool } from './_db.js';
import { readSession } from './_session.js';

function normalizeItems(items) {
  return Array.isArray(items) ? items : [];
}

function publicOrder(row) {
  return {
    id: row.id,
    customerId: row.customer_id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    date: row.date instanceof Date ? row.date.toISOString().split('T')[0] : String(row.date),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    status: row.status,
    paymentStatus: row.payment_status,
    paymentMethod: row.payment_method,
    paidAt: row.paid_at ? new Date(row.paid_at).toISOString() : null,
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    items: normalizeItems(row.items),
  };
}

function parseDate(value) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))
    ? value
    : new Date().toISOString().split('T')[0];
}

function canAccessOrder(session, order) {
  return session.role === 'administradora' ||
    order.customer_id === session.id ||
    (session.role === 'fornecedora' &&
      normalizeItems(order.items).some((item) => item.supplierId === session.supplierId));
}

export default async function handler(req, res) {
  try {
    const session = readSession(req);
    if (!session) return res.status(401).json({ erro: 'Autenticação necessária.' });

    await ensureOrdersTable();
    const db = getPool();

    if (req.method === 'GET') {
      const id = req.query?.id;
      let result;
      if (id) {
        result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
        if (!result.rows[0] || !canAccessOrder(session, result.rows[0])) {
          return res.status(404).json({ erro: 'Pedido não encontrado.' });
        }
        return res.status(200).json({ order: publicOrder(result.rows[0]) });
      }

      if (session.role === 'administradora') {
        result = await db.query('SELECT * FROM orders ORDER BY created_at DESC');
      } else if (session.role === 'fornecedora') {
        result = await db.query(
          `SELECT * FROM orders
           WHERE items @> $1::jsonb OR customer_id = $2
           ORDER BY created_at DESC`,
          [JSON.stringify([{ supplierId: session.supplierId }]), session.id]
        );
      } else {
        result = await db.query(
          'SELECT * FROM orders WHERE customer_id = $1 ORDER BY created_at DESC',
          [session.id]
        );
      }
      return res.status(200).json({ orders: result.rows.map(publicOrder) });
    }

    if (req.method === 'POST') {
      const body = req.body?.order || req.body || {};
      if (!body.id || !body.customerId || body.customerId !== session.id) {
        return res.status(403).json({ erro: 'Pedido não pertence à sessão atual.' });
      }
      if (!Array.isArray(body.items) || body.items.length === 0) {
        return res.status(400).json({ erro: 'O pedido deve conter itens.' });
      }

      const result = await db.query(
        `INSERT INTO orders
          (id, customer_id, customer_name, customer_email, date, created_at, status,
           payment_status, payment_method, paid_at, subtotal, shipping, total, items)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6::timestamptz, NOW()), $7, $8, $9, $10,
                 $11, $12, $13, $14::jsonb)
         ON CONFLICT (id) DO UPDATE SET
           status = EXCLUDED.status,
           payment_status = EXCLUDED.payment_status,
           payment_method = EXCLUDED.payment_method,
           paid_at = EXCLUDED.paid_at,
           subtotal = EXCLUDED.subtotal,
           shipping = EXCLUDED.shipping,
           total = EXCLUDED.total,
           items = EXCLUDED.items
         RETURNING *`,
        [
          body.id,
          session.id,
          String(body.customerName || ''),
          String(body.customerEmail || session.email),
          parseDate(body.date),
          body.createdAt || null,
          body.status || 'aguardando_pagamento',
          body.paymentStatus || 'pending',
          body.paymentMethod || null,
          body.paidAt || null,
          Number(body.subtotal || 0),
          Number(body.shipping || 0),
          Number(body.total || 0),
          JSON.stringify(body.items),
        ]
      );
      return res.status(201).json({ order: publicOrder(result.rows[0]) });
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id || req.body?.id;
      const result = await db.query('SELECT * FROM orders WHERE id = $1', [id]);
      const order = result.rows[0];
      if (!order || !canAccessOrder(session, order)) {
        return res.status(404).json({ erro: 'Pedido não encontrado.' });
      }

      const body = req.body || {};
      const updated = await db.query(
        `UPDATE orders
         SET status = COALESCE($1, status),
             payment_status = COALESCE($2, payment_status),
             payment_method = COALESCE($3, payment_method),
             paid_at = COALESCE($4, paid_at)
         WHERE id = $5
         RETURNING *`,
        [
          body.status || null,
          body.paymentStatus || null,
          body.paymentMethod || null,
          body.paidAt || null,
          id,
        ]
      );
      return res.status(200).json({ order: publicOrder(updated.rows[0]) });
    }

    return res.status(405).json({ erro: 'Método não permitido.' });
  } catch (error) {
    console.error('Erro na API de pedidos:', error);
    return res.status(503).json({ erro: 'Persistência de pedidos indisponível.' });
  }
}
