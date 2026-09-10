# Brechó Chic Kenara

Loja React + Vite, com API Node e PostgreSQL. A API local utiliza os mesmos handlers de `api/` usados na Vercel.

## Executar localmente

Requer Node.js 22.12+ (verifique também os requisitos das dependências instaladas) e PostgreSQL acessível.

```powershell
npm install
npm --prefix server install
npm run dev
```

Abra http://localhost:5173. A API escuta em http://localhost:3000. `npm run dev` inicia frontend e API juntos. Para iniciar separadamente, use `npm run dev:web` e `npm run dev:api`.

Configure em `server/.env` (local) ou nas variáveis da hospedagem:

```dotenv
DATABASE_URL=postgresql://USUARIO:SENHA@HOST:5432/BANCO
AUTH_SECRET=SEGREDO_ALEATORIO_LONGO
```

Também são aceitas POSTGRES_URL, POSTGRES_URL_NON_POOLING e POSTGRES_PRISMA_URL. Não publique arquivos `.env` nem credenciais. O servidor local lê `server/.env` e depois `.env.local`, preservando as variáveis existentes do processo.

As tabelas são criadas/atualizadas pela API. Usuários existentes são preservados. O cadastro público cria somente clientes. Não há senha administrativa padrão nem rota pública de redefinição. Uma conta administrativa existente deve ser usada; para uma instalação nova, o responsável pelo banco precisa atribuir o papel `administradora` à conta autorizada.

## Compras e PIX

- Cada peça é única: uma unidade por produto.
- O backend determina preços e frete a partir do catálogo; valores enviados pelo navegador não são usados como cobrança.
- O pedido e a reserva de estoque são salvos na mesma transação. Uma peça reservada deixa de estar disponível.
- O botão “Já paguei” informa o pagamento para conferência. Não comprova recebimento.
- A administradora confere a conta bancária e confirma o recebimento no painel. Só então o pedido é marcado como pago e a peça como vendida.
- A administradora pode cancelar um pedido ainda não pago e liberar as peças. As reservas não expiram automaticamente: pedidos abandonados precisam ser cancelados no painel.
- Falhas de conexão não geram contas, pedidos ou pagamentos fictícios no navegador.
- Relatórios de vendas consideram pedidos pagos. Repasses a fornecedoras ainda usam os controles locais existentes; não são transferências bancárias automáticas.

## Validação

```powershell
npm test
npm run lint
npm run build
```

Os testes usam banco simulado e cobrem autenticação, autorização, preços, reservas, cancelamento, exclusão de produtos e arredondamento financeiro. Não movimentam pedidos reais.

`npm run test:integration` verifica cadastro, login e compra no PostgreSQL configurado, em um esquema temporário dentro de uma transação revertida ao terminar. Requer permissão para criar esquema. Não altera registros existentes.

## Publicação

A configuração Vercel existente encaminha `/api/*` para os handlers e as outras rotas para a aplicação React. Configure DATABASE_URL e AUTH_SECRET no ambiente de produção antes de publicar. Um upload apenas de `dist/` não fornece autenticação, banco ou checkout.

`npm run preview` exibe o frontend compilado e utiliza a API local na porta 3000. Publicação e conferência de pagamentos reais são etapas separadas dos testes locais.

Antes de abrir a operação ao público, fornecer os textos reais de privacidade e termos da loja. Os links que apontavam incorretamente para o catálogo foram retirados. Repasses a fornecedoras ainda são controles locais, e reservas não expiram automaticamente.

## Demonstração opcional

Em banco descartável de desenvolvimento, ENABLE_DEMO_USERS=true com DEMO_PASSWORD explícita permite criar contas de demonstração. ENABLE_DEMO_PRODUCTS=true permite carregar o catálogo de exemplo num banco vazio. Ambos ficam desativados em produção. VITE_DEMO_MODE=true permite mostrar catálogo de exemplo quando a API falha; não simula pagamento nem cadastro.
