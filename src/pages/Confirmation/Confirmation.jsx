import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getLastCreatedOrderId,
  getOrderById,
  clearLastOrderMarker,
} from '../../data/orderService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Confirmation.module.css';

export default function Confirmation() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Impede que o efeito processe o pedido duas vezes
  const hasLoadedOrder = useRef(false);

  useEffect(() => {
    if (hasLoadedOrder.current) {
      return;
    }

    hasLoadedOrder.current = true;

    // Buscar o ID do último pedido criado
    const lastOrderId = getLastCreatedOrderId();

    if (!lastOrderId) {
      setError('Nenhum pedido foi criado. Retorne ao carrinho.');
      setLoading(false);
      return;
    }

    // Buscar o pedido completo
    const createdOrder = getOrderById(lastOrderId);

    if (createdOrder) {
      setOrder(createdOrder);

      // Só limpar o marcador depois de carregar o pedido com sucesso
      clearLastOrderMarker();
    } else {
      setError('Pedido não encontrado.');
    }

    setLoading(false);
  }, []);

  function handleFinish() {
    navigate('/pedidos');
  }

  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p>Carregando confirmação...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div
            className={styles.icon}
            style={{ fontSize: '2rem' }}
          >
            ⚠️
          </div>

          <h1 className={styles.title}>Erro</h1>

          <p className={styles.text}>{error}</p>

          <div className={styles.actions}>
            <Link to="/catalogo">
              <Button variant="primary" size="lg">
                Voltar ao catálogo
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <p>Pedido não encontrado</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🎉</div>

       <h1 className={styles.title}>
  {order.status === 'processando'
    ? 'Pagamento confirmado!'
    : 'Pedido confirmado!'}
</h1>

<p className={styles.text}>
  Obrigada pela sua compra,{' '}
  <strong>{order.customerName}</strong>!
  {order.status === 'processando'
    ? ' Seu pagamento foi confirmado e seu pedido está sendo processado.'
    : ' Seu pedido foi recebido e está sendo processado.'}
</p>

        {/* Detalhes do pedido */}
        <div className={styles.orderDetails}>
          <div className={styles.detailRow}>
            <span className={styles.label}>
              Número do pedido:
            </span>

            <span className={styles.value}>
              {order.id}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>
              Data:
            </span>

            <span className={styles.value}>
              {new Date(order.date).toLocaleDateString('pt-BR')}
            </span>
          </div>

          <div className={styles.detailRow}>
            <span className={styles.label}>
              Status:
            </span>

           <span className={styles.value}>
  {order.status === 'processando'
    ? '✅ Pagamento confirmado • Processando pedido'
    : order.status === 'em_transito'
      ? '📦 Em trânsito'
      : order.status === 'entregue'
        ? '✅ Entregue'
        : order.status === 'cancelado'
          ? '❌ Cancelado'
          : order.status === 'aguardando_pagamento'
            ? '⏳ Aguardando pagamento'
            : order.status}
</span>
          </div>
        </div>

        {/* Itens do pedido */}
        <div className={styles.items}>
          <h3 className={styles.itemsTitle}>
            Produtos do pedido:
          </h3>

          {order.items.map((item, idx) => (
            <div
              key={`${item.productId}-${idx}`}
              className={styles.item}
            >
              <div className={styles.itemLeft}>
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

                  <p className={styles.itemMeta}>
                    {item.brand} · Tam. {item.size} · Qtd: {item.quantity}
                  </p>
                </div>
              </div>

              <span className={styles.itemPrice}>
                {formatPrice(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>

        {/* Resumo do pedido */}
        <div className={styles.summary}>
          <div className={styles.summaryRow}>
            <span>Subtotal:</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>

          <div className={styles.summaryRow}>
            <span>Frete:</span>

            <span>
              {order.shipping === 0
                ? 'Grátis 🎉'
                : formatPrice(order.shipping)}
            </span>
          </div>

          <div
            className={[
              styles.summaryRow,
              styles.totalRow,
            ].join(' ')}
          >
            <span>Total:</span>
            <span>{formatPrice(order.total)}</span>
          </div>
        </div>

        <div className={styles.actions}>
          <Button
            variant="primary"
            size="lg"
            onClick={handleFinish}
          >
            Ver meus pedidos
          </Button>

          <Link to="/catalogo">
            <Button variant="outline" size="lg">
              Continuar comprando
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}