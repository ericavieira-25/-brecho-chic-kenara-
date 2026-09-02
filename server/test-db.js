const pool = require("./db");

async function testarBanco() {
  try {
    const result = await pool.query("SELECT NOW()");
    console.log("🐘 PostgreSQL conectado!");
    console.log("Hora do banco:", result.rows[0].now);
  } catch (error) {
    console.error("❌ Erro ao conectar:", error.message);
  } finally {
    await pool.end();
  }
}

testarBanco();