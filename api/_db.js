import { Pool } from 'pg';
import { products } from '../src/data/products.js';

let pool;

export function getPool() {
  if (pool) return pool;

  const connectionString =
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.DATABASE_URL ||
    process.env.POSTGRES_PRISMA_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL não configurada.');
  }

  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : undefined,
  });

  return pool;
}

export async function ensureUsersTable() {
  await getPool().query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'cliente',
      supplier_id TEXT,
      avatar TEXT,
      phone TEXT,
      address TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

export async function ensureOrdersTable() {
  await getPool().query(`
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
}

export async function ensureProductsTable() {
  const database = getPool();

  await database.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      category_name TEXT,
      size TEXT,
      condition TEXT,
      condition_label TEXT,
      price NUMERIC(12, 2) NOT NULL,
      original_price NUMERIC(12, 2),
      brand TEXT,
      description TEXT,
      photo TEXT,
      supplier_id TEXT,
      supplier_name TEXT,
      created_by TEXT,
      status TEXT NOT NULL DEFAULT 'disponivel',
      created_at DATE NOT NULL DEFAULT CURRENT_DATE
    )
  `);

  const countResult = await database.query('SELECT COUNT(*)::int AS count FROM products');
  if (countResult.rows[0].count > 0) return;

  for (const product of products) {
    await database.query(
      `INSERT INTO products
        (id, name, category, size, condition, price, original_price, brand,
         description, photo, supplier_id, supplier_name, status, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       ON CONFLICT (id) DO NOTHING`,
      [
        product.id,
        product.name,
        product.category || null,
        product.size || null,
        product.condition || null,
        product.price,
        product.originalPrice ?? null,
        product.brand || null,
        product.description || null,
        product.images?.[0] || null,
        product.supplierId || null,
        product.seller || null,
        product.available === false ? 'indisponivel' : 'disponivel',
        product.createdAt || null,
      ]
    );
  }
}
