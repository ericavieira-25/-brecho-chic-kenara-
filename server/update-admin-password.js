/**
 * update-admin-password.js
 * Atualiza a senha do administrador usando ADMIN_PASSWORD do ambiente.
 * Uso: node server/update-admin-password.js
 */
require("dotenv").config({ path: ".env.vercel.local" });
const crypto = require("node:crypto");
const { promisify } = require("node:util");
const { Pool } = require("pg");

const scrypt = promisify(crypto.scrypt);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64, { N: 16384, r: 8, p: 1 });
  return `scrypt$16384$8$1$${salt}$${derivedKey.toString("hex")}`;
}

async function run() {
  try {
    if (!process.env.ADMIN_PASSWORD) throw new Error('Configure ADMIN_PASSWORD antes de executar este utilitário.');
    const hash = await hashPassword(process.env.ADMIN_PASSWORD);
    const result = await pool.query(
      "UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING email",
      [hash, "admin@brecho.com"]
    );
    if (result.rowCount === 0) {
      console.log("⚠️  Usuário admin@brecho.com não encontrado no banco.");
    } else {
      console.log("✅ Senha de admin@brecho.com atualizada.");
    }
  } catch (e) {
    console.error("❌ Erro:", e.message);
  } finally {
    await pool.end();
  }
}

run();
