/**
 * AdminFinancialTable.jsx
 *
 * Tabela financeira detalhada para análise administrativo.
 * Mostra distribuição de valores por período, sempre utilizando financial.js.
 * Protegido para usuários com papel 'administradora'.
 */

import { useMemo } from 'react';
import { useGuard } from '../../hooks/useGuard.js';
import { Navigate } from 'react-router-dom';
import { USER_ROLES } from '../../data/roles.js';
import { mockOrders } from '../../data/orders.js';
import { mergeOrdersWithMock } from '../../data/orderService.js';
import { calculateOrderSplitBySupplier, calculateTenPercentMetric, roundCurrency } from '../../data/financial.js';
import styles from './AdminFinancialTable.module.css';

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
}

export default function AdminFinancialTable() {
  const { isAuth, hasRole } = useGuard();

  // Verificar autorização
  if (!isAuth) {
    return <Navigate to="/login" replace />;
  }

  if (!hasRole(USER_ROLES.ADMIN)) {
    return <Navigate to="/" replace />;
  }

  // Agrupar dados por período (mês) - usando pedidos reais + mockOrders
  const tableData = useMemo(() => {
    const allOrders = mergeOrdersWithMock(mockOrders);
    const grouped = {};

    allOrders.forEach((order) => {
      const [year, month] = order.date.split('-');
      const monthKey = `${year}-${month}`;

      if (!grouped[monthKey]) {
        grouped[monthKey] = [];
      }

      grouped[monthKey].push(order);
    });

    // Processar cada período
    const rows = Object.entries(grouped)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([monthKey, ordersInMonth]) => {
        const totalOrdersInMonth = ordersInMonth.length;
        const itemsInMonth = ordersInMonth.flatMap((order) =>
          order.items.map((item) => ({
            ...item,
            price: item.price,
            quantity: item.quantity,
          }))
        );

        const totalSalesInMonth = itemsInMonth.reduce((sum, item) => {
          return sum + item.price * item.quantity;
        }, 0);

        const split = calculateOrderSplitBySupplier(itemsInMonth);
        const metric10 = calculateTenPercentMetric(totalSalesInMonth);

        return {
          period: monthKey,
          totalOrders: totalOrdersInMonth,
          totalSales: roundCurrency(totalSalesInMonth),
          supplierShare: split.totalSupplierShare,
          adminShare: split.totalAdminShare,
          metric10: roundCurrency(metric10),
        };
      });

    return rows;
  }, []);

  // Calcular totais gerais
  const totals = useMemo(() => {
    let totalOrders = 0;
    let totalSales = 0;
    let totalSupplierShare = 0;
    let totalAdminShare = 0;
    let totalMetric10 = 0;

    tableData.forEach((row) => {
      totalOrders += row.totalOrders;
      totalSales += row.totalSales;
      totalSupplierShare += row.supplierShare;
      totalAdminShare += row.adminShare;
      totalMetric10 += row.metric10;
    });

    return {
      totalOrders,
      totalSales: roundCurrency(totalSales),
      totalSupplierShare: roundCurrency(totalSupplierShare),
      totalAdminShare: roundCurrency(totalAdminShare),
      totalMetric10: roundCurrency(totalMetric10),
    };
  }, [tableData]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Controle Financeiro</h1>
<p className={styles.subtitle}>
  Acompanhe vendas, lucro da administradora, valores das fornecedoras e a métrica de 10%.
</p> </div>

<div className={styles.financialCards}>

  <div className={styles.financialCard}>
    <span>💰 Total vendido</span>
    <strong>{formatPrice(totals.totalSales)}</strong>
    <small>100% das vendas</small>
  </div>

  <div className={styles.financialCard}>
    <span>💳 Lucro da administradora</span>
    <strong>{formatPrice(totals.totalAdminShare)}</strong>
    <small>25% das vendas</small>
  </div>

  <div className={styles.financialCard}>
    <span>👗 A repassar às fornecedoras</span>
    <strong>{formatPrice(totals.totalSupplierShare)}</strong>
    <small>75% das vendas</small>
  </div>

  <div className={styles.financialCard}>
    <span>📊 Métrica de 10%</span>
    <strong>{formatPrice(totals.totalMetric10)}</strong>
    <small>Calculada separadamente</small>
  </div>

</div>

<div className={styles.splitBox}>
  <h2>💰 Distribuição das vendas</h2>

  <div className={styles.splitRow}>
    <span>100% Total das vendas</span>
    <strong>{formatPrice(totals.totalSales)}</strong>
  </div>

  <div className={styles.splitRow}>
    <span>👗 75% Fornecedoras</span>
    <strong>{formatPrice(totals.totalSupplierShare)}</strong>
  </div>

  <div className={styles.splitRow}>
    <span>💳 25% Administradora</span>
    <strong>{formatPrice(totals.totalAdminShare)}</strong>
  </div>

  <div className={styles.splitTotal}>
    <span>75% + 25%</span>
    <strong>
      {formatPrice(
        totals.totalSupplierShare + totals.totalAdminShare
      )}
    </strong>
  </div>
</div>

      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Período</th>
              <th>Quantidade de Pedidos</th>
              <th>Valor Total de Vendas</th>
              <th>Valor às Fornecedoras (75%)</th>
              <th>Valor à Administradora (25%)</th>
              <th>Métrica 10% (Separada)</th>
            </tr>
          </thead>
          <tbody>
            {tableData.map((row, idx) => (
              <tr key={idx}>
                <td className={styles.cellPeriod}>{row.period}</td>
                <td className={styles.cellNumber}>{row.totalOrders}</td>
                <td className={styles.cellMoney}>{formatPrice(row.totalSales)}</td>
                <td className={styles.cellMoney + ' ' + styles.cellSupplier}>
                  {formatPrice(row.supplierShare)}
                </td>
                <td className={styles.cellMoney + ' ' + styles.cellAdmin}>
                  {formatPrice(row.adminShare)}
                </td>
                <td className={styles.cellMoney + ' ' + styles.cellMetric}>
                  {formatPrice(row.metric10)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className={styles.totalRow}>
              <td className={styles.cellPeriod}>
                <strong>TOTAL</strong>
              </td>
              <td className={styles.cellNumber}>
                <strong>{totals.totalOrders}</strong>
              </td>
              <td className={styles.cellMoney}>
                <strong>{formatPrice(totals.totalSales)}</strong>
              </td>
              <td className={styles.cellMoney + ' ' + styles.cellSupplier}>
                <strong>{formatPrice(totals.totalSupplierShare)}</strong>
              </td>
              <td className={styles.cellMoney + ' ' + styles.cellAdmin}>
                <strong>{formatPrice(totals.totalAdminShare)}</strong>
              </td>
              <td className={styles.cellMoney + ' ' + styles.cellMetric}>
                <strong>{formatPrice(totals.totalMetric10)}</strong>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Informação sobre a métrica de 10% */}
      <div className={styles.infoBox}>
        <h3>ℹ️ Sobre os cálculos</h3>
        <ul>
          <li>
            <strong>Valor às Fornecedoras (75%):</strong> calculado como 75% do valor total de vendas de
            cada período.
          </li>
          <li>
            <strong>Valor à Administradora (25%):</strong> calculado como 25% do valor total de vendas de
            cada período.
          </li>
          <li>
            <strong>Soma (75% + 25%):</strong> sempre igual ao valor total de vendas (100%).
          </li>
          <li>
            <strong>Métrica 10% (Separada):</strong> calculada como 10% do valor total de vendas, de forma
            independente. <strong>NÃO é somada aos 75% e 25%.</strong>
          </li>
        </ul>
      </div>

      {/* Verificação de Totais */}
      <div className={styles.verificationBox}>
        <h3>✓ Verificação de Totais</h3>
        <div className={styles.verificationRow}>
          <span>Total de vendas (75% + 25%):</span>
          <strong>{formatPrice(totals.totalSupplierShare + totals.totalAdminShare)}</strong>
        </div>
        <div className={styles.verificationRow}>
          <span>Valor às fornecedoras:</span>
          <strong>{formatPrice(totals.totalSupplierShare)}</strong>
        </div>
        <div className={styles.verificationRow}>
          <span>Valor à administradora:</span>
          <strong>{formatPrice(totals.totalAdminShare)}</strong>
        </div>
        <div className={styles.verificationRow}>
          <span>Métrica 10% (separada):</span>
          <strong>{formatPrice(totals.totalMetric10)}</strong>
        </div>
      </div>

      {/* Botão de Voltar */}
      <div className={styles.footer}>
        <a href="/admin" className={styles.backLink}>
          ← Voltar ao Painel Administrativo
        </a>
      </div>
    </div>
  );
}
