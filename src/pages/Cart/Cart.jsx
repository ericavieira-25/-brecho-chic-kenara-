import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { formatPrice } from '../../utils/formatters';
import { createOrder } from '../../data/orderService.js';
import Button from '../../components/ui/Button/Button';
import styles from './Cart.module.css';

export default function Cart() {
  const { items, removeItem, updateQuantity, subtotal, shipping, total, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  function handleCheckout() {
    if (!user) {
      navigate('/login?redirect=/carrinho');
      return;
    }

    if (items.length === 0) {
      setError('Seu carrinho está vazio');
      return;
    }

    handleCreateOrder();
  }

  async function handleCreateOrder() {
  setIsProcessing(true);
  setError(null);

  try {
    // Criar pedido com status de aguardando pagamento
    const order = await createOrder({
      user,
      cartItems: items,
      subtotal,
      shipping,
      total,
    });

    if (!order) {
      throw new Error('Falha ao criar pedido');
    }

    // IMPORTANTE:
    // Ainda NÃO marcar os produtos como vendidos.
    // Isso só acontecerá depois da confirmação real do pagamento.

    // Limpar o carrinho porque o pedido já foi registrado
    clearCart();

    // Ir para a página de pagamento
    navigate(`/pagamento/${order.id}`);
  } catch (err) {
    console.error('Erro ao processar pedido:', err);
    setError(
      err.message ||
      'Erro ao processar seu pedido. Tente novamente.'
    );
    setIsProcessing(false);
  }
}

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Carrinho</h1>

        {error && (
          <div style={{
            backgroundColor: '#f8d7da',
            color: '#721c24',
            padding: '1rem',
            borderRadius: '6px',
            marginBottom: '1.5rem',
            border: '1px solid #f5c6cb',
          }}>
            <strong>Erro:</strong> {error}
          </div>
        )}

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🛒</p>
            <h2>Seu carrinho está vazio</h2>
            <p>Adicione peças incríveis ao seu carrinho e volte aqui para finalizar.</p>
            <Link to="/catalogo">
              <Button variant="primary">Explorar catálogo</Button>
            </Link>
          </div>
        ) : (
          <div className={styles.layout}>
            {/* Items */}
            <div className={styles.items}>
              {items.map((item) => (
                <div key={item.id} className={styles.item}>
                  <Link to={`/produto/${item.id}`}>
                    <img src={(item.images?.[0] || item.photo || item.image || "/placeholder-product.jpg")} alt={item.name} className={styles.thumb} />
                  </Link>
                  <div className={styles.itemInfo}>
                    <Link to={`/produto/${item.id}`}><h3 className={styles.itemName}>{item.name}</h3></Link>
                    <p className={styles.itemMeta}>{item.brand} · Tam. {item.size}</p>
                    <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                  </div>
                  <div className={styles.itemRight}>
                    <div className={styles.qty}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <p className={styles.itemTotal}>{formatPrice(item.price * item.quantity)}</p>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>🗑 Remover</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className={styles.summary}>
              <h3 className={styles.summaryTitle}>Resumo do pedido</h3>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete</span>
                <span className={shipping === 0 ? styles.free : ''}>{shipping === 0 ? 'Grátis 🎉' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className={styles.freeHint}>Adicione mais {formatPrice(150 - subtotal)} para frete grátis!</p>
              )}
              <div className={[styles.summaryRow, styles.totalRow].join(' ')}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button
                variant="primary"
                size="lg"
                onClick={handleCheckout}
                className={styles.checkoutBtn}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processando...' : user ? 'Finalizar compra' : 'Entrar para comprar'}
              </Button>
              <Link to="/catalogo" className={styles.continueLink}>← Continuar comprando</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
