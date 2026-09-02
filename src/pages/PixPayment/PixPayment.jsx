import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOrderById,
  confirmPayment,
} from '../../data/orderService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './PixPayment.module.css';

export default function PixPayment() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder] = useState(() => getOrderById(orderId));
  const [processing, setProcessing] = useState(false);

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

   function handleConfirmPayment() {
  if (processing) return;

  setProcessing(true);

  try {
    const updatedOrder = confirmPayment(order.id);

    setOrder(updatedOrder);

    navigate('/confirmacao');
} catch (error) {
  console.error('ERRO COMPLETO:', error);

  alert(`ERRO: ${error.message}`);

  setProcessing(false);
}
}

  if (order.status === 'cancelado') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>❌</div>

          <h1>Pedido cancelado</h1>

          <p>
            Este pedido foi cancelado e não pode mais
            receber pagamento.
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

  if (order.paymentStatus === 'paid') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>

          <h1>Pagamento já confirmado</h1>

          <p>
            Este pedido já foi marcado como pago.
          </p>

          <div className={styles.valueBox}>
            <span>Pedido</span>
            <strong>{order.id}</strong>
          </div>

          <Link to="/confirmacao">
            <Button variant="primary" size="lg">
              Ver confirmação
            </Button>
          </Link>
        </div>
      </div>
    );
  }


  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.icon}>🔲</div>

        <h1 className={styles.title}>
          Pagamento via PIX
        </h1>

        <p className={styles.text}>
          Escaneie o QR Code ou copie o código PIX
          abaixo para pagar.
        </p>

        <div className={styles.valueBox}>
          <span>Valor a pagar</span>

          <strong>
            {formatPrice(order.total)}
          </strong>
        </div>

        <div className={styles.qrPlaceholder}>
          <div className={styles.fakeQr}>
            PIX
          </div>

          <p>
            QR Code PIX será exibido aqui
          </p>
        </div>

        <div className={styles.pixCode}>
          <label>
            PIX Copia e Cola
          </label>

          <div className={styles.codeRow}>
            <input
              readOnly
              value={`PIX-DEMO-${order.id}-${order.total}`}
            />

            <button
              type="button"
              onClick={async () => {
                const code =
                  `PIX-DEMO-${order.id}-${order.total}`;

                try {
                  await navigator.clipboard.writeText(
                    code
                  );

                  alert(
                    'Código PIX copiado!'
                  );
                } catch (error) {
                  console.error(
                    'Erro ao copiar PIX:',
                    error
                  );

                  alert(
                    'Não foi possível copiar o código PIX.'
                  );
                }
              }}
            >
              Copiar
            </button>
          </div>
        </div>

        <div className={styles.info}>
          <strong>
            ⏳ Aguardando pagamento
          </strong>

          <p>
            Depois de realizar o pagamento, clique
            no botão abaixo para confirmar nesta
            versão de demonstração.
          </p>
        </div>

        <div className={styles.actions}>
          <Link to={`/pagamento/${order.id}`}>
            <Button
              variant="outline"
              size="lg"
              disabled={processing}
            >
              Voltar
            </Button>
          </Link>

          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirmPayment}
            disabled={processing}
          >
            {processing
              ? 'Confirmando...'
              : 'Já realizei o pagamento'}
          </Button>
        </div>
      </div>
    </div>
  );
}