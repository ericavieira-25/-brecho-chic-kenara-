/**
 * SupplierDetails.jsx
 *
 * Página de detalhes de uma fornecedora específica.
 * Mostra informações, produtos, vendas e controle individual
 * dos repasses de 75%.
 */

import { useMemo, useState } from 'react';
import { Navigate, useParams, Link } from 'react-router-dom';

import { useGuard } from '../../hooks/useGuard.js';
import { USER_ROLES } from '../../data/roles.js';
import { getSupplierById } from '../../data/suppliers.js';
import { products } from '../../data/products.js';
import { mockOrders } from '../../data/orders.js';
import { mergeOrdersWithMock } from '../../data/orderService.js';

import {
  calculateOrderSplitBySupplier,
  roundCurrency,
} from '../../data/financial.js';

import {
  getSupplierPayment,
  markSupplierPaymentAsPaid,
  markSupplierPaymentAsPending,
} from '../../data/supplierPayments.js';

import styles from './SupplierDetails.module.css';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

function formatDate(dateStr) {
  if (!dateStr) {
    return 'Não informado';
  }

  const date = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return 'Não informado';
  }

  return date.toLocaleDateString('pt-BR');
}

function getStatusLabel(status) {
  switch (status) {
    case 'aguardando_pagamento':
      return 'Aguardando pagamento';

    case 'processando':
      return 'Processando';

    case 'em_transito':
      return 'Em trânsito';

    case 'entregue':
      return 'Entregue';

    case 'cancelado':
      return 'Cancelado';

    default:
      return status || 'Desconhecido';
  }
}

function getQuantity(item) {
  return Number(
    item.quantity ??
      item.qty ??
      1
  );
}

function getItemTotal(item) {
  return (
    Number(item.price || 0) *
    getQuantity(item)
  );
}

