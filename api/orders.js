import { ensureOrdersTable, ensureProductsTable, getPool } from './_db.js';
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
    fulfillmentMethod: row.fulfillment_method || null,
    deliveryAddress: row.delivery_address || null,
    total: Number(row.total),
    items: normalizeItems(row.items),
  };
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
      if (!session.id || !body.id || body.customerId !== session.id) return res.status(403).json({ erro: 'Pedido não pertence à sessão atual.' });
      if (!Array.isArray(body.items) || !body.items.length || body.items.length > 100) return res.status(400).json({ erro: 'O pedido deve conter itens válidos.' });
      const ids = body.items.map(item => Number(item.productId));
      if (ids.some(id => !Number.isSafeInteger(id) || id <= 0) || new Set(ids).size !== ids.length || body.items.some(item => Number(item.quantity) !== 1)) {
        return res.status(400).json({ erro: 'Cada peça é única: selecione uma unidade por produto.' });
      }
      const fulfillmentMethod = body.fulfillmentMethod || 'pickup';
      if (!['pickup','local_delivery'].includes(fulfillmentMethod)) return res.status(400).json({ erro: 'Escolha uma forma de recebimento válida.' });
      const deliveryAddress = fulfillmentMethod === 'local_delivery' ? String(body.deliveryAddress || '').trim() : null;
      if (fulfillmentMethod === 'local_delivery' && (!deliveryAddress || deliveryAddress.length > 500)) return res.status(400).json({ erro: 'Informe o endereço para entrega local (até 500 caracteres).' });
      await ensureProductsTable();
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const existing = await client.query('SELECT * FROM orders WHERE id = $1', [body.id]);
        if (existing.rows[0]) {
          await client.query('ROLLBACK');
          if (existing.rows[0].customer_id !== session.id) return res.status(409).json({ erro: 'Identificador de pedido já utilizado.' });
          return res.status(200).json({ order: publicOrder(existing.rows[0]) });
        }
        const products = await client.query('SELECT * FROM products WHERE id = ANY($1::int[]) ORDER BY id FOR UPDATE', [ids]);
        if (products.rows.length !== ids.length || products.rows.some(product => product.status !== 'disponivel')) {
          await client.query('ROLLBACK');
          return res.status(409).json({ erro: 'Uma ou mais peças já não estão disponíveis. Atualize o carrinho.' });
        }
        const items = products.rows.map(product => ({ productId: product.id, name: product.name, supplierId: product.supplier_id, price: Number(product.price), quantity: 1, brand: product.brand, size: product.size, image: product.photo }));
        const subtotal = Math.round(items.reduce((sum, item) => sum + item.price, 0) * 100) / 100;
        const shipping = 0;
        const total = Math.round((subtotal + shipping) * 100) / 100;
        const result = await client.query(
          "INSERT INTO orders (id, customer_id, customer_name, customer_email, date, status, payment_status, subtotal, shipping, total, items, fulfillment_method, delivery_address) VALUES ($1,$2,$3,$4,CURRENT_DATE,'aguardando_pagamento','pending',$5,$6,$7,$8::jsonb,$9,$10) RETURNING *",
          [body.id, session.id, String(body.customerName || ''), session.email, subtotal, shipping, total, JSON.stringify(items), fulfillmentMethod, deliveryAddress]
        );
        await client.query("UPDATE products SET status = 'reservado' WHERE id = ANY($1::int[])", [ids]);
        await client.query('COMMIT');
        return res.status(201).json({ order: publicOrder(result.rows[0]) });
      } catch (error) {
        await client.query('ROLLBACK');
        if (error.code === '23505') return res.status(409).json({ erro: 'Pedido já registrado. Consulte seus pedidos.' });
        throw error;
      } finally { client.release(); }
    }

    if (req.method === 'PATCH') {
      const id = req.query?.id || req.body?.id;
      const body = req.body || {};
      const client = await db.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
        const order = result.rows[0];
        const admin = session.role === 'administradora';
        if (!order || (!admin && order.customer_id !== session.id)) {
          await client.query('ROLLBACK');
          return res.status(404).json({ erro: 'Pedido não encontrado.' });
        }
        let status = body.status || order.status;
        let paymentStatus = body.paymentStatus || order.payment_status;
        const method = body.paymentMethod || order.payment_method;
        if (!['aguardando_pagamento','processando','em_transito','entregue','cancelado'].includes(status) || !['pending','processing','paid','failed','canceled'].includes(paymentStatus) || (method && method !== 'pix')) {
          await client.query('ROLLBACK');
          return res.status(400).json({ erro: 'Estado de pedido ou pagamento inválido.' });
        }
        if (!admin && (body.paidAt || !['pending','processing','canceled'].includes(paymentStatus) || !['aguardando_pagamento','cancelado'].includes(status))) {
          await client.query('ROLLBACK');
          return res.status(403).json({ erro: 'Somente a administradora pode confirmar o recebimento.' });
        }
        if (order.status === 'cancelado' || (order.payment_status === 'paid' && (paymentStatus !== 'paid' || status === 'cancelado'))) {
          await client.query('ROLLBACK');
          return res.status(409).json({ erro: 'O pedido não permite essa alteração. Entre em contato com a loja.' });
        }
        if (status === 'cancelado') paymentStatus = 'canceled';
        if (paymentStatus === 'paid' && status === 'aguardando_pagamento') status = 'processando';
        if (['processando','em_transito','entregue'].includes(status) && paymentStatus !== 'paid') {
          await client.query('ROLLBACK');
          return res.status(400).json({ erro: 'Confirme o recebimento antes de avançar o pedido.' });
        }
        const updated = await client.query(
          "UPDATE orders SET status=$1, payment_status=$2, payment_method=$3, paid_at=CASE WHEN $2='paid' THEN COALESCE(paid_at,NOW()) ELSE paid_at END WHERE id=$4 RETURNING *",
          [status, paymentStatus, method, id]
        );
        const ids = normalizeItems(order.items).map(item => Number(item.productId));
        if (status === 'cancelado') await client.query("UPDATE products SET status='disponivel' WHERE id=ANY($1::int[]) AND status='reservado'", [ids]);
        else if (paymentStatus === 'paid') await client.query("UPDATE products SET status='vendido' WHERE id=ANY($1::int[])", [ids]);
        await client.query('COMMIT');
        return res.status(200).json({ order: publicOrder(updated.rows[0]) });
      } catch (error) { await client.query('ROLLBACK'); throw error; }
      finally { client.release(); }
    }

    return res.status(405).json({ erro: 'Método não permitido.' });
  } catch (error) {
    console.error('Erro na API de pedidos:', error);
    return res.status(503).json({ erro: 'Persistência de pedidos indisponível.' });
  }
}
