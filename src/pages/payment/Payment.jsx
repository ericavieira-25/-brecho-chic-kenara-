import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOrderById,
  cancelOrder,
  updatePaymentMethod,
} from '../../data/orderService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Payment.module.css';

export default function Payment() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => getOrderById(orderId));
  const [processing, setProcessing] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState(
    order?.paymentMethod || ''
  );

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!order || order.customerId !== user.id) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>

          <h1>Pedido não encontrado</h1>

          <p>
            Não foi possível localizar este pedido.
          </p>

          <Link to="/pedidos">
            <Button variant="primary">
              Ver meus pedidos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  function handleContinue() {
    if (!selectedMethod) {
      alert('Escolha uma forma de pagamento.');
      return;
    }

    setProcessing(true);

    try {
      const updatedOrder = updatePaymentMethod(
        order.id,
        selectedMethod
      );

      setOrder(updatedOrder);

      if (selectedMethod === 'pix') {
        navigate(`/pagamento/pix/${order.id}`);
        return;
      }

      // Cartão ficará preparado para a próxima etapa.
      alert('Pagamento com cartão será integrado na próxima etapa.');
      setProcessing(false);
    } catch (error) {
      console.error('Erro ao selecionar pagamento:', error);
      alert('Não foi possível selecionar o pagamento.');
      setProcessing(false);
    }
  }

function handleCancel() {
  try {
    const updatedOrder = cancelOrder(order.id);

    setOrder(updatedOrder);
  } catch (error) {
    console.error('Erro ao cancelar pedido:', error);
    alert(error.message);
  }
}
  
if (order.paymentStatus === 'paid') {
  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>✅</div>

        <h1>Pagamento já confirmado</h1>

        <p>
          Este pedido já foi pago e está sendo processado.
        </p>

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
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/pedidos')}
          >
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

          <p>
            O pagamento deste pedido não será processado.
          </p>

          <Link to="/catalogo">
            <Button variant="primary">
              Voltar ao catálogo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>💳</div>

        <h1 className={styles.title}>
          Pagamento
        </h1>

        <p className={styles.text}>
          Escolha como deseja pagar seu pedido.
        </p>

        <div className={styles.orderBox}>
          <div className={styles.row}>
            <span>Pedido</span>
            <strong>{order.id}</strong>
          </div>

          <div className={styles.row}>
            <span>Total</span>
            <strong>{formatPrice(order.total)}</strong>
          </div>

          <div className={styles.row}>
            <span>Status</span>
            <strong className={styles.pending}>
  {order.paymentStatus === 'paid'
    ? '✅ Pagamento confirmado'
    : order.paymentStatus === 'processing'
      ? '⏳ Pagamento em processamento'
      : '⏳ Aguardando pagamento'}
</strong>
          </div>
        </div>

        <div className={styles.info}>
          <h3>Forma de pagamento</h3>

          <label className={styles.paymentOption}>
            <input
              type="radio"
              name="payment"
              value="pix"
              checked={selectedMethod === 'pix'}
              onChange={(event) =>
                setSelectedMethod(event.target.value)
              }
            />

            <span>
              <strong>🔲 PIX</strong>
              <small>
                Pagamento rápido e instantâneo
              </small>
            </span>
          </label>

          <label className={styles.paymentOption}>
            <input
              type="radio"
              name="payment"
              value="card"
              checked={selectedMethod === 'card'}
              onChange={(event) =>
                setSelectedMethod(event.target.value)
              }
            />

            <span>
              <strong>💳 Cartão</strong>
              <small>
                Cartão de crédito ou débito
              </small>
            </span>
          </label>
        </div>

        <div className={styles.actions}>
          <Button
            variant="outline"
            size="lg"
            onClick={handleCancel}
            disabled={processing}
          >
            Cancelar pedido
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={processing}
          >
            {processing
              ? 'Abrindo pagamento...'
              : 'Continuar pagamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}