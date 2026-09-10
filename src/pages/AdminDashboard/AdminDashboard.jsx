import FulfillmentInfo from '../../components/features/FulfillmentInfo';
import { useConfirmation } from '../../hooks/useConfirmation.jsx';
/**
 * AdminDashboard.jsx
 *
 * Painel administrativo com visão geral das vendas, pedidos e distribuição financeira.
 * Protegido para usuários com papel 'administradora'.
 * Utiliza exclusivamente financial.js para cálculos.
 */

import AdminSidebar from '../../components/admin/AdminSidebar/AdminSidebar.jsx';
import { useMemo, useEffect, useState } from 'react';
import { normalizeOrder, getRealOrders } from '../../data/orderService.js';
import { calculateOrderSplitBySupplier, calculateTenPercentMetric, roundCurrency } from '../../data/financial.js';
import styles from './AdminDashboard.module.css';
import { Link } from 'react-router-dom';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export default function AdminDashboard() {
  const [confirmAction, confirmationDialog] = useConfirmation();
  const [allOrders, setAllOrders] = useState(() => getRealOrders());

  useEffect(() => {
    fetch('/api/orders', { credentials: 'include' })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.orders)) {
          setAllOrders(data.orders.map(normalizeOrder));
        }
      })
      .catch(() => {});
  }, []);

  const [actionError, setActionError] = useState('');
  const [busy, setBusy] = useState(false);
  async function changeOrder(order, cancel = false) {
    if (busy) return;
    setBusy(true); setActionError('');
    try {
      const response = await fetch('/api/orders?id=' + encodeURIComponent(order.id), { method: 'PATCH', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cancel ? {status:'cancelado',paymentStatus:'canceled'} : {status:'processando',paymentStatus:'paid',paymentMethod:'pix'}) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.erro);
      setAllOrders(previous => previous.map(item => item.id === order.id ? normalizeOrder(data.order) : item));
    } catch (error) { setActionError(error.message); } finally { setBusy(false); }
  }
  const metrics = useMemo(() => {
    const paidOrders = allOrders.filter(order => order.paymentStatus === 'paid');
    const totalSales = paidOrders.reduce((sum, order) => {
      const total = Number(order?.total || 0);
      const shipping = Number(order?.shipping || 0);
      return sum + Math.max(total - shipping, 0);
    }, 0);

    const totalOrders = allOrders.length;
    const totalProductsSold = paidOrders.reduce(
      (sum, order) => sum + order.items.reduce((s, item) => s + Number(item.quantity || 0), 0),
      0
    );
    const orderItems = paidOrders.flatMap((order) => order.items);
    const split = calculateOrderSplitBySupplier(orderItems);
    const metric10 = calculateTenPercentMetric(totalSales);

    return {
      totalSales: roundCurrency(totalSales),
      totalOrders,
      totalProductsSold,
      totalSupplierShare: split.totalSupplierShare,
      totalAdminShare: split.totalAdminShare,
      metric10,
    };
  }, [allOrders]);

  return (
  <div className={styles.adminLayout}>
    <AdminSidebar />

    <main className={styles.container}>
      {confirmationDialog}
      {actionError && <p role="alert">{actionError}</p>}
      <div className={styles.header}>
        <h1>Painel Administrativo</h1>
        <p className={styles.subtitle}>Visão geral de vendas, fornecedoras e distribuição financeira</p>
      </div>

      <div className={styles.cards}>
        {/* Total de Vendas */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Total de Vendas</h3>
            <span className={styles.icon}>💰</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(metrics.totalSales)}</div>
          <div className={styles.cardSubtext}>Valor total bruto</div>
        </div>

        {/* Total de Pedidos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Total de Pedidos</h3>
            <span className={styles.icon}>📦</span>
          </div>
          <div className={styles.cardValue}>{metrics.totalOrders}</div>
          <div className={styles.cardSubtext}>Pedidos processados</div>
        </div>

        {/* Produtos Vendidos */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Produtos Vendidos</h3>
            <span className={styles.icon}>🛍️</span>
          </div>
          <div className={styles.cardValue}>{metrics.totalProductsSold}</div>
          <div className={styles.cardSubtext}>Quantidade total de peças</div>
        </div>

        {/* Valor Fornecedoras */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Valor às Fornecedoras</h3>
            <span className={styles.icon}>👥</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(metrics.totalSupplierShare)}</div>
          <div className={styles.cardSubtext}>75% das vendas</div>
        </div>

        {/* Valor Administradora */}
        <div className={styles.card}>
          <div className={styles.cardHeader}>
            <h3>Valor à Administradora</h3>
            <span className={styles.icon}>💳</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(metrics.totalAdminShare)}</div>
          <div className={styles.cardSubtext}>25% das vendas</div>
        </div>

        {/* Métrica 10% */}
        <div className={styles.card + ' ' + styles.cardMetric}>
          <div className={styles.cardHeader}>
            <h3>Métrica Separada 10%</h3>
            <span className={styles.icon}>📊</span>
          </div>
          <div className={styles.cardValue}>{formatPrice(metrics.metric10)}</div>
          <div className={styles.cardSubtext}>Calculada separadamente</div>
        </div>

      </div>

      {/* Resumo Verificação */}
      <div className={styles.summary}>
        <div className={styles.summaryBox}>
          <h3>Verificação de Totais</h3>
          <div className={styles.summaryLine}>
            <span>Valor às fornecedoras (75%):</span>
            <strong>{formatPrice(metrics.totalSupplierShare)}</strong>
          </div>
          <div className={styles.summaryLine}>
            <span>Valor à administradora (25%):</span>
            <strong>{formatPrice(metrics.totalAdminShare)}</strong>
          </div>
          <div className={styles.summaryLineTotal}>
            <span>Total de vendas (75% + 25%):</span>
            <strong>{formatPrice(metrics.totalSupplierShare + metrics.totalAdminShare)}</strong>
          </div>
          <div className={styles.summaryLine}>
            <span>Métrica 10% (separada):</span>
            <strong>{formatPrice(metrics.metric10)}</strong>
          </div>
          <div className={styles.summaryNote}>
            ℹ️ Os 10% são uma métrica separada. A divisão principal é 75% + 25% = 100% das vendas.
          </div>
        </div>
      </div>
      {/* Pedidos recentes */}
      <section className={styles.ordersSection}>
        <div className={styles.ordersHeader}>
          <div>
            <h2>📦 Pedidos recentes</h2>
            <p>Pedidos realizados na loja</p>
          </div>

          <span className={styles.ordersCount}>
            {metrics.totalOrders} pedidos
          </span>
        </div>

        <div className={styles.ordersList}>
          {allOrders
            .slice()
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .slice(0, 10)
            .map((order) => (
              <div
                key={order.id}
                className={styles.orderRow}
              >
                <div className={styles.orderMain}>
                  <strong>{order.id}</strong>

                  <span>
                    {order.customerName ||
                      order.clientName ||
                      'Cliente'}
                  </span>

                  <small>
                    {new Date(order.date + 'T12:00:00').toLocaleDateString('pt-BR')}
                  </small>
                </div>

                <div className={styles.orderStatus}>
                  <span
                    className={`${styles.status} ${
                      styles[order.status] || ''
                    }`}
                  >
                    {order.status === 'aguardando_pagamento'
                      ? 'Aguardando pagamento'
                      : order.status === 'em_transito'
                        ? 'Em trânsito'
                        : order.status === 'processando'
                          ? 'Processando'
                          : order.status === 'entregue'
                            ? 'Entregue'
                            : order.status === 'cancelado'
                              ? 'Cancelado'
                              : order.status}
                  </span>

                  <strong>
                    {formatPrice(order.total)}
                  </strong>
                </div>

                <FulfillmentInfo order={order} />
                {order.paymentStatus !== 'paid' && order.status !== 'cancelado' && <div>
                  <span>{order.paymentStatus === 'processing' ? 'Cliente informou pagamento. Confira o recebimento.' : 'Aguardando PIX'}</span>
                  <button disabled={busy} onClick={async () => { if (await confirmAction('O valor entrou na conta da loja? Confirme apenas após conferir o recebimento.')) changeOrder(order); }}>Confirmar recebimento</button>
                  <button disabled={busy} onClick={async () => { if (await confirmAction('Cancelar o pedido e liberar as peças?')) changeOrder(order, true); }}>Cancelar pedido</button>
                </div>}
                {order.id.startsWith('ORDER-') && (
                  <Link
                    to={`/pedidos/${order.id}`}
                    className={styles.viewOrder}
                  >
                    Ver pedido →
                  </Link>
                )}
              </div>
            ))}
        </div>
      </section>
            {/* Controle Financeiro */}
      <section className={styles.financeControl}>
        <div className={styles.financeHeader}>
          <h2>💰 Controle Financeiro</h2>
          <p>
            Acompanhamento da divisão financeira das vendas.
          </p>
        </div>

        <div className={styles.financeGrid}>

          {/* 25% Administradora */}
          <div className={`${styles.financeBox} ${styles.financeAdmin}`}>
            <h3>💰 Administradora — 25%</h3>

            <div className={styles.financeValue}>
              {formatPrice(metrics.totalAdminShare)}
            </div>

            <div className={styles.financeDescription}>
              Valor acumulado da administradora
            </div>
          </div>

          {/* 75% Fornecedoras */}
          <div className={`${styles.financeBox} ${styles.financeSupplier}`}>
            <h3>👥 Fornecedoras — 75%</h3>

            <div className={styles.financeValue}>
              {formatPrice(metrics.totalSupplierShare)}
            </div>

            <div className={styles.financeDescription}>
              Valor destinado às fornecedoras
            </div>
          </div>

          {/* Métrica 10% */}
          <div className={`${styles.financeBox} ${styles.financeMetric}`}>
            <h3>📊 Métrica separada — 10%</h3>

            <div className={styles.financeValue}>
              {formatPrice(metrics.metric10)}
            </div>

            <div className={styles.financeDescription}>
              Métrica calculada separadamente
            </div>
          </div>

        </div>

        {/* Tabela por pedido */}
        <div className={styles.financeTableWrapper}>

          <h3>🧾 Controle por pedido</h3>

          <table className={styles.financeTable}>

            <thead>
              <tr>
                <th>Pedido</th>
                <th>Venda</th>
                <th>75% Fornecedora</th>
                <th>25% Administradora</th>
                <th>10% Métrica</th>
              </tr>
            </thead>

            <tbody>
              {allOrders
                     .filter((order) => order.paymentStatus === 'paid')
                     .sort(
                  (a, b) =>
                    new Date(b.date) - new Date(a.date)
                )
                .map((order) => {

                  const orderItems = order.items || [];

                  const orderSales = orderItems.reduce(
                    (sum, item) =>
                      sum +
                      Number(item.price || 0) *
                        Number(item.quantity || 1),
                    0
                  );

                  const orderSupplier =
                    calculateOrderSplitBySupplier(
                      orderItems
                    );

                  const adminValue =
                    roundCurrency(
                      orderSales * 0.25
                    );

                  const metricValue =
                    calculateTenPercentMetric(
                      orderSales
                    );

                  return (
                    <tr key={order.id}>

                      <td>
                        <strong>{order.id}</strong>
                      </td>

                      <td>
                        {formatPrice(orderSales)}
                      </td>

                      <td className={styles.financeSupplierValue}>
                        {formatPrice(
                          orderSupplier.totalSupplierShare
                        )}
                      </td>

                      <td className={styles.financeAdminValue}>
                        {formatPrice(adminValue)}
                      </td>

                      <td className={styles.financeMetricValue}>
                        {formatPrice(metricValue)}
                      </td>

                    </tr>
                  );
                })}
            </tbody>

          </table>

        </div>
      </section>
{/* Links de Navegação */}
<div className={styles.navigation}>
  <a href="/admin/tabela-financeira" className={styles.link}>
    📊 Ver Tabela Financeira Detalhada
  </a>

  <a href="/admin/fornecedoras" className={styles.link}>
    👥 Gerenciar Fornecedoras
  </a>

  <Link to="/admin/repasses" className={styles.link}>
    💸 Controle de Repasses
  </Link>
</div>

    </main>
  </div>
  );
}