export default function SupplierDetails() {
  const { isAuth, hasRole } = useGuard();
  const { supplierId } = useParams();

  /*
   * Contador usado somente para atualizar a tela
   * depois que um pagamento for alterado.
   */
  const [, forceUpdate] = useState(0);

  /*
   * Hooks precisam ser executados sempre na mesma ordem.
   * Por isso o useMemo fica antes dos returns de autorização.
   */
  const supplier = getSupplierById(supplierId);

  const data = useMemo(() => {
    const allOrders = mergeOrdersWithMock(mockOrders);

    /*
     * Produtos da fornecedora.
     */
    const supplierProducts = products.filter(
      (product) =>
        product.supplierId === supplierId
    );

    /*
     * Pedidos que possuem pelo menos um produto
     * desta fornecedora.
     */
    const supplierOrders = allOrders.filter(
      (order) =>
        Array.isArray(order.items) &&
        order.items.some(
          (item) =>
            item.supplierId === supplierId
        )
    );

    /*
     * Itens vendidos pela fornecedora.
     */
    const supplierOrderItems = [];

    supplierOrders.forEach((order) => {
      order.items
        .filter(
          (item) =>
            item.supplierId === supplierId
        )
        .forEach((item) => {
          supplierOrderItems.push({
            ...item,
            orderId: order.id,
            orderDate: order.date,
            orderStatus: order.status,
            customerName:
              order.customerName ||
              order.clientName ||
              'Cliente',
          });
        });
    });

    /*
     * Valores financeiros gerais.
     */
    let totalSales = 0;
    let supplierShare = 0;
    let adminShare = 0;

    if (supplierOrderItems.length > 0) {
      const split =
        calculateOrderSplitBySupplier(
          supplierOrderItems
        );

      const supplierSplit =
        split.bySupplier?.find(
          (item) =>
            item.supplierId === supplierId
        );

      if (supplierSplit) {
        totalSales =
          supplierSplit.grossAmount || 0;

        supplierShare =
          supplierSplit.supplierShare || 0;

        adminShare =
          supplierSplit.adminShare || 0;
      }
    }

    /*
     * Histórico individual de repasses.
     */
    const paymentOrders = supplierOrders
      .map((order) => {
        const items = order.items.filter(
          (item) =>
            item.supplierId === supplierId
        );

        const orderTotal = items.reduce(
          (sum, item) =>
            sum + getItemTotal(item),
          0
        );

        const split =
          calculateOrderSplitBySupplier(items);

        const supplierAmount =
          split.totalSupplierShare || 0;

        const payment =
          getSupplierPayment(
            order.id,
            supplierId
          );

        return {
          orderId: order.id,

          date: order.date,

          customerName:
            order.customerName ||
            order.clientName ||
            'Cliente',

          status: order.status,

          itemCount: items.reduce(
            (sum, item) =>
              sum + getQuantity(item),
            0
          ),

          orderTotal:
            roundCurrency(orderTotal),

          supplierAmount:
            roundCurrency(
              supplierAmount
            ),

          paymentStatus:
            payment?.status ||
            'pendente',

          paidAt:
            payment?.paidAt ||
            null,
        };
      })
      .sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();

        return dateB - dateA;
      });

    /*
     * Total já repassado.
     */
    const paidAmount =
      paymentOrders.reduce(
        (sum, order) =>
          order.paymentStatus === 'pago'
            ? sum + order.supplierAmount
            : sum,
        0
      );

    /*
     * Total ainda pendente.
     */
    const pendingAmount =
      paymentOrders.reduce(
        (sum, order) =>
          order.paymentStatus === 'pendente'
            ? sum + order.supplierAmount
            : sum,
        0
      );

    return {
      products: supplierProducts,

      orders: supplierOrders,

      paymentOrders,

      totalSales:
        roundCurrency(totalSales),

      totalProductsSold:
        supplierOrderItems.reduce(
          (sum, item) =>
            sum + getQuantity(item),
          0
        ),

      supplierShare:
        roundCurrency(supplierShare),

      adminShare:
        roundCurrency(adminShare),

      paidAmount:
        roundCurrency(paidAmount),

      pendingAmount:
        roundCurrency(pendingAmount),
    };
  }, [supplierId, forceUpdate]);

  /*
   * Proteção de autenticação.
   */
  if (!isAuth) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  /*
   * Somente administradores podem acessar.
   */
  if (!hasRole(USER_ROLES.ADMIN)) {
    return (
      <Navigate
        to="/"
        replace
      />
    );
  }

  /*
   * Fornecedora não encontrada.
   */
  if (!supplier) {
    return (
      <div className={styles.container}>
        <div className={styles.notFound}>
          <h2>
            Fornecedora não encontrada
          </h2>

          <p>
            A fornecedora solicitada
            não existe ou foi removida.
          </p>

          <Link to="/admin/fornecedoras">
            ← Voltar para fornecedoras
          </Link>
        </div>
      </div>
    );
  }

  /*
   * Marcar repasse como pago.
   */
  function handleMarkAsPaid(order) {
    markSupplierPaymentAsPaid(
      order.orderId,
      supplierId
    );

    forceUpdate(
      (value) => value + 1
    );
  }

  /*
   * Voltar repasse para pendente.
   */
  function handleMarkAsPending(order) {
    markSupplierPaymentAsPending(
      order.orderId,
      supplierId
    );

    forceUpdate(
      (value) => value + 1
    );
  }

  return (
    <div className={styles.container}>

      {/* CABEÇALHO */}

      <div className={styles.header}>
        <Link
          to="/admin/fornecedoras"
          className={styles.backLink}
          aria-label="Voltar"
        >
          ←
        </Link>

        <div>
          <h1>{supplier.name}</h1>

          <p className={styles.subtitle}>
            Detalhes da fornecedora e
            controle financeiro
          </p>
        </div>
      </div>

      {/* INFORMAÇÕES BÁSICAS */}

      <section className={styles.infoSection}>
        <h2>
          Informações Básicas
        </h2>

        <div className={styles.infoGrid}>

          <div className={styles.infoItem}>
            <label>Status</label>

            <span
              className={
                styles.badge +
                ' ' +
                styles[
                  `badge-${supplier.status}`
                ]
              }
            >
              {supplier.status === 'active'
                ? 'Ativa'
                : supplier.status}
            </span>
          </div>

          <div className={styles.infoItem}>
            <label>E-mail</label>

            <p>
              {supplier.contact?.email ||
                'Não informado'}
            </p>
          </div>

          <div className={styles.infoItem}>
            <label>Telefone</label>

            <p>
              {supplier.contact?.phone ||
                'Não informado'}
            </p>
          </div>

          <div className={styles.infoItem}>
            <label>
              Data de Cadastro
            </label>

            <p>
              {formatDate(
                supplier.createdAt
              )}
            </p>
          </div>

          <div className={styles.infoItem}>
            <label>
              ID da Fornecedora
            </label>

            <p className={styles.code}>
              {supplier.id}
            </p>
          </div>

          <div className={styles.infoItem}>
            <label>
              ID do Usuário
            </label>

            <p className={styles.code}>
              {supplier.userId ||
                'Não associado'}
            </p>
          </div>

        </div>
      </section>

      {/* CONTROLE FINANCEIRO */}

      <section className={styles.financeSection}>
        <h2>
          💰 Controle Financeiro
        </h2>

        <div className={styles.financeGrid}>

          <div className={styles.financeCard}>
            <span>
              Total vendido
            </span>

            <strong>
              {formatPrice(
                data.totalSales
              )}
            </strong>
          </div>

          <div className={styles.financeCard}>
            <span>
              75% da fornecedora
            </span>

            <strong>
              {formatPrice(
                data.supplierShare
              )}
            </strong>
          </div>

          <div className={styles.financeCard}>
            <span>
              ✅ Já repassado
            </span>

            <strong>
              {formatPrice(
                data.paidAmount
              )}
            </strong>
          </div>

          <div className={styles.financeCard}>
            <span>
              ⏳ Pendente
            </span>

            <strong>
              {formatPrice(
                data.pendingAmount
              )}
            </strong>
          </div>

          <div className={styles.financeCard}>
            <span>
              25% da administradora
            </span>

            <strong>
              {formatPrice(
                data.adminShare
              )}
            </strong>
          </div>

        </div>
      </section>

      {/* MÉTRICAS */}

      <section className={styles.metricsSection}>
        <h2>
          Métricas de Vendas
        </h2>

        <div className={styles.metricsGrid}>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              Produtos Cadastrados
            </div>

            <div className={styles.metricValue}>
              {data.products.length}
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              Produtos Vendidos
            </div>

            <div className={styles.metricValue}>
              {data.totalProductsSold}
            </div>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricLabel}>
              Pedidos Totais
            </div>

            <div className={styles.metricValue}>
              {data.orders.length}
            </div>
          </div>

        </div>
      </section>

      {/* HISTÓRICO DE REPASSES */}

      <section className={styles.paymentsSection}>

        <div className={styles.paymentsHeader}>

          <div>
            <h2>
              📦 Histórico de Repasses
            </h2>

            <p>
              Controle individual dos
              75% de cada pedido
            </p>
          </div>

          <div className={styles.paymentSummary}>
            <span>
              {data.paymentOrders.length}{' '}
              pedidos
            </span>
          </div>

        </div>

        {data.paymentOrders.length === 0 ? (

          <div className={styles.emptyMessage}>
            <p>
              Nenhum pedido encontrado
              para esta fornecedora.
            </p>
          </div>

        ) : (

          <div className={styles.paymentList}>

            {data.paymentOrders.map(
              (order) => (

                <div
                  key={order.orderId}
                  className={styles.paymentRow}
                >

                  {/* PEDIDO */}

                  <div className={styles.paymentMain}>

                    <strong>
                      {order.orderId}
                    </strong>

                    <span>
                      {order.customerName}
                    </span>

                    <small>
                      {formatDate(
                        order.date
                      )}
                    </small>

                  </div>

                  {/* VENDA */}

                  <div className={styles.paymentInfo}>

                    <span>
                      Venda
                    </span>

                    <strong>
                      {formatPrice(
                        order.orderTotal
                      )}
                    </strong>

                  </div>

                  {/* 75% */}

                  <div className={styles.paymentInfo}>

                    <span>
                      75% fornecedora
                    </span>

                    <strong>
                      {formatPrice(
                        order.supplierAmount
                      )}
                    </strong>

                  </div>

                  {/* STATUS */}

                  <div className={styles.paymentStatus}>

                    {order.paymentStatus ===
                    'pago' ? (

                      <>
                        <span
                          className={
                            styles.paidBadge
                          }
                        >
                          ✓ Pago
                        </span>

                        {order.paidAt && (
                          <small>
                            Pago em{' '}
                            {new Date(
                              order.paidAt
                            ).toLocaleDateString(
                              'pt-BR'
                            )}
                          </small>
                        )}
                      </>

                    ) : (

                      <span
                        className={
                          styles.pendingBadge
                        }
                      >
                        ⏳ Pendente
                      </span>

                    )}

                  </div>

                  {/* AÇÃO */}

                  <div className={styles.paymentAction}>

                    {order.paymentStatus ===
                    'pago' ? (

                      <button
                        type="button"
                        className={
                          styles.pendingButton
                        }
                        onClick={() =>
                          handleMarkAsPending(
                            order
                          )
                        }
                      >
                        ↩ Pendente
                      </button>

                    ) : (

                      <button
                        type="button"
                        className={
                          styles.payButton
                        }
                        onClick={() =>
                          handleMarkAsPaid(
                            order
                          )
                        }
                      >
                        ✓ Marcar como pago
                      </button>

                    )}

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* PRODUTOS CADASTRADOS */}

      <section className={styles.productsSection}>

        <h2>
          Produtos Cadastrados (
          {data.products.length})
        </h2>

        {data.products.length === 0 ? (

          <div className={styles.emptyMessage}>
            <p>
              Esta fornecedora não possui
              produtos cadastrados.
            </p>
          </div>

        ) : (

          <div className={styles.productsList}>

            {data.products.map(
              (product) => (

                <div
                  key={product.id}
                  className={styles.productItem}
                >

                  <div className={styles.productInfo}>

                    <h4>
                      {product.name}
                    </h4>

                    <p
                      className={
                        styles.productDetail
                      }
                    >
                      Preço:{' '}
                      <strong>
                        {formatPrice(
                          product.price
                        )}
                      </strong>
                    </p>

                    <p
                      className={
                        styles.productDetail
                      }
                    >
                      Categoria:{' '}
                      <strong>
                        {product.category}
                      </strong>
                    </p>

                    <p
                      className={
                        styles.productDetail
                      }
                    >
                      Disponível:{' '}
                      <strong>
                        {product.available
                          ? 'Sim'
                          : 'Não'}
                      </strong>
                    </p>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </section>

      {/* HISTÓRICO DE VENDAS */}

      <section className={styles.ordersSection}>

        <h2>
          Histórico de Vendas (
          {data.orders.length})
        </h2>

        {data.orders.length === 0 ? (

          <div className={styles.emptyMessage}>
            <p>
              Esta fornecedora não possui
              vendas registradas.
            </p>
          </div>

        ) : (

          <div className={styles.ordersTable}>

            <table>

              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Data</th>
                  <th>Cliente</th>
                  <th>Produtos</th>
                  <th>Valor</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>

                {data.orders.map(
                  (order) => {

                    const supplierItems =
                      order.items.filter(
                        (item) =>
                          item.supplierId ===
                          supplierId
                      );

                    const orderTotal =
                      supplierItems.reduce(
                        (sum, item) =>
                          sum +
                          getItemTotal(item),
                        0
                      );

                    const productCount =
                      supplierItems.reduce(
                        (sum, item) =>
                          sum +
                          getQuantity(item),
                        0
                      );

                    return (
                      <tr
                        key={order.id}
                      >

                        <td
                          className={
                            styles.cellId
                          }
                        >
                          <strong>
                            {order.id}
                          </strong>
                        </td>

                        <td>
                          {formatDate(
                            order.date
                          )}
                        </td>

                        <td>
                          {order.customerName ||
                            order.clientName ||
                            'Cliente'}
                        </td>

                        <td>
                          {productCount}
                        </td>

                        <td
                          className={
                            styles.cellMoney
                          }
                        >
                          {formatPrice(
                            orderTotal
                          )}
                        </td>

                        <td>
                          <span
                            className={
                              styles.status +
                              ' ' +
                              styles[
                                `status-${order.status}`
                              ]
                            }
                          >
                            {getStatusLabel(
                              order.status
                            )}
                          </span>
                        </td>

                      </tr>
                    );
                  }
                )}

              </tbody>

            </table>

          </div>

        )}

      </section>

      {/* VOLTAR */}

      <div className={styles.footer}>

        <Link
          to="/admin/fornecedoras"
          className={
            styles.backButtonFull
          }
        >
          ← Voltar ao Gerenciamento de
          Fornecedoras
        </Link>

      </div>

    </div>
  );
}