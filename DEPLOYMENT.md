# 📖 Guia de Instalação e Deployment

## 🎯 Atalhos Rápidos

### Para Rodar Localmente
```bash
npm install
npm run dev
# Acesse: http://localhost:5173
```

### Para Fazer Deploy Online

#### 1. Vercel (Mais fácil)
1. Faça push para GitHub
2. Vá para https://vercel.com
3. Clique "Import Project"
4. Selecione o repositório
5. Deploy automático em 2 minutos!

#### 2. Netlify
1. Faça push para GitHub
2. Vá para https://netlify.com
3. Clique "New site from Git"
4. Deploy em 5 minutos!

#### 3. Entregue o Build Compilado
```bash
npm run build
# Arquivos em ./dist/ prontos para upload
```

---

## 🔑 Contas de Teste

Use essas para testar todas as funcionalidades:

**Cliente:**
- E-mail: `demo@brecho.com`
- Senha: `123456`

**Fornecedora:**
- E-mail: `fornecedora@brecho.com`
- Senha: `123456`

**Administradora:**
- E-mail: `admin@brecho.com`
- Senha: `123456`

Configure `ADMIN_EMAIL`, `ADMIN_PASSWORD` e `AUTH_SECRET` nas variáveis de
ambiente da Vercel. O login/cadastro usa `/api/users`, com cookie `HttpOnly`
assinado; o endpoint administrativo legado `/api/auth` continua disponível como
fallback. As alterações administrativas exigem um token CSRF de uso duplo.

Para persistência de usuários e pedidos, configure também `DATABASE_URL` (ou
`POSTGRES_URL`) apontando para o PostgreSQL. Os endpoints `/api/users` e
`/api/orders` executam `CREATE TABLE IF NOT EXISTS` automaticamente. As contas
demo são semeadas com senha derivada por `crypto.scrypt`; se o banco/API estiver
indisponível, o frontend mantém o fallback local original.

---

## 💾 O que está Salvo

✅ Código completo  
✅ Componentes React  
✅ Dados de produtos e pedidos  
✅ Sistema de autenticação  
✅ Painel administrativo  
✅ Dashboard de fornecedora  
✅ Controle financeiro  
✅ Todos os estilos e configurações  

---

## 📦 O que NÃO está Salvo (Por enquanto)

✅ API de produtos, usuários e pedidos com PostgreSQL
✅ Cadastro e exclusão administrativa protegidos por sessão `HttpOnly`
❌ Pagamento real (simulado com PIX)  
❌ Upload de imagens real (usando URLs de exemplo)  

---

## 🚀 Após Deploy

**URL do seu site:** `https://seu-dominio.vercel.app` (ou similar)

**Compartilhe com:** Clientes, fornecedoras, amigos!

Todos podem:
- Ver o catálogo
- Fazer compras (com demo PIX)
- Ver histórico de pedidos
- Administradoras gerenciam tudo

---

## ❓ Perguntas Frequentes

**P: Posso mudar de servidor depois?**  
R: Sim! É só fazer push para GitHub e importar em outro hosting.

**P: Como faço para adicionar um produto de verdade?**  
R: Login com admin → Home → "Adicionar Produto"

**P: Os dados vão perder se reiniciar?**  
R: Produtos, usuários e pedidos reais são persistidos no PostgreSQL. Carrinho,
sessão e pedidos de demonstração continuam usando localStorage como fallback.

**P: Quantas pessoas podem usar ao mesmo tempo?**  
R: Ilimitadas se for frontend puro no navegador. Sem servidor backend.

---

## 📞 Próximas Fases

Para um app ainda mais real:
- Backend Node.js + Express
- Banco de dados PostgreSQL
- Pagamento com Stripe ou MercadoPago
- Upload de imagens para AWS S3
- Envio de e-mails
- API pública

**Quer implementar alguma dessas?** Posso ajudar!

---

Feito com 💚 Brechó Chic Kenara
