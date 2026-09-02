# 🌸 Brechó Chic Kenara

**E-commerce de moda sustentável com painel administrativo e dashboard de fornecedoras.**

Um projeto React + Vite completo com:
- ✅ Catálogo de produtos
- ✅ Carrinho de compras
- ✅ Sistema de pedidos real com pagamento PIX
- ✅ Painel administrativo (Dashboard + Gerenciamento de Fornecedoras)
- ✅ Painel da fornecedora (Histórico de vendas e produtos)
- ✅ Controle financeiro (75% fornecedora / 25% administradora)
- ✅ Sistema de papéis e permissões (Cliente, Fornecedora, Admin)
- ✅ Persistência em localStorage
- ✅ Disponibilidade de produtos

---

## 🚀 Como Começar

### 1. Instalação Local

**Pré-requisitos:**
- Node.js 16+ e npm

**Passos:**

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/brecho-chic-kenara.git
cd brecho-chic-kenara

# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

O app estará disponível em: `http://localhost:5173`

---

## 📚 Contas de Teste

| Papel | E-mail | Senha |
|-------|--------|-------|
| Cliente | `demo@brecho.com` | `123456` |
| Fornecedora | `fornecedora@brecho.com` | `123456` |
| Administradora | `admin@brecho.com` | `123456` |

---

## 🔨 Comandos Disponíveis

```bash
npm run dev       # Inicia servidor de desenvolvimento
npm run build     # Build para produção
npm run preview   # Visualiza o build localmente
npm run lint      # Verifica qualidade do código
```

---

## 📦 Build e Deploy

### Opção 1: Vercel (Recomendado)

1. Faça push para GitHub
2. Vá para [vercel.com](https://vercel.com)
3. Clique "Import Project" e selecione o repositório
4. Vercel faz deploy automaticamente
5. URL pública gerada automaticamente

### Opção 2: Netlify

1. Faça push para GitHub
2. Vá para [netlify.com](https://netlify.com)
3. Clique "New site from Git"
4. Selecione o repositório
5. Configure e deploy

### Opção 3: Build Local

```bash
npm run build
```

Arquivos compilados em `./dist/` prontos para upload em qualquer hosting.

---

## 🏗️ Estrutura do Projeto

```
src/
├── components/        # Componentes React reutilizáveis
│   ├── features/     # Barra de busca, carrinho, filtros
│   ├── layout/       # Header, Footer, Layout
│   ├── ui/           # Botão, Modal, Badge, etc
│   └── admin/        # Componentes administrativos
├── context/          # Context API (Auth, Cart, Favorites)
├── data/             # Dados e serviços
│   ├── products.js          # Catálogo de produtos
│   ├── orderService.js      # Gestão de pedidos reais
│   ├── financial.js         # Cálculos financeiros (75/25)
│   ├── orders.js            # Pedidos de demonstração
│   ├── roles.js             # Sistema de papéis
│   └── suppliers.js         # Dados de fornecedoras
├── hooks/            # Custom hooks (useGuard, useLocalStorage, etc)
├── pages/            # Páginas da aplicação
├── styles/           # Estilos globais
└── utils/            # Utilitários (formatadores, etc)
```

---

## 🔒 Autenticação e Autorização

O app utiliza:
- **localStorage** para persistência (dados salvos no navegador)
- **Context API** para estado global (usuário, carrinho, favoritos)
- **ProtectedRoute** para proteção de rotas baseada em papel

**Papéis disponíveis:**
- `cliente` — Acesso a catálogo, carrinho, pedidos
- `fornecedora` — Acesso ao dashboard de vendas
- `administradora` — Acesso ao painel admin completo

---

## 💰 Sistema Financeiro

- **75% do valor** → Fornecedora
- **25% do valor** → Administradora
- **Métrica 10%** → Separada (para análise)

Todos os cálculos estão centralizados em `src/data/financial.js`.

---

## 📱 Tecnologias

- **React 19** — Interface de usuário
- **Vite 8.2** — Build tool (rápido!)
- **React Router 7** — Roteamento
- **CSS Modules** — Estilos isolados
- **localStorage** — Persistência de dados

---

## 🛠️ Desenvolvimento

### Adicionar um novo componente

```jsx
// src/components/ui/MyComponent/MyComponent.jsx
export default function MyComponent() {
  return <div>Meu componente</div>;
}
```

### Adicionar uma nova página

```jsx
// src/pages/MyPage/MyPage.jsx
import styles from './MyPage.module.css';

export default function MyPage() {
  return <div className={styles.page}>Minha página</div>;
}
```

### Adicionar uma nova rota

```jsx
// src/routes.jsx
<Route path="/minha-rota" element={<MyPage />} />

// Se precisar proteger:
<Route
  path="/minha-rota-privada"
  element={
    <ProtectedRoute allowedRoles={[USER_ROLES.ADMIN]}>
      <MyPage />
    </ProtectedRoute>
  }
/>
```

---

## 🚀 Próximos Passos (Roadmap)

- [ ] Backend real com Node.js + Express
- [ ] Banco de dados (PostgreSQL/MongoDB)
- [ ] Integração com gateway de pagamento real (Stripe, MercadoPago)
- [ ] Envio de e-mails de confirmação
- [ ] Notificações em tempo real
- [ ] Upload real de imagens (AWS S3, Cloudinary)
- [ ] Testes automatizados
- [ ] Mobile app (React Native)

---

## 📝 Licença

Este projeto é de código aberto para fins educacionais.

---

## 🤝 Contribuindo

Sinta-se livre para fazer fork e enviar pull requests!

---

## 📞 Suporte

Dúvidas? Abra uma issue no GitHub ou entre em contato.

**Feito com 💚 para a moda sustentável.**
