/**
 * orderService.js
 *
 * Serviço centralizado para gerenciamento de pedidos.
 * - Criação de pedidos a partir do carrinho
 * - Persistência em localStorage
 * - Busca de pedidos por cliente ou fornecedora
 * - Controle separado do pedido e do pagamento
 */

import { products } from './products.js';
import { calculateOrderSplitBySupplier, roundCurrency } from './financial.js';

const REAL_ORDERS_KEY = 'brecho_orders_real';
const LAST_ORDER_KEY = 'brecho_last_order_created';

export const ORDER_STATUS = {
  AWAITING_PAYMENT: 'aguardando_pagamento',
  PROCESSING: 'processando',
  IN_TRANSIT: 'em_transito',
  DELIVERED: 'entregue',
  CANCELED: 'cancelado',
};

export const PAYMENT_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  PAID: 'paid',
  FAILED: 'failed',
  CANCELED: 'canceled',
};

export const PAYMENT_METHODS = {
  PIX: 'pix',
  CARD: 'card',
};

export function normalizeOrder(order) {
  const safeItems = Array.isArray(order?.items) ? order.items : [];

  const subtotal = safeItems.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? item?.qty ?? 1);
    const price = Number(item?.price ?? 0);
    return sum + (price * qty);
  }, 0);

  const explicitTotal = Number(order?.total);
  const explicitShipping = Number(order?.shipping);

  const total = Number.isFinite(explicitTotal) ? explicitTotal : subtotal;
  const shipping = Number.isFinite(explicitShipping)
    ? explicitShipping
    : subtotal >= 150
      ? 0
      : 15.9;

  return {
    ...order,
    subtotal: roundCurrency(subtotal || total),
    shipping: roundCurrency(shipping),
    total: roundCurrency(total),
    status: order?.status || ORDER_STATUS.AWAITING_PAYMENT,
    paymentStatus:
      order?.paymentStatus ||
      (order?.status === ORDER_STATUS.PROCESSING
        ? PAYMENT_STATUS.PAID
        : PAYMENT_STATUS.PENDING),
    paymentMethod: order?.paymentMethod || null,
  };
}

/**
 * Gera um ID único para pedidos reais
 */
function generateOrderId() {
  const now = new Date();
  const date = now.toISOString().split('T')[0].replace(/-/g, '');
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();

  return `ORDER-${date}-${random}`;
}

/**
 * Obtém todos os pedidos reais armazenados em localStorage
 */
export function getRealOrders() {
  try {
    const stored = localStorage.getItem(REAL_ORDERS_KEY);
    const orders = stored ? JSON.parse(stored) : [];

    return orders.map(normalizeOrder);
  } catch (error) {
    console.error('Erro ao carregar pedidos reais:', error);
    return [];
  }
}

/**
 * Salva lista de pedidos reais em localStorage
 */
function saveRealOrders(orders) {
  try {
    localStorage.setItem(REAL_ORDERS_KEY, JSON.stringify(orders));
  } catch (error) {
    console.error('Erro ao salvar pedidos reais:', error);
    throw error;
  }
}

function saveOrder(order) {
  const orders = getRealOrders().filter((item) => item.id !== order.id);
  orders.push(normalizeOrder(order));
  saveRealOrders(orders);
  try {
    localStorage.setItem(LAST_ORDER_KEY, order.id);
  } catch (error) {
    console.error('Erro ao salvar último pedido:', error);
  }
}

function getCsrfToken() {
  const cookie = document.cookie
    .split('; ')
    .find((c) => c.startsWith('kenara_csrf='));
  return cookie ? cookie.split('=').slice(1).join('=') : null;
}

async function requestOrders(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const csrfToken = method !== 'GET' ? getCsrfToken() : null;
  const response = await fetch(`/api/orders${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(csrfToken ? { 'X-CSRF-Token': csrfToken } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.erro || 'API de pedidos indisponível.');
  }
  return data;
}

function syncOrderChange(order) {
  requestOrders(`?id=${encodeURIComponent(order.id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      id: order.id,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      paidAt: order.paidAt,
    }),
  }).catch((error) => {
    console.warn('Alteração mantida apenas no modo local:', error.message);
  });
}

/**
 * Sincroniza os pedidos persistidos no PostgreSQL com o cache local.
 * A falha é deliberadamente ignorada para manter o modo demonstração.
 */
export async function fetchOrdersByCustomerId(customerId) {
  try {
    const data = await requestOrders('');
    const remoteOrders = Array.isArray(data.orders) ? data.orders.map(normalizeOrder) : [];
    const localOrders = getRealOrders().filter((order) => order.customerId !== customerId);
    saveRealOrders([...localOrders, ...remoteOrders]);
    return remoteOrders.filter((order) => order.customerId === customerId);
  } catch (error) {
    console.warn('Usando pedidos locais:', error.message);
    return getOrdersByCustomerId(customerId);
  }
}

export async function fetchOrderById(orderId) {
  try {
    const data = await requestOrders(`?id=${encodeURIComponent(orderId)}`);
    const order = normalizeOrder(data.order);
    saveOrder(order);
    return order;
  } catch (error) {
    console.warn('Usando pedido local:', error.message);
    return getOrderById(orderId);
  }
}

/**
 * Obtém o ID do último pedido criado
 */
export function getLastCreatedOrderId() {
  try {
    return localStorage.getItem(LAST_ORDER_KEY);
  } catch (error) {
    console.error('Erro ao obter último pedido:', error);
    return null;
  }
}

/**
 * Cria um novo pedido a partir dos itens do carrinho
 */
export async function createOrder({
  user,
  cartItems,
  subtotal,
  shipping,
  total,
}) {
  if (!user || !user.id) {
    throw new Error('Usuário não autenticado');
  }

  if (!cartItems || cartItems.length === 0) {
    throw new Error('Carrinho vazio');
  }

  const unavailableProducts = cartItems.filter((item) => {
    const product = products.find((p) => p.id === item.id);

    return !product || !product.available;
  });

  if (unavailableProducts.length > 0) {
    throw new Error(
      `Alguns produtos não estão mais disponíveis: ${unavailableProducts
        .map((p) => p.name)
        .join(', ')}`
    );
  }

  const orderItems = cartItems.map((item) => ({
    productId: item.id,
    name: item.name,
    supplierId: item.supplierId,
    price: item.price,
    quantity: item.quantity,
    brand: item.brand,
    size: item.size,
    image: item.images ? item.images[0] : null,
  }));

  const order = {
    id: generateOrderId(),

    customerId: user.id,
    customerName: user.name,
    customerEmail: user.email,

    date: new Date().toISOString().split('T')[0],
    createdAt: new Date().toISOString(),

    // Pedido começa aguardando o pagamento
    status: ORDER_STATUS.AWAITING_PAYMENT,

    // Pagamento separado do status do pedido
    paymentStatus: PAYMENT_STATUS.PENDING,
    paymentMethod: null,
    paidAt: null,

    items: orderItems,

    subtotal: roundCurrency(subtotal),
    shipping: roundCurrency(shipping),
    total: roundCurrency(total),
  };

  // Cache otimista mantém a experiência demo quando a API não está disponível.
  saveOrder(order);

  try {
    const data = await requestOrders('', {
      method: 'POST',
      body: JSON.stringify(order),
    });
    const persistedOrder = normalizeOrder(data.order);
    saveOrder(persistedOrder);
    return persistedOrder;
  } catch (error) {
    console.warn('Pedido mantido apenas no modo local:', error.message);
    return order;
  }
}

/**
 * Busca um pedido pelo ID
 */
export function getOrderById(orderId) {
  const realOrders = getRealOrders();

  return realOrders.find((order) => order.id === orderId) || null;
}

/**
 * Obtém todos os pedidos de um cliente
 */
export function getOrdersByCustomerId(customerId) {
  const realOrders = getRealOrders();

  return realOrders.filter(
    (order) => order.customerId === customerId
  );
}

/**
 * Obtém todos os pedidos relacionados a uma fornecedora
 */
export function getOrdersBySupplier(supplierId) {
  const realOrders = getRealOrders();

  return realOrders.filter((order) =>
    order.items.some(
      (item) => item.supplierId === supplierId
    )
  );
}

/**
 * Combina pedidos reais com mockOrders para dashboards
 */
export function mergeOrdersWithMock(mockOrders) {
  const realOrders = getRealOrders();

  return [...mockOrders, ...realOrders]
    .map(normalizeOrder)
    .sort((a, b) => new Date(b.date) - new Date(a.date));
}

export function updateOrderStatus(orderId, newStatus) {
  const realOrders = getRealOrders();
  const order = realOrders.find((o) => o.id === orderId);

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  // Não permite alterar um pedido já cancelado
  if (order.status === 'cancelado' && newStatus !== 'cancelado') {
    throw new Error('Pedido cancelado não pode ser alterado');
  }

  order.status = newStatus;

  // Quando o pedido é marcado como pago,
  // registra também o pagamento.
  if (newStatus === 'pago') {
    order.paymentStatus = 'paid';
    order.paidAt = new Date().toISOString();
  }

  // Quando o pedido é cancelado antes do pagamento,
  // registra o cancelamento do pagamento.
  if (newStatus === 'cancelado') {
    order.paymentStatus = PAYMENT_STATUS.CANCELED;
  }

  saveRealOrders(realOrders);
  syncOrderChange(order);

  return order;
}

/**
 * Define a forma de pagamento escolhida
 */
export function updatePaymentMethod(
  orderId,
  paymentMethod
) {
  const validMethods = Object.values(PAYMENT_METHODS);

  if (!validMethods.includes(paymentMethod)) {
    throw new Error('Forma de pagamento inválida');
  }

  const realOrders = getRealOrders();

  const order = realOrders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  if (order.status === ORDER_STATUS.CANCELED) {
    throw new Error('Não é possível pagar um pedido cancelado');
  }

  order.paymentMethod = paymentMethod;
  order.paymentStatus = PAYMENT_STATUS.PROCESSING;

  saveRealOrders(realOrders);
  syncOrderChange(order);

  return order;
}

/**
 * Confirma o pagamento do pedido.
 *
 * IMPORTANTE:
 * Nesta versão, esta função será usada apenas pelo fluxo
 * de demonstração. Em produção, a confirmação deve vir
 * do provedor de pagamento no backend.
 */
export function confirmPayment(orderId) {
  const realOrders = getRealOrders();

  const order = realOrders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  if (order.status === ORDER_STATUS.CANCELED) {
    throw new Error('Não é possível confirmar um pedido cancelado');
  }

  order.paymentStatus = PAYMENT_STATUS.PAID;
  order.paidAt = new Date().toISOString();

  // Depois do pagamento, o pedido entra no processamento
  order.status = ORDER_STATUS.PROCESSING;

  saveRealOrders(realOrders);
  syncOrderChange(order);

  return order;
}

/**
 * Marca o pagamento como falho
 */
export function failPayment(orderId) {
  const realOrders = getRealOrders();

  const order = realOrders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  order.paymentStatus = PAYMENT_STATUS.FAILED;

  saveRealOrders(realOrders);
  syncOrderChange(order);

  return order;
}

/**
 * Cancela um pedido
 */
export function cancelOrder(orderId) {
  const realOrders = getRealOrders();

  const order = realOrders.find(
    (item) => item.id === orderId
  );

  if (!order) {
    throw new Error('Pedido não encontrado');
  }

  if (order.paymentStatus === PAYMENT_STATUS.PAID) {
    throw new Error(
      'Este pedido já foi pago e não pode ser cancelado por este fluxo'
    );
  }

  order.status = ORDER_STATUS.CANCELED;
  order.paymentStatus = PAYMENT_STATUS.CANCELED;

  saveRealOrders(realOrders);
  syncOrderChange(order);

  return order;
}

/**
 * Calcula totais financeiros de um conjunto de pedidos
 */
export function calculateOrdersFinancials(orders) {
  if (!orders || orders.length === 0) {
    return {
      totalSales: 0,
      supplierShare: 0,
      adminShare: 0,
      metric10: 0,
    };
  }

  const allItems = orders.flatMap(
    (order) => order.items
  );

  const totalSales = orders.reduce(
    (sum, order) => sum + order.total - order.shipping,
    0
  );

  const split = calculateOrderSplitBySupplier(allItems);

  const metric10 = totalSales * 0.1;

  return {
    totalSales: roundCurrency(totalSales),
    supplierShare: split.totalSupplierShare,
    adminShare: split.totalAdminShare,
    metric10: roundCurrency(metric10),
  };
}

/**
 * Limpa o registro do último pedido criado
 */
export function clearLastOrderMarker() {
  try {
    localStorage.removeItem(LAST_ORDER_KEY);
  } catch (error) {
    console.error(
      'Erro ao limpar marcador de último pedido:',
      error
    );
  }
}

/**
 * Retorna estatísticas gerais dos pedidos reais
 */
export function getRealOrdersStats() {
  const realOrders = getRealOrders();

  const totalOrders = realOrders.length;

  const totalSales = realOrders.reduce(
    (sum, order) => sum + order.total,
    0
  );

  const totalProductsSold = realOrders.reduce(
    (sum, order) =>
      sum +
      order.items.reduce(
        (itemSum, item) =>
          itemSum + item.quantity,
        0
      ),
    0
  );

  return {
    totalOrders,
    totalSales: roundCurrency(totalSales),
    totalProductsSold,
  };
}
