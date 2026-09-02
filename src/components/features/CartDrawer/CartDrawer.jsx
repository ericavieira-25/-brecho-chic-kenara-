import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';
import { formatPrice } from '../../../utils/formatters';
import Button from '../../ui/Button/Button';
import styles from './CartDrawer.module.css';

export default function CartDrawer({ isOpen, onClose }) {
  const { items, removeItem, updateQuantity, subtotal, shipping, total, totalItems } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  function handleCheckout() {
    onClose();
    navigate('/carrinho');
  }

  return (
    <>
      <div className={styles.backdrop} onClick={onClose} />
      <div className={styles.drawer}>
        <div className={styles.header}>
          <h3 className={styles.title}>Carrinho {totalItems > 0 && <span className={styles.count}>({totalItems})</span>}</h3>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>🛒</p>
            <p className={styles.emptyText}>Seu carrinho está vazio</p>
            <Button variant="outline" size="sm" onClick={() => { onClose(); navigate('/catalogo'); }}>
              Explorar catálogo
            </Button>
          </div>
        ) : (
          <>
            <ul className={styles.items}>
              {items.map((item) => (
                <li key={item.id} className={styles.item}>
                  <Link to={`/produto/${item.id}`} onClick={onClose}>
                    <img src={(item.images?.[0] || item.photo || item.image || "/placeholder-product.jpg")} alt={item.name} className={styles.thumb} />
                  </Link>
                  <div className={styles.itemInfo}>
                    <p className={styles.itemName}>{item.name}</p>
                    <p className={styles.itemMeta}>{item.brand} · Tam. {item.size}</p>
                    <p className={styles.itemPrice}>{formatPrice(item.price)}</p>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.qty}>
                      <button onClick={() => updateQuantity(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>−</button>
                      <span>{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                    </div>
                    <button className={styles.removeBtn} onClick={() => removeItem(item.id)}>🗑</button>
                  </div>
                </li>
              ))}
            </ul>
            <div className={styles.summary}>
              <div className={styles.summaryRow}>
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className={styles.summaryRow}>
                <span>Frete</span>
                <span className={shipping === 0 ? styles.free : ''}>{shipping === 0 ? 'Grátis' : formatPrice(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className={styles.freeHint}>Faltam {formatPrice(150 - subtotal)} para frete grátis</p>
              )}
              <div className={[styles.summaryRow, styles.totalRow].join(' ')}>
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
              <Button variant="primary" size="md" onClick={handleCheckout} className={styles.checkoutBtn}>
                Ir para o carrinho
              </Button>
            </div>
          </>
        )}
      </div>
    </>
  );
}

