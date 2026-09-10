const path = require('node:path');
const { pathToFileURL } = require('node:url');
const express = require('express');
require('dotenv').config({ path: [path.join(__dirname, '.env'), path.join(__dirname, '../.env.local')], quiet: true });
async function start() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));
  for (const endpoint of ['users', 'products', 'orders', 'auth']) {
    const { default: handler } = await import(pathToFileURL(path.join(__dirname, `../api/${endpoint}.js`)));
    app.all(`/api/${endpoint}`, handler);
  }
  app.get('/api/health', (_req, res) => res.json({ ok: true }));
  app.use('/api', (_req, res) => res.status(404).json({ erro: 'Endpoint não encontrado.' }));
  app.use((error, _req, res, _next) => {
    res.status(error.status || 500).json({ erro: error.type === 'entity.too.large' ? 'Imagem muito grande.' : 'Não foi possível processar a solicitação.' });
  });
  app.listen(process.env.PORT || 3000, '127.0.0.1', () => console.log(`API disponível em http://localhost:${process.env.PORT || 3000}`));
}
start().catch((error) => { console.error(error); process.exitCode = 1; });
