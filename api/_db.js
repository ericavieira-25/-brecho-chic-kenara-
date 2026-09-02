import { Pool } from 'pg';

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
