import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default async function handler(req, res) {
  try {
    // GET /api/products
    if (req.method === 'GET') {
      const result = await pool.query(
        'SELECT * FROM products ORDER BY id DESC'
      );

      return res.status(200).json(result.rows);
    }

    // POST /api/products
    if (req.method === 'POST') {
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

    return res.status(405).json({
      erro: 'Método não permitido.',
    });
  } catch (error) {
    console.error('Erro na API:', error);

    return res.status(500).json({
      erro: error.message,
    });
  }
}