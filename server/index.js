const express = require("express");
const cors = require("cors");
const pool = require("./db");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Rota principal
app.get("/", (req, res) => {
  res.json({
    mensagem: "API do Brechó Chic Kenara funcionando! 🚀"
  });
});

// Teste do banco
app.get("/api/teste-banco", async (req, res) => {
  try {
    const result = await pool.query("SELECT NOW()");

    res.json({
      conectado: true,
      banco: "PostgreSQL",
      hora: result.rows[0].now
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      conectado: false,
      erro: "Não foi possível conectar ao banco."
    });
  }
});

// Listar produtos
app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY id DESC"
    );

    res.json(result.rows);
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Não foi possível buscar os produtos."
    });
  }
});

// Cadastrar produto
app.post("/api/products", async (req, res) => {
  try {
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
  status
} = req.body;

    if (!name || price === undefined) {
      return res.status(400).json({
        erro: "Nome e preço são obrigatórios."
      });
    }

    
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
    status || "disponivel"
  ]
);

    res.status(201).json({
      mensagem: "Produto cadastrado com sucesso! 🛍️",
      produto: result.rows[0]
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      erro: "Não foi possível cadastrar o produto."
    });
  }
});

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});