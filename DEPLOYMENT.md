# Publicação

Consulte o README.md para instalação, variáveis obrigatórias e fluxo operacional atualizado.

O projeto requer frontend, API e PostgreSQL. Na Vercel, as funções em api/ são publicadas junto com o frontend. Configure DATABASE_URL e AUTH_SECRET no ambiente de produção. Nenhuma conta de demonstração é criada automaticamente em produção.

O PIX é conferido manualmente pela administradora. Não há gateway, confirmação bancária automática ou envio automático de e-mails. Reservas pendentes devem ser canceladas no painel quando necessário.

Antes de publicar: npm test, npm run lint e npm run build. Após publicar, verificar login, cadastro, catálogo, criação de produto, checkout e conferência de PIX com dados controlados.
