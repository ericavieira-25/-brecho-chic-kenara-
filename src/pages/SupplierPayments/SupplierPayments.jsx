import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useStoreData } from '../../hooks/useStoreData.js';
import { getSupplierById } from '../../data/suppliers.js';

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

  return new Date(/^\d{4}-\d{2}-\d{2}$/.test(date) ? `${date}T12:00:00` : date).toLocaleDateString('pt-BR');
}

export default function SupplierPayments() {
  const [, setRefresh] = useState(0);
  const {orders, error: loadError} = useStoreData();

  const payments = (() => {

    const result = [];
    orders.forEach((order) => {
      if (!order.items) return;
      const suppliers = {};
      order.items.forEach((item) => {
        const supplierId = item.supplierId || item.fornecedoraId || 'supplier-unknown';
        const supplierName = item.supplierName || item.fornecedoraName || getSupplierById(supplierId)?.name || 'Fornecedora não identificada';
        const amount = Number(item.price || 0) * Number(item.quantity || item.qty || 1);
        if (!suppliers[supplierId]) suppliers[supplierId] = { supplierId, supplierName, amount: 0 };
        suppliers[supplierId].amount += amount;
      });
      Object.values(suppliers).forEach((supplier) => {
        const payment = getSupplierPayment(order.id, supplier.supplierId);
        result.push({ ...supplier, grossAmount: roundCurrency(supplier.amount), orderDate: order.date, paidAt: payment.paidAt, orderId: order.id, supplierShare: calculateSupplierShare(supplier.amount), status: payment.status });
      });
    });
    return result;
  })();


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

          {loadError && <p role="alert">{loadError}</p>}
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
