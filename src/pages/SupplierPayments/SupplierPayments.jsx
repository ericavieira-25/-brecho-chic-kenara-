import { useMemo, useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useGuard } from '../../hooks/useGuard.js';
import { USER_ROLES } from '../../data/roles.js';
import { mockOrders } from '../../data/orders.js';
import { mergeOrdersWithMock } from '../../data/orderService.js';
import {
  getSupplierPayment,
  markSupplierPaymentAsPaid,
  markSupplierPaymentAsPending,
} from '../../data/supplierPayments.js';
import {
  calculateSupplierShare,
  roundCurrency,
} from '../../data/financial.js';
import styles from './SupplierPayments.module.css';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(date) {
  if (!date) return '-';

  return new Date(date).toLocaleDateString('pt-BR');
}

export default function SupplierPayments() {
  const { isAuth, hasRole } = useGuard();
  const [, setRefresh] = useState(0);

  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/" replace />;
  }

  const payments = useMemo(() => {
    const orders = mergeOrdersWithMock(mockOrders);

    const result = [];

    orders.forEach((order) => {
      if (!order.items) return;

      const suppliers = {};

      order.items.forEach((item) => {
        const supplierId =
          item.supplierId ||
          item.fornecedoraId ||
          'supplier-unknown';

        const supplierName =
          item.supplierName ||
          item.fornecedoraName ||
          'Fornecedora não identificada';

        const amount =
          Number(item.price || 0) *
          Number(item.quantity || item.qty || 1);

        if (!suppliers[supplierId]) {
          suppliers[supplierId] = {
            supplierId,
            supplierName,
            amount: 0,
          };
        }

        suppliers[supplierId].amount += amount;
      });

      Object.values(suppliers).forEach((supplier) => {
        const supplierShare = calculateSupplierShare(
          supplier.amount
        );

        const payment = getSupplierPayment(
          order.id,
          supplier.supplierId
        );

        result.push({
          orderId: order.id,
          orderDate: order.date,
          supplierId: supplier.supplierId,
          supplierName: supplier.supplierName,
          grossAmount: roundCurrency(supplier.amount),
          supplierShare,
          status: payment.status,
          paidAt: payment.paidAt,
        });
      });
    });

    return result.sort(
      (a, b) =>
        new Date(b.orderDate) -
        new Date(a.orderDate)
    );
  }, [setRefresh]);

  const totalToPay = roundCurrency(
    payments
      .filter((payment) => payment.status === 'pendente')
      .reduce(
        (sum, payment) => sum + payment.supplierShare,
        0
      )
  );

  const totalPaid = roundCurrency(
    payments
      .filter((payment) => payment.status === 'pago')
      .reduce(
        (sum, payment) => sum + payment.supplierShare,
        0
      )
  );

  function handleTogglePayment(payment) {
    if (payment.status === 'pago') {
      markSupplierPaymentAsPending(
        payment.orderId,
        payment.supplierId
      );
    } else {
      markSupplierPaymentAsPaid(
        payment.orderId,
        payment.supplierId
      );
    }

    setRefresh((value) => value + 1);
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <Link
            to="/admin"
            className={styles.back}
          >
            ← Voltar ao painel
          </Link>

          <h1>💸 Repasses às Fornecedoras</h1>

          <p>
            Controle dos valores de 75% destinados às
            fornecedoras.
          </p>
        </div>
      </div>

      <div className={styles.summary}>
        <div className={styles.summaryCard}>
          <span>🟠 Total pendente</span>
          <strong>{formatPrice(totalToPay)}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>🟢 Total já pago</span>
          <strong>{formatPrice(totalPaid)}</strong>
        </div>

        <div className={styles.summaryCard}>
          <span>📦 Repasses</span>
          <strong>{payments.length}</strong>
        </div>
      </div>

      {payments.length === 0 ? (
        <div className={styles.empty}>
          <div>📦</div>
          <h2>Nenhum repasse encontrado</h2>
          <p>
            Os repasses aparecerão aqui quando houver
            pedidos com produtos de fornecedoras.
          </p>
        </div>
      ) : (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Fornecedora</th>
                <th>Valor da venda</th>
                <th>75% a repassar</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ação</th>
              </tr>
            </thead>

            <tbody>
              {payments.map((payment) => (
                <tr
                  key={`${payment.orderId}-${payment.supplierId}`}
                >
                  <td>
                    <strong>{payment.orderId}</strong>
                    <small>
                      {formatDate(payment.orderDate)}
                    </small>
                  </td>

                  <td>
                    {payment.supplierName}
                  </td>

                  <td>
                    {formatPrice(payment.grossAmount)}
                  </td>

                  <td className={styles.amount}>
                    {formatPrice(
                      payment.supplierShare
                    )}
                  </td>

                  <td>
                    <span
                      className={
                        payment.status === 'pago'
                          ? styles.paid
                          : styles.pending
                      }
                    >
                      {payment.status === 'pago'
                        ? '🟢 Pago'
                        : '🟠 Pendente'}
                    </span>
                  </td>

                  <td>
                    {formatDate(payment.paidAt)}
                  </td>

                  <td>
                    <button
                      type="button"
                      className={
                        payment.status === 'pago'
                          ? styles.undoButton
                          : styles.payButton
                      }
                      onClick={() =>
                        handleTogglePayment(payment)
                      }
                    >
                      {payment.status === 'pago'
                        ? '↩️ Voltar para pendente'
                        : '✅ Marcar como pago'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className={styles.info}>
        <strong>ℹ️ Como funciona</strong>

        <p>
          Cada produto vendido gera um valor de 75%
          destinado à sua fornecedora.
        </p>

        <p>
          Marcar um repasse como pago apenas registra
          que o valor foi entregue à fornecedora.
        </p>

        <p>
          O controle dos 25% da administradora e a
          métrica separada de 10% continuam
          independentes.
        </p>
      </div>
    </div>
  );
}