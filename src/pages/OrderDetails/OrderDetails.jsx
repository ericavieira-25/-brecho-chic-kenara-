import { Navigate, Link, useParams } from 'react-router-dom';
import { useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getOrderById } from '../../data/orderService.js';
import {
  formatPrice,
  formatDate,
  getStatusLabel,
} from '../../utils/formatters';
import Badge from '../../components/ui/Badge/Badge';
import Button from '../../components/ui/Button/Button';
import styles from './OrderDetails.module.css';

const statusVariant = {
  aguardando_pagamento: 'warning',
  entregue: 'success',
  em_transito: 'info',
  processando: 'warning',
  cancelado: 'error',
};

export default function OrderDetails() {
  const { orderId } = useParams();
  const { user } = useAuth();

  const order = useMemo(
    () => getOrderById(orderId),
    [orderId]
  );

  if (!user) {
    return (
      <Navigate
        to={`/login?redirect=/pedidos/${orderId}`}
        replace
      />
    );
  }

  if (!order || order.customerId !== user.id) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>📦</div>

          <h1>Pedido não encontrado</h1>

          <p>
            Não foi possível encontrar este pedido.
          </p>

          <Link to="/pedidos">
            <Button variant="primary" size="lg">
              Voltar para meus pedidos
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const statusText =
    order.status === 'aguardando_pagamento'
      ? 'Aguardando pagamento'
      : getStatusLabel(order.status);

  return (
    <div className={styles.page}>
      <div className={styles.container}>

        <div className={styles.top}>
          <div>
            <Link
              to="/pedidos"
              className={styles.back}
            >
              ← Voltar para meus pedidos
            </Link>

            <h1 className={styles.title}>
              Detalhes do pedido
            </h1>

            <p className={styles.orderId}>
              {order.id}
            </p>
          </div>

          <Badge
            variant={
              statusVariant[order.status] || 'default'
            }
          >
            {statusText}
          </Badge>
        </div>

        <div className={styles.card}>

          <section className={styles.section}>
            <h2>📋 Informações do pedido</h2>

            <div className={styles.infoGrid}>
              <div>
                <span>Pedido</span>
                <strong>{order.id}</strong>
              </div>

              <div>
                <span>Data</span>
                <strong>
                  {formatDate(order.date)}
                </strong>
              </div>

              <div>
                <span>Cliente</span>
                <strong>
                  {order.customerName}
                </strong>
              </div>

              <div>
                <span>E-mail</span>
                <strong>
                  {order.customerEmail}
                </strong>
              </div>
            </div>
          </section>

          {/* Linha do tempo do pedido */}
          <section className={styles.section}>
            <h2>📦 Acompanhamento do pedido</h2>

            <div className={styles.timeline}>

              <div className={`${styles.timelineItem} ${styles.completed}`}>
                <div className={styles.timelineDot}>✓</div>

                <div className={styles.timelineContent}>
                  <strong>Pedido realizado</strong>
                  <span>Pedido recebido com sucesso</span>
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${
                  order.paymentStatus === 'paid'
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.timelineDot}>
                  {order.paymentStatus === 'paid' ? '✓' : '2'}
                </div>

                <div className={styles.timelineContent}>
                  <strong>Pagamento</strong>
                  <span>
                    {order.paymentStatus === 'paid'
                      ? 'Pagamento confirmado'
                      : 'Aguardando pagamento'}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${
                  ['processando', 'em_transito', 'entregue'].includes(
                    order.status
                  )
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.timelineDot}>
                  {['processando', 'em_transito', 'entregue'].includes(
                    order.status
                  )
                    ? '✓'
                    : '3'}
                </div>

                <div className={styles.timelineContent}>
                  <strong>Preparando pedido</strong>
                  <span>
                    {['processando', 'em_transito', 'entregue'].includes(
                      order.status
                    )
                      ? 'Pedido em preparação'
                      : 'Aguardando processamento'}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${
                  ['em_transito', 'entregue'].includes(order.status)
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.timelineDot}>
                  {['em_transito', 'entregue'].includes(order.status)
                    ? '✓'
                    : '4'}
                </div>

                <div className={styles.timelineContent}>
                  <strong>Em trânsito</strong>
                  <span>
                    {['em_transito', 'entregue'].includes(order.status)
                      ? 'Pedido enviado'
                      : 'Aguardando envio'}
                  </span>
                </div>
              </div>

              <div
                className={`${styles.timelineItem} ${
                  order.status === 'entregue'
                    ? styles.completed
                    : ''
                }`}
              >
                <div className={styles.timelineDot}>
                  {order.status === 'entregue' ? '✓' : '5'}
                </div>

                <div className={styles.timelineContent}>
                  <strong>Entregue</strong>
                  <span>
                    {order.status === 'entregue'
                      ? 'Pedido entregue'
                      : 'Aguardando entrega'}
                  </span>
                </div>
              </div>

            </div>
          </section>

          <section className={styles.section}>
            <h2>🛍️ Produtos</h2>
            <div className={styles.items}>
              {order.items.map((item, index) => (
                <div
                  key={`${item.productId}-${index}`}
                  className={styles.item}
                >
                  <div className={styles.itemLeft}>
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className={styles.image}
                      />
                    ) : (
                      <div className={styles.noImage}>
                        🛍️
                      </div>
                    )}

                    <div className={styles.itemInfo}>
                      <h3>{item.name}</h3>

                      {item.brand && (
                        <p>
                          Marca: {item.brand}
                        </p>
                      )}

                      {item.size && (
                        <p>
                          Tamanho: {item.size}
                        </p>
                      )}

                      <p>
                        Quantidade: {item.quantity}
                      </p>
                    </div>
                  </div>

                  <strong className={styles.price}>
                    {formatPrice(
                      item.price * item.quantity
                    )}
                  </strong>
                </div>
              ))}
            </div>
          </section>
                    {/* Informações de entrega */}
          <section className={styles.section}>
            <h2>🚚 Entrega</h2>

            <div className={styles.deliveryBox}>
              <div className={styles.deliveryRow}>
                <span>Método de envio</span>
                <strong>Envio padrão</strong>
              </div>

              <div className={styles.deliveryRow}>
                <span>Código de rastreamento</span>
                <strong>
                  {order.trackingCode || 'Ainda não disponível'}
                </strong>
              </div>

              <div className={styles.deliveryRow}>
                <span>Status da entrega</span>
                <strong>
                  {order.status === 'em_transito'
                    ? '🚚 Pedido enviado'
                    : order.status === 'entregue'
                      ? '✅ Pedido entregue'
                      : '📦 Aguardando envio'}
                </strong>
              </div>
            </div>
          </section>

          <section className={styles.summary}>
            <div>
              <span>Subtotal</span>
              <strong>
                {formatPrice(order.subtotal)}
              </strong>
            </div>

            <div>
              <span>Frete</span>
              <strong>
                {order.shipping === 0
                  ? 'Grátis 🎉'
                  : formatPrice(order.shipping)}
              </strong>
            </div>

            <div className={styles.total}>
              <span>Total</span>
              <strong>
                {formatPrice(order.total)}
              </strong>
            </div>
          </section>

          {order.status === 'aguardando_pagamento' && (
            <div className={styles.paymentBox}>
              <div>
                <strong>
                  💳 Pagamento pendente
                </strong>

                <p>
                  Este pedido ainda precisa ser pago.
                </p>
              </div>

              <Link
                to={`/pagamento/pix/${order.id}`}
              >
                <Button variant="primary" size="lg">
                  Pagar com PIX
                </Button>
              </Link>
            </div>
          )}

          {order.paymentStatus === 'paid' && (
            <div className={styles.paidBox}>
              ✅ Pagamento confirmado
            </div>
          )}

        </div>
      </div>
    </div>
  );
}