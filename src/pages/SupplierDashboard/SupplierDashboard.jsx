/**
 * SupplierDashboard.jsx
 *
 * Painel do fornecedor - área protegida onde cada fornecedora vê apenas seus dados.
 * Vinculação automática via supplierId do usuário autenticado.
 */

import { useMemo } from 'react';
import { useGuard } from '../../hooks/useGuard.js';
import { getSupplierById } from '../../data/suppliers.js';
import { products } from '../../data/products.js';
import { mockOrders } from '../../data/orders.js';
import { mergeOrdersWithMock } from '../../data/orderService.js';
import { calculateOrderSplitBySupplier, roundCurrency } from '../../data/financial.js';
import styles from './SupplierDashboard.module.css';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function SupplierDashboard() {
  const { user } = useGuard();
  const supplierId = user?.supplierId;
  const supplier = supplierId ? getSupplierById(supplierId) : null;
  const data = useMemo(() => {
    if (!supplierId || !supplier) return { products: [], orders: [], orderItems: [], totalSales: 0, totalProductsSold: 0, supplierShare: 0, availableProducts: 0 };
    const allOrders = mergeOrdersWithMock(mockOrders);
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);
    const supplierOrders = allOrders.filter((order) => order.items.some((item) => item.supplierId === supplierId));
    const supplierOrderItems = supplierOrders.flatMap((order) => order.items.filter((item) => item.supplierId === supplierId));
    const split = calculateOrderSplitBySupplier(supplierOrderItems);
    const supplierSplit = split.bySupplier.find((s) => s.supplierId === supplierId);
    return { products: supplierProducts, orders: supplierOrders, orderItems: supplierOrderItems, totalSales: roundCurrency(supplierSplit?.grossAmount || 0), totalProductsSold: supplierOrderItems.reduce((sum, item) => sum + item.quantity, 0), supplierShare: roundCurrency(supplierSplit?.supplierShare || 0), availableProducts: supplierProducts.filter((p) => p.available).length };
  }, [supplierId, supplier]);

  // Obter ID da fornecedora do usuário autenticado
  if (!supplierId) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Erro de Configuração</h2>
          <p>Esta conta não possui uma fornecedora associada.</p>
        </div>
      </div>
    );
  }

  // Buscar dados da fornecedora
  if (!supplier) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <h2>Fornecedora não encontrada</h2>
          <p>Não conseguimos localizar os dados da fornecedora associada.</p>
        </div>
      </div>
    );
  }

  // Processar dados - APENAS da fornecedora autenticada (usando pedidos reais + demo)
  /* Data is derived before authorization branches to preserve hook order. */
  /*
    const allOrders = mergeOrdersWithMock(mockOrders);
    
    // Produtos APENAS desta fornecedora
    const supplierProducts = products.filter((p) => p.supplierId === supplierId);

    // Vendas APENAS desta fornecedora
    const supplierOrders = allOrders.filter((order) =>
      order.items.some((item) => item.supplierId === supplierId)
    );
    const supplierOrderItems = [];

    supplierOrders.forEach((order) => {
      order.items
        .filter((item) => item.supplierId === supplierId)
        .forEach((item) => {
          supplierOrderItems.push(item);
        });
    });

    // Contar produtos disponíveis
    const availableProducts = supplierProducts.filter((p) => p.available).length;

    // Calcular valores financeiros
    let totalSales = 0;
    let totalProductsSold = 0;
    let supplierShare = 0;

    if (supplierOrderItems.length > 0) {
      const split = calculateOrderSplitBySupplier(supplierOrderItems);
      const supplierSplit = split.bySupplier.find((s) => s.supplierId === supplierId);
      if (supplierSplit) {
        totalSales = supplierSplit.grossAmount;
        supplierShare = supplierSplit.supplierShare;
      }

      totalProductsSold = supplierOrderItems.reduce((sum, item) => sum + item.quantity, 0);
    }

    return {
      products: supplierProducts,
      orders: supplierOrders,
      orderItems: supplierOrderItems,
      totalSales: roundCurrency(totalSales),
      totalProductsSold,
      supplierShare: roundCurrency(supplierShare),
      availableProducts,
    };
  }, [supplierId]); */

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Painel da Fornecedora</h1>
        <p className={styles.subtitle}>
          Bem-vinda, <strong>{supplier.name}</strong>
        </p>
      </div>

      {/* Cards de Métricas */}
      <div className={styles.cards}>
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Produtos Cadastrados</h3>
            <span className={styles.icon}>📦</span>
          </div>
          <div className={styles.cardValue}>{data.products.length}</div>
          <div className={styles.cardSubtext}>
            {data.availableProducts} disponíveis
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Produtos Vendidos</h3>
            <span className={styles.icon}>✅</span>
          </div>
          <div className={styles.cardValue}>{data.totalProductsSold}</div>
          <div className={styles.cardSubtext}>Total de peças vendidas</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Total de Vendas</h3>
            <span className={styles.icon}>💰</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(data.totalSales)}</div>
          <div className={styles.cardSubtext}>Valor bruto total</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Valor Acumulado</h3>
            <span className={styles.icon}>💳</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(data.supplierShare)}</div>
          <div className={styles.cardSubtext}>75% das vendas</div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Quantidade de Pedidos</h3>
            <span className={styles.icon}>📋</span>
          </div>
          <div className={styles.cardValue}>{data.orders.length}</div>
          <div className={styles.cardSubtext}>Pedidos processados</div>
        </div>
      </div>

      {/* Seção de Produtos */}
      <div className={styles.section}>
        <h2>Meus Produtos ({data.products.length})</h2>
        {data.products.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você ainda não cadastrou nenhum produto.</p>
          </div>
        ) : (
          <div className={styles.productsList}>
            {data.products.map((product) => (
              <div key={product.id} className={styles.productCard}>
                <div className={styles.productCardHeader}>
                  <h4>{product.name}</h4>
                  <span
                    className={
                      styles.availableBadge +
                      ' ' +
                      (product.available ? styles.available : styles.unavailable)
                    }
                  >
                    {product.available ? 'Disponível' : 'Indisponível'}
                  </span>
                </div>
                <div className={styles.productCardBody}>
                  <p>
                    <strong>Preço:</strong> {formatPrice(product.price)}
                  </p>
                  <p>
                    <strong>Categoria:</strong> {product.category}
                  </p>
                  <p>
                    <strong>Tamanho:</strong> {product.size}
                  </p>
                  <p>
                    <strong>Marca:</strong> {product.brand}
                  </p>
                  <p>
                    <strong>Condição:</strong> {product.condition}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Seção de Vendas */}
      <div className={styles.section}>
        <h2>Histórico de Vendas ({data.orders.length})</h2>
        {data.orders.length === 0 ? (
          <div className={styles.emptyState}>
            <p>Você ainda não possui nenhuma venda registrada.</p>
          </div>
        ) : (
          <div className={styles.ordersTableWrapper}>
            <table className={styles.ordersTable}>
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Produtos</th>
                  <th>Valor Total</th>
                  <th>Seu Valor (75%)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.orders.map((order) => {
                  const orderTotal = order.items.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  );
                  const orderItems = order.items.filter((item) => item.supplierId === supplierId);
                  const supplierOrderTotal = orderItems.reduce(
                    (sum, item) => sum + item.price * item.quantity,
                    0
                  );
                  const supplierValue = roundCurrency(supplierOrderTotal * 0.75);

                  return (
                    <tr key={order.id}>
                      <td className={styles.cellId}>
                        <strong>{order.id}</strong>
                      </td>
                      <td>{formatDate(order.date)}</td>
                      <td>{order.clientName}</td>
                      <td>{orderItems.length}</td>
                      <td className={styles.cellMoney}>{formatPrice(orderTotal)}</td>
                      <td className={styles.cellMoney + ' ' + styles.cellSupplier}>
                        {formatPrice(supplierValue)}
                      </td>
                      <td>
                        <span
                          className={
                            styles.status + ' ' + styles['status-' + order.status]
                          }
                        >
                          {order.status === 'entregue'
                            ? 'Entregue'
                            : order.status === 'em_transito'
                            ? 'Em trânsito'
                            : 'Processando'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Informações de Segurança */}
      <div className={styles.securityNote}>
        <h3>🔒 Informações de Privacidade</h3>
        <ul>
          <li>Você consegue visualizar apenas seus próprios produtos e vendas.</li>
          <li>Não é possível visualizar dados de outras fornecedoras.</li>
          <li>Não é possível visualizar informações privadas de clientes.</li>
          <li>Os valores mostrados já incluem o cálculo de 75% automaticamente.</li>
        </ul>
      </div>
    </div>
  );
}
