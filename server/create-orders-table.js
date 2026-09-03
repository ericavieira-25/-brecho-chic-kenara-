require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function createOrdersTable() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        customer_id TEXT NOT NULL,
        customer_name TEXT NOT NULL,
        customer_email TEXT NOT NULL,
        date DATE NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        status TEXT NOT NULL DEFAULT 'aguardando_pagamento',
        payment_status TEXT NOT NULL DEFAULT 'pending',
        payment_method TEXT,
        paid_at TIMESTAMPTZ,
        subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0,
        shipping NUMERIC(12, 2) NOT NULL DEFAULT 0,
        total NUMERIC(12, 2) NOT NULL DEFAULT 0,
        items JSONB NOT NULL DEFAULT '[]'::jsonb
      )
    `);
    console.log("✅ Tabela 'orders' criada (ou já existia).");
  } catch (e) {
    console.error("❌ Erro:", e.message);
  } finally {
    await pool.end();
  }
}

createOrdersTable();
