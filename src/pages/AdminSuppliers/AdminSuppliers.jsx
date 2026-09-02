/**
 * AdminSuppliers.jsx
 *
 * Gerenciamento financeiro das fornecedoras.
 * Mostra vendas, 75% da fornecedora e controle de repasses.
 */

import { useMemo, useState } from 'react';
import { useGuard } from '../../hooks/useGuard.js';
import { Navigate, Link } from 'react-router-dom';
import { USER_ROLES } from '../../data/roles.js';
import { suppliers } from '../../data/suppliers.js';
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
import styles from './AdminSuppliers.module.css';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}

export default function AdminSuppliers() {
  const { isAuth, hasRole } = useGuard();

  const [, forceUpdate] = useState(0);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/" replace />;
  }

  const suppliersData = useMemo(() => {
    const allOrders = mergeOrdersWithMock(mockOrders);

    return suppliers.map((supplier) => {
      const supplierProducts = products.filter(
        (product) => product.supplierId === supplier.id
      );

      const supplierOrderItems = [];

      allOrders.forEach((order) => {
        order.items
          .filter((item) => item.supplierId === supplier.id)
          .forEach((item) => {
            supplierOrderItems.push({
              ...item,
              orderId: order.id,
            });
          });
      });

      let totalSales = 0;
      let supplierShare = 0;
      let adminShare = 0;

      if (supplierOrderItems.length > 0) {
        const split = calculateOrderSplitBySupplier(
          supplierOrderItems
        );

        const supplierSplit = split.bySupplier.find(
          (item) => item.supplierId === supplier.id
        );

        if (supplierSplit) {
          totalSales = supplierSplit.grossAmount;
          supplierShare = supplierSplit.supplierShare;
          adminShare = supplierSplit.adminShare;
        }
      }

      /*
       * Calculamos os repasses individualmente.
       * Isso permite saber exatamente quanto já foi pago.
       */
      let paidAmount = 0;
      let pendingAmount = 0;

      const paymentGroups = {};

      supplierOrderItems.forEach((item) => {
        const amount =
          Number(item.price || 0) *
          Number(item.quantity || 1);

        const supplierAmount = roundCurrency(amount * 0.75);

        const key = `${item.orderId}-${supplier.id}`;

        if (!paymentGroups[key]) {
          paymentGroups[key] = {
            amount: 0,
            orderId: item.orderId,
          };
        }

        paymentGroups[key].amount = roundCurrency(
          paymentGroups[key].amount + supplierAmount
        );
      });

      Object.entries(paymentGroups).forEach(
        ([key, payment]) => {
          const orderId = payment.orderId;

          const paymentStatus = getSupplierPayment(
            orderId,
            supplier.id
          );

          if (paymentStatus.status === 'pago') {
            paidAmount = roundCurrency(
              paidAmount + payment.amount
            );
          } else {
            pendingAmount = roundCurrency(
              pendingAmount + payment.amount
            );
          }
        }
      );

      return {
        ...supplier,
        productCount: supplierProducts.length,

        totalOrders: new Set(
          supplierOrderItems.map((item) => item.orderId)
        ).size,

        totalProductsSold: supplierOrderItems.reduce(
          (sum, item) =>
            sum + Number(item.quantity || 1),
          0
        ),

        totalSales: roundCurrency(totalSales),

        supplierShare: roundCurrency(supplierShare),

        adminShare: roundCurrency(adminShare),

        paidAmount: roundCurrency(paidAmount),

        pendingAmount: roundCurrency(pendingAmount),
      };
    });
  }, [forceUpdate]);

  const totals = useMemo(() => {
    return {
      productCount: suppliersData.reduce(
        (sum, supplier) =>
          sum + supplier.productCount,
        0
      ),

      totalOrders: suppliersData.reduce(
        (sum, supplier) =>
          sum + supplier.totalOrders,
        0
      ),

      totalProductsSold: suppliersData.reduce(
        (sum, supplier) =>
          sum + supplier.totalProductsSold,
        0
      ),

      totalSales: roundCurrency(
        suppliersData.reduce(
          (sum, supplier) =>
            sum + supplier.totalSales,
          0
        )
      ),

      supplierShare: roundCurrency(
        suppliersData.reduce(
          (sum, supplier) =>
            sum + supplier.supplierShare,
          0
        )
      ),

      adminShare: roundCurrency(
        suppliersData.reduce(
          (sum, supplier) =>
            sum + supplier.adminShare,
          0
        )
      ),

      paidAmount: roundCurrency(
        suppliersData.reduce(
          (sum, supplier) =>
            sum + supplier.paidAmount,
          0
        )
      ),

      pendingAmount: roundCurrency(
        suppliersData.reduce(
          (sum, supplier) =>
            sum + supplier.pendingAmount,
          0
        )
      ),
    };
  }, [suppliersData]);

  function handlePayAllForSupplier(supplier) {
    const allOrders = mergeOrdersWithMock(mockOrders);

    allOrders.forEach((order) => {
      const hasSupplier = order.items.some(
        (item) => item.supplierId === supplier.id
      );

      if (hasSupplier) {
        markSupplierPaymentAsPaid(
          order.id,
          supplier.id
        );
      }
    });

    forceUpdate((value) => value + 1);
  }

  function handlePendingAllForSupplier(supplier) {
    const allOrders = mergeOrdersWithMock(mockOrders);

    allOrders.forEach((order) => {
      const hasSupplier = order.items.some(
        (item) => item.supplierId === supplier.id
      );

      if (hasSupplier) {
        markSupplierPaymentAsPending(
          order.id,
          supplier.id
        );
      }
    });

    forceUpdate((value) => value + 1);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Gerenciamento de Fornecedoras</h1>

        <p className={styles.subtitle}>
          Controle de vendas, repasses dos 75% e valores
          da administradora
        </p>
      </div>

      {/* RESUMO GERAL */}

      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span>💰 Total vendido</span>
          <strong>{formatPrice(totals.totalSales)}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>👥 Total das fornecedoras</span>
          <strong>
            {formatPrice(totals.supplierShare)}
          </strong>
        </div>

        <div className={styles.summaryCard}>
          <span>✅ Já pago</span>
          <strong>
            {formatPrice(totals.paidAmount)}
          </strong>
        </div>

        <div className={styles.summaryCard}>
          <span>⏳ Pendente</span>
          <strong>
            {formatPrice(totals.pendingAmount)}
          </strong>
        </div>

        <div className={styles.summaryCard}>
          <span>💳 Administradora (25%)</span>
          <strong>
            {formatPrice(totals.adminShare)}
          </strong>
        </div>
      </div>

      {/* TABELA */}

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Status</th>
              <th>Produtos</th>
              <th>Vendidos</th>
              <th>Pedidos</th>
              <th>Total vendido</th>
              <th>75% fornecedora</th>
              <th>Já pago</th>
              <th>Pendente</th>
              <th>Ações</th>
            </tr>
          </thead>

          <tbody>
            {suppliersData.map((supplier) => (
              <tr key={supplier.id}>
                <td className={styles.cellName}>
                  <strong>{supplier.name}</strong>
                </td>

                <td>
                  <span
                    className={
                      styles.badge +
                      ' ' +
                      styles[
                        'badge-' +
                          supplier.status
                      ]
                    }
                  >
                    {supplier.status === 'active'
                      ? 'Ativa'
                      : supplier.status}
                  </span>
                </td>

                <td className={styles.cellNumber}>
                  {supplier.productCount}
                </td>

                <td className={styles.cellNumber}>
                  {supplier.totalProductsSold}
                </td>

                <td className={styles.cellNumber}>
                  {supplier.totalOrders}
                </td>

                <td className={styles.cellMoney}>
                  {formatPrice(
                    supplier.totalSales
                  )}
                </td>

                <td
                  className={
                    styles.cellMoney +
                    ' ' +
                    styles.cellSupplier
                  }
                >
                  {formatPrice(
                    supplier.supplierShare
                  )}
                </td>

                <td
                  className={
                    styles.cellMoney +
                    ' ' +
                    styles.cellPaid
                  }
                >
                  {formatPrice(
                    supplier.paidAmount
                  )}
                </td>

                <td
                  className={
                    styles.cellMoney +
                    ' ' +
                    styles.cellPending
                  }
                >
                  {formatPrice(
                    supplier.pendingAmount
                  )}
                </td>

                <td className={styles.cellAction}>
                  <div
                    className={
                      styles.actionButtons
                    }
                  >
                    <Link
                      to={`/admin/fornecedoras/${supplier.id}`}
                      className={styles.viewLink}
                    >
                      Detalhes
                    </Link>

                    {supplier.pendingAmount > 0 && (
                      <button
                        type="button"
                        className={
                          styles.payButton
                        }
                        onClick={() =>
                          handlePayAllForSupplier(
                            supplier
                          )
                        }
                      >
                        ✓ Pagar
                      </button>
                    )}

                    {supplier.paidAmount > 0 && (
                      <button
                        type="button"
                        className={
                          styles.pendingButton
                        }
                        onClick={() =>
                          handlePendingAllForSupplier(
                            supplier
                          )
                        }
                      >
                        ↩ Pendente
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

          <tfoot>
            <tr className={styles.totalRow}>
              <td colSpan="2">
                <strong>TOTAL</strong>
              </td>

              <td className={styles.cellNumber}>
                <strong>
                  {totals.productCount}
                </strong>
              </td>

              <td className={styles.cellNumber}>
                <strong>
                  {totals.totalProductsSold}
                </strong>
              </td>

              <td className={styles.cellNumber}>
                <strong>
                  {totals.totalOrders}
                </strong>
              </td>

              <td className={styles.cellMoney}>
                <strong>
                  {formatPrice(
                    totals.totalSales
                  )}
                </strong>
              </td>

              <td
                className={
                  styles.cellMoney +
                  ' ' +
                  styles.cellSupplier
                }
              >
                <strong>
                  {formatPrice(
                    totals.supplierShare
                  )}
                </strong>
              </td>

              <td
                className={
                  styles.cellMoney +
                  ' ' +
                  styles.cellPaid
                }
              >
                <strong>
                  {formatPrice(
                    totals.paidAmount
                  )}
                </strong>
              </td>

              <td
                className={
                  styles.cellMoney +
                  ' ' +
                  styles.cellPending
                }
              >
                <strong>
                  {formatPrice(
                    totals.pendingAmount
                  )}
                </strong>
              </td>

              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* INFORMAÇÃO */}

      <div className={styles.infoBox}>
        <h3>💡 Como funciona o controle</h3>

        <ul>
          <li>
            <strong>75%</strong> de cada venda
            pertencem à fornecedora.
          </li>

          <li>
            <strong>25%</strong> de cada venda
            pertencem à administradora.
          </li>

          <li>
            <strong>Já pago</strong> mostra os
            repasses marcados como pagos.
          </li>

          <li>
            <strong>Pendente</strong> mostra o que
            ainda precisa ser repassado.
          </li>

          <li>
            O pagamento é salvo no navegador para
            manter o status após atualizar a página.
          </li>
        </ul>
      </div>

      {/* VOLTAR */}

      <div className={styles.footer}>
        <Link
          to="/admin"
          className={styles.backLink}
        >
          ← Voltar ao Painel Administrativo
        </Link>
      </div>
    </div>
  );
}