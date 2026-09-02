/**
 * Controle de repasses às fornecedoras
 */

const STORAGE_KEY = 'brecho_supplier_payments';

function loadPayments() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : {};
  } catch {
    return {};
  }
}

function savePayments(payments) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(payments)
  );
}

export function getSupplierPayment(orderId, supplierId) {
  const payments = loadPayments();

  return payments[`${orderId}-${supplierId}`] || {
    status: 'pendente',
    paidAt: null,
  };
}

export function markSupplierPaymentAsPaid(
  orderId,
  supplierId
) {
  const payments = loadPayments();

  payments[`${orderId}-${supplierId}`] = {
    status: 'pago',
    paidAt: new Date().toISOString(),
  };

  savePayments(payments);

  return payments[`${orderId}-${supplierId}`];
}

export function markSupplierPaymentAsPending(
  orderId,
  supplierId
) {
  const payments = loadPayments();

  payments[`${orderId}-${supplierId}`] = {
    status: 'pendente',
    paidAt: null,
  };

  savePayments(payments);

  return payments[`${orderId}-${supplierId}`];
}