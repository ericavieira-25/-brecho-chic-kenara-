/**
 * orders.js
 *
 * Dados de demonstração de pedidos.
 * Cada pedido contém referências aos produtos reais e às fornecedoras.
 * Os cálculos financeiros são feitos através de financial.js, não armazenados aqui.
 */

export const mockOrders = [
  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 1: Um produto da Ana Carol
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-001',
    clientName: 'Maria Silva',
    clientEmail: 'maria@example.com',
    date: '2024-05-15',
    status: 'entregue',
    items: [
      {
        productId: 1,
        name: 'Vestido Floral Vintage Farm',
        supplierId: 'supplier-ana-carol',
        price: 89.9,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 2: Um produto da Rafa Alves
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-002',
    clientName: 'João Costa',
    clientEmail: 'joao@example.com',
    date: '2024-05-20',
    status: 'em_transito',
    items: [
      {
        productId: 2,
        name: 'Vestido Longo Boho Lez a Lez',
        supplierId: 'supplier-rafa-alves',
        price: 110.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 3: Um produto da Bea Oliveira
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-003',
    clientName: 'Ana Paula Rocha',
    clientEmail: 'ana.paula@example.com',
    date: '2024-05-22',
    status: 'processando',
    items: [
      {
        productId: 3,
        name: 'Vestido Tubinho Preto DKNY',
        supplierId: 'supplier-bea-oliveira',
        price: 95.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 4: Múltiplos produtos da Julia Lima
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-004',
    clientName: 'Carlos Mendes',
    clientEmail: 'carlos@example.com',
    date: '2024-05-25',
    status: 'entregue',
    items: [
      {
        productId: 4,
        name: 'Vestido Slip Dress Cetim Dourado H&M',
        supplierId: 'supplier-julia-lima',
        price: 78.0,
        quantity: 2,
      },
      {
        productId: 7,
        name: 'Blusa de Seda Rose Zara',
        supplierId: 'supplier-julia-lima',
        price: 65.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 5: Produtos de duas fornecedoras diferentes (Ana Carol + Paty Rocha)
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-005',
    clientName: 'Fernanda Oliveira',
    clientEmail: 'fernanda@example.com',
    date: '2024-05-28',
    status: 'entregue',
    items: [
      {
        productId: 8,
        name: 'Blusa Manga Bufante Shoulder',
        supplierId: 'supplier-ana-carol',
        price: 55.0,
        quantity: 1,
      },
      {
        productId: 5,
        name: 'Vestido Xadrez Vichy Mini',
        supplierId: 'supplier-paty-rocha',
        price: 52.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 6: Múltiplos produtos de Gi Mendes
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-006',
    clientName: 'Beatriz Santos',
    clientEmail: 'beatriz@example.com',
    date: '2024-05-30',
    status: 'entregue',
    items: [
      {
        productId: 23,
        name: 'Blazer Oversized Xadrez Príncipe de Gales',
        supplierId: 'supplier-gi-mendes',
        price: 145.0,
        quantity: 1,
      },
      {
        productId: 29,
        name: 'Óculos de Sol Gatinho Retrô',
        supplierId: 'supplier-gi-mendes',
        price: 88.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 7: Produtos de três fornecedoras diferentes
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-007',
    clientName: 'Ricardo Alves',
    clientEmail: 'ricardo@example.com',
    date: '2024-06-02',
    status: 'em_transito',
    items: [
      {
        productId: 10,
        name: 'Blusa Cropped Listrada Canelada',
        supplierId: 'supplier-julia-lima',
        price: 35.0,
        quantity: 1,
      },
      {
        productId: 25,
        name: 'Cinto Tressê Couro Arezzo',
        supplierId: 'supplier-rafa-alves',
        price: 28.0,
        quantity: 2,
      },
      {
        productId: 26,
        name: 'Lenço de Seda Floral Vivara',
        supplierId: 'supplier-bea-oliveira',
        price: 42.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 8: Múltiplos produtos de Mari Santos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-008',
    clientName: 'Gabriela Costa',
    clientEmail: 'gabriela@example.com',
    date: '2024-06-05',
    status: 'entregue',
    items: [
      {
        productId: 12,
        name: 'Calça Jeans Skinny Azul Escuro',
        supplierId: 'supplier-mari-santos',
        price: 72.0,
        quantity: 1,
      },
      {
        productId: 13,
        name: 'Calça Cargo Bege Oversized',
        supplierId: 'supplier-mari-santos',
        price: 85.0,
        quantity: 1,
      },
      {
        productId: 14,
        name: 'Calça Legging Preta com Textura',
        supplierId: 'supplier-mari-santos',
        price: 55.0,
        quantity: 2,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 9: Produtos de Carol Melo e Fê Costa
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-009',
    clientName: 'Larissa Gomes',
    clientEmail: 'larissa@example.com',
    date: '2024-06-08',
    status: 'processando',
    items: [
      {
        productId: 16,
        name: 'Saia Midi Plissada Cinza',
        supplierId: 'supplier-carol-melo',
        price: 78.0,
        quantity: 1,
      },
      {
        productId: 21,
        name: 'Jaqueta Jeans Oversized Guess',
        supplierId: 'supplier-fe-costa',
        price: 85.0,
        quantity: 1,
      },
      {
        productId: 24,
        name: 'Bolsa Tiracolo Couro Marrom Schutz',
        supplierId: 'supplier-fe-costa',
        price: 95.0,
        quantity: 1,
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // Pedido 10: Pedido maior com muitos produtos
  // ─────────────────────────────────────────────────────────────────────────
  {
    id: 'PED-2024-010',
    clientName: 'Marcela Dias',
    clientEmail: 'marcela@example.com',
    date: '2024-06-10',
    status: 'entregue',
    items: [
      {
        productId: 19,
        name: 'Casaco de Lã Cinza Autêntico',
        supplierId: 'supplier-carol-melo',
        price: 120.0,
        quantity: 1,
      },
      {
        productId: 20,
        name: 'Casaco Trench Coat Clássico',
        supplierId: 'supplier-carol-melo',
        price: 220.0,
        quantity: 1,
      },
      {
        productId: 22,
        name: 'Cardigan Longo Tricô Nude',
        supplierId: 'supplier-fe-costa',
        price: 62.0,
        quantity: 1,
      },
    ],
  },
];

/**
 * Calcula o total bruto de todos os pedidos.
 * Usado para dashboard administrativo.
 */
export function getTotalSalesFromOrders(orders = mockOrders) {
  return orders.reduce((sum, order) => {
    const orderTotal = order.items.reduce((itemSum, item) => {
      return itemSum + item.price * item.quantity;
    }, 0);
    return sum + orderTotal;
  }, 0);
}

/**
 * Retorna todos os itens de todos os pedidos em um array plano.
 * Útil para cálculos financeiros via calculateOrderSplitBySupplier.
 */
export function getOrderItemsFlat(orders = mockOrders) {
  const items = [];
  orders.forEach((order) => {
    order.items.forEach((item) => {
      items.push({
        ...item,
        orderId: order.id,
        orderDate: order.date,
      });
    });
  });
  return items;
}

/**
 * Retorna todos os pedidos de uma fornecedora específica.
 */
export function getOrdersBySupplier(supplierId, orders = mockOrders) {
  return orders
    .map((order) => ({
      ...order,
      items: order.items.filter((item) => item.supplierId === supplierId),
    }))
    .filter((order) => order.items.length > 0);
}

/**
 * Retorna a quantidade total de produtos vendidos.
 */
export function getTotalProductsSoldFromOrders(orders = mockOrders) {
  return orders.reduce((sum, order) => {
    return sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
  }, 0);
}

/**
 * Retorna a quantidade total de pedidos.
 */
export function getTotalOrdersCount(orders = mockOrders) {
  return orders.length;
}
