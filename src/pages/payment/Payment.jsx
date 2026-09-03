import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOrderById,
  fetchOrderById,
} from '../../data/orderService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Payment.module.css';

export default function Payment() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => getOrderById(orderId));

  useEffect(() => {
    fetchOrderById(orderId).then((fetched) => {
      if (fetched) setOrder(fetched);
    });
  }, [orderId]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!order || order.customerId !== user.id) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1>Pedido não encontrado</h1>
          <p>Não foi possível localizar este pedido.</p>
          <Link to="/pedidos">
            <Button variant="primary">Ver meus pedidos</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === 'paid') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1>Pagamento já confirmado</h1>
          <p>Este pedido já foi pago e está sendo processado.</p>
          <div className={styles.orderBox}>
            <div className={styles.row}>
              <span>Pedido</span>
              <strong>{order.id}</strong>
            </div>
            <div className={styles.row}>
              <span>Total</span>
              <strong>{formatPrice(order.total)}</strong>
            </div>
          </div>
          <div className={styles.actions}>
            <Button variant="primary" size="lg" onClick={() => navigate('/pedidos')}>
              Ver meus pedidos
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (order.status === 'cancelado') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>❌</div>
          <h1>Pedido cancelado</h1>
          <p>O pagamento deste pedido não será processado.</p>
          <Link to="/catalogo">
            <Button variant="primary">Voltar ao catálogo</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Único método disponível é PIX — redireciona direto
  return <Navigate to={`/pagamento/pix/${order.id}`} replace />;
}
