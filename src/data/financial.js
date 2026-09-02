export const FINANCIAL_SPLIT = Object.freeze({
  SUPPLIER_PERCENT: 0.75,
  ADMIN_PERCENT: 0.25,
  ADMIN_METRIC_PERCENT: 0.1,
});

export function roundCurrency(value) {
  return Number(Math.round((Number(value) + Number.EPSILON) * 100) / 100);
}

export function calculateSupplierShare(amount) {
  return roundCurrency(Number(amount) * FINANCIAL_SPLIT.SUPPLIER_PERCENT);
}

export function calculateAdminShare(amount) {
  return roundCurrency(Number(amount) * FINANCIAL_SPLIT.ADMIN_PERCENT);
}

export function calculateTenPercentMetric(totalSales) {
  return roundCurrency(Number(totalSales) * FINANCIAL_SPLIT.ADMIN_METRIC_PERCENT);
}

export function calculateItemFinancialSplit(productOrAmount, qty = 1) {
  const amount = Number(productOrAmount?.price ?? productOrAmount ?? 0) * Number(qty || 1);
  const supplierShare = calculateSupplierShare(amount);
  const adminShare = calculateAdminShare(amount);

  return {
    grossAmount: roundCurrency(amount),
    supplierShare,
    adminShare,
    total: roundCurrency(supplierShare + adminShare),
    tenPercentMetric: calculateTenPercentMetric(amount),
  };
}

export function calculateOrderSplitBySupplier(items = []) {
  const map = new Map();

  items.forEach((item) => {
    const supplierId = item.supplierId || item.fornecedoraId || 'supplier-unknown';
    const amount = Number(item.price || 0) * Number(item.quantity || item.qty || 1);

    if (!map.has(supplierId)) {
      map.set(supplierId, {
        supplierId,
        grossAmount: 0,
        supplierShare: 0,
        adminShare: 0,
      });
    }

    const current = map.get(supplierId);
    const itemGross = roundCurrency(amount);
    const itemSupplierShare = calculateSupplierShare(itemGross);
    const itemAdminShare = calculateAdminShare(itemGross);

    current.grossAmount = roundCurrency(current.grossAmount + itemGross);
    current.supplierShare = roundCurrency(current.supplierShare + itemSupplierShare);
    current.adminShare = roundCurrency(current.adminShare + itemAdminShare);
  });

  return {
    bySupplier: Array.from(map.values()),
    totalSupplierShare: roundCurrency(
      Array.from(map.values()).reduce((sum, value) => sum + value.supplierShare, 0)
    ),
    totalAdminShare: roundCurrency(
      Array.from(map.values()).reduce((sum, value) => sum + value.adminShare, 0)
    ),
  };
}
