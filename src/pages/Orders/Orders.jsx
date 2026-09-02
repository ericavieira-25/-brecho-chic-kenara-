import { Navigate, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockOrders } from '../../data/orders.js';
import {
  getOrdersByCustomerId,
  normalizeOrder,
} from '../../data/orderService.js';
import {
  formatPrice,
  formatDate,
  getStatusLabel,
} from '../../utils/formatters';
import Badge from '../../components/ui/Badge/Badge';
import Button from '../../components/ui/Button/Button';
import styles from './Orders.module.css';

const statusVariant = {
  aguardando_pagamento: 'warning',
  entregue: 'success',
  em_transito: 'info',
  processando: 'warning',
  cancelado: 'error',
};

export default function Orders() {
  const { user } = useAuth();
  const userId = user?.id;

  const allOrders = useMemo(() => {
    const realOrders = userId ? getOrdersByCustomerId(userId) : [];

    const demoOrders = mockOrders
      .slice(0, 2)
      .map(normalizeOrder);

    return [...demoOrders, ...realOrders]
      .map(normalizeOrder)
      .sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [userId]);

  if (!user) {
    return <Navigate to="/login?redirect=/pedidos" replace />;
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Meus Pedidos</h1>

        {allOrders.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>📦</p>

            <h2>Nenhum pedido ainda</h2>

            <p>
              Explore o catálogo e faça sua primeira compra!
            </p>

            <Link to="/catalogo">
              <Button variant="primary">
                Ir ao catálogo
              </Button>
            </Link>
          </div>
        ) : (
          <div className={styles.list}>
            {allOrders.map((order) => {
              const isRealOrder =
                order.id.startsWith('ORDER-');

              return (
                <div
                  key={order.id}
                  className={[
                    styles.order,
                    isRealOrder && styles.realOrder,
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  <Link
                    to={`/pedidos/${order.id}`}
                    className={styles.orderLink}
                  >
                    <div className={styles.orderHeader}>
                      <div>
                        <p className={styles.orderId}>
                          Pedido {order.id}

                          {isRealOrder && (
                            <span className={styles.badge}>
                              {' '}
                              ✨ Novo
                            </span>
                          )}
                        </p>

                        <p className={styles.orderDate}>
                          {formatDate(order.date)}
                        </p>
                      </div>

                      <Badge
                        variant={
                          statusVariant[order.status] ||
                          'default'
                        }
                      >
                        {order.status ===
                        'aguardando_pagamento'
                          ? 'Aguardando pagamento'
                          : getStatusLabel(order.status)}
                      </Badge>
                    </div>

                    <div className={styles.orderItems}>
                      {order.items.map((item, i) => (
                        <div
                          key={`${item.productId}-${i}`}
                          className={styles.orderItem}
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className={styles.itemThumb}
                            />
                          )}

                          <div className={styles.itemInfo}>
                            <p className={styles.itemName}>
                              {item.name}
                            </p>

                            <p className={styles.itemQty}>
                              Qtd: {item.quantity}
                            </p>
                          </div>

                          <p className={styles.itemPrice}>
                            {formatPrice(
                              item.price * item.quantity
                            )}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Link>

                  <div className={styles.orderFooter}>
                    <span className={styles.orderTotal}>
                      Total: {formatPrice(order.total)}
                    </span>

                    {isRealOrder &&
                      order.status ===
                        'aguardando_pagamento' && (
                        <Link
                          to={`/pagamento/pix/${order.id}`}
                        >
                          <Button variant="primary">
                            💳 Pagar com PIX
                          </Button>
                        </Link>
                      )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}