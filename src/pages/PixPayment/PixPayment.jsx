import { Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getOrderById,
  fetchOrderById,
  confirmPayment,
} from '../../data/orderService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './PixPayment.module.css';

// ─── Dados do PIX — altere aqui quando necessário ────────────────────────────
const PIX_KEY       = '058.842.140-57';   // CPF da titular
const PIX_KEY_TYPE  = 'CPF';
const PIX_HOLDER    = 'Kenara Abigail Flores Ribeiro';
const PIX_BANK      = 'Pix';
const WHATSAPP_NUMBER = '5555997181206';  // número com DDI+DDD, sem espaços
// ─────────────────────────────────────────────────────────────────────────────

export default function PixPayment() {
  const { orderId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [order, setOrder]         = useState(() => getOrderById(orderId));
  const [processing, setProcessing] = useState(false);
  const [copied, setCopied]       = useState(false);

  useEffect(() => {
    fetchOrderById(orderId).then((fetched) => {
      if (fetched) setOrder(fetched);
    });
  }, [orderId]);

  if (!user) return <Navigate to="/login" replace />;

  if (!order || order.customerId !== user.id) {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>⚠️</div>
          <h1>Pedido não encontrado</h1>
          <p>Não foi possível localizar este pedido.</p>
          <Link to="/pedidos"><Button variant="primary">Ver meus pedidos</Button></Link>
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
          <p>Este pedido foi cancelado e não pode mais receber pagamento.</p>
          <Link to="/catalogo"><Button variant="primary">Voltar ao catálogo</Button></Link>
        </div>
      </div>
    );
  }

  if (order.paymentStatus === 'paid') {
    return (
      <div className={styles.page}>
        <div className={styles.card}>
          <div className={styles.icon}>✅</div>
          <h1>Pagamento confirmado!</h1>
          <p>Este pedido já foi marcado como pago. Obrigada! 💕</p>
          <Link to="/confirmacao"><Button variant="primary" size="lg">Ver confirmação</Button></Link>
        </div>
      </div>
    );
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(PIX_KEY);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback para browsers sem clipboard API
      const el = document.createElement('input');
      el.value = PIX_KEY;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  }

  function handleConfirmPayment() {
    if (processing) return;
    setProcessing(true);
    try {
      const updatedOrder = confirmPayment(order.id);
      setOrder(updatedOrder);
      navigate('/confirmacao');
    } catch (error) {
      console.error('Erro ao confirmar pagamento:', error);
      alert(error.message);
      setProcessing(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>

        {/* Cabeçalho */}
        <div className={styles.header}>
          <div className={styles.pixLogo}>PIX</div>
          <h1 className={styles.title}>Pagamento via PIX</h1>
          <p className={styles.text}>
            Transfira o valor abaixo para a chave PIX da loja e clique em
            <strong> "Já paguei"</strong> para confirmar o seu pedido.
          </p>
        </div>

        {/* Valor */}
        <div className={styles.valueBox}>
          <span>Valor total do pedido</span>
          <strong>{formatPrice(order.total)}</strong>
          <small>Pedido {order.id}</small>
        </div>

        {/* Dados do PIX */}
        <div className={styles.pixDataCard}>
          <div className={styles.pixDataRow}>
            <span className={styles.pixDataLabel}>Tipo de chave</span>
            <span className={styles.pixDataValue}>{PIX_KEY_TYPE}</span>
          </div>
          <div className={styles.pixDataRow}>
            <span className={styles.pixDataLabel}>Titular</span>
            <span className={styles.pixDataValue}>{PIX_HOLDER}</span>
          </div>
          <div className={styles.pixDataRow}>
            <span className={styles.pixDataLabel}>Banco / Carteira</span>
            <span className={styles.pixDataValue}>{PIX_BANK}</span>
          </div>

          {/* Chave com botão copiar */}
          <div className={styles.pixKeyRow}>
            <div className={styles.pixKeyBox}>
              <span className={styles.pixKeyLabel}>Chave PIX ({PIX_KEY_TYPE})</span>
              <span className={styles.pixKeyValue}>{PIX_KEY}</span>
            </div>
            <button
              type="button"
              className={`${styles.copyBtn} ${copied ? styles.copyBtnSuccess : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓ Copiado!' : 'Copiar chave'}
            </button>
          </div>
        </div>

        {/* Instrução */}
        <div className={styles.instructions}>
          <div className={styles.step}>
            <span className={styles.stepNum}>1</span>
            <span>Abra o app do seu banco e acesse a área <strong>PIX</strong></span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>2</span>
            <span>Cole ou digite a chave PIX acima e confirme o valor <strong>{formatPrice(order.total)}</strong></span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>3</span>
            <span>Após pagar, clique no botão abaixo para enviar o comprovante no WhatsApp</span>
          </div>
          <div className={styles.step}>
            <span className={styles.stepNum}>4</span>
            <span>Clique em <strong>"Já paguei"</strong> para registrar seu pedido</span>
          </div>
        </div>

        {/* Botão WhatsApp */}
        <a
          href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
            `Olá! Acabei de realizar o pagamento do pedido *${order.id}* no valor de *${formatPrice(order.total)}*. Segue o comprovante! 💕`
          )}`}
          target="_blank"
          rel="noopener noreferrer"
          className={styles.whatsappBtn}
        >
          <svg className={styles.whatsappIcon} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.428a.75.75 0 0 0 .921.921l5.571-1.476A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.953-1.354l-.355-.211-3.684.976.99-3.595-.232-.371A9.715 9.715 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
          </svg>
          Enviar comprovante no WhatsApp
        </a>

        {/* Aviso */}
        <div className={styles.notice}>
          💕 Agradecemos a preferência! Após o envio do comprovante confirmaremos seu pedido e entraremos em contato para combinar a entrega.
        </div>

        {/* Ações */}
        <div className={styles.actions}>
          <Link to={`/pagamento/${order.id}`}>
            <Button variant="outline" size="lg" disabled={processing}>
              Voltar
            </Button>
          </Link>
          <Button
            variant="primary"
            size="lg"
            onClick={handleConfirmPayment}
            disabled={processing}
          >
            {processing ? 'Confirmando…' : '✅ Já paguei'}
          </Button>
        </div>

      </div>
    </div>
  );
}
