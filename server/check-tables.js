require("dotenv").config();
const { Pool } = require("pg");
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  try {
    // Estrutura da tabela products
    const cols = await pool.query(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'products' ORDER BY ordinal_position"
    );
    console.log("\n=== Colunas de 'products' ===");
    cols.rows.forEach((c) => console.log(`  ${c.column_name} (${c.data_type})`));

    // Quantos produtos existem
    const count = await pool.query("SELECT COUNT(*) FROM products");
    console.log(`\nTotal de produtos: ${count.rows[0].count}`);

    // Tabela users existe?
    const users = await pool.query("SELECT COUNT(*) FROM users").catch(() => ({ rows: [{ count: "tabela não existe" }] }));
    console.log(`Total de usuários: ${users.rows[0].count}`);

    // Tabela orders existe?
    const orders = await pool.query("SELECT COUNT(*) FROM orders").catch(() => ({ rows: [{ count: "tabela não existe" }] }));
    console.log(`Total de pedidos: ${orders.rows[0].count}`);

  } catch (e) {
    console.error("Erro:", e.message);
  } finally {
    await pool.end();
  }
}

check();
