import { Link } from 'react-router-dom';
import Badge from '../Badge/Badge';
import { useFavorites } from '../../../context/FavoritesContext';
import { useCart } from '../../../context/CartContext';
import { formatPrice, calcDiscount, getConditionShortLabel } from '../../../utils/formatters';
import styles from './ProductCard.module.css';

function HeartIcon({ filled }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true"
      style={{
        fill: filled ? 'currentColor' : 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        width: 16,
        height: 16,
      }}>
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function ProductCard({ product }) {
  const { toggleFavorite, isFavorite } = useFavorites();
  const { addItem } = useCart();
  const favorited = isFavorite(product.id);
  const discount = calcDiscount(product.originalPrice, product.price);
  const unavailable = product.available === false;

  function handleQuickAdd(e) {
    e.preventDefault();
    if (!unavailable) addItem(product);
  }

  return (
    <div className={[styles.card, unavailable ? styles.unavailable : ''].filter(Boolean).join(' ')}>
      <Link to={`/produto/${product.id}`} className={styles.imageLink}>
        <img
          src={product.images[0]}
          alt={product.name}
          className={styles.image}
          loading="lazy"
        />

        {/* Badges over image */}
        {discount > 0 && !unavailable && (
          <span className={styles.discountBadge}>-{discount}%</span>
        )}
        {unavailable && (
          <div className={styles.unavailableOverlay}>
            <span className={styles.unavailableLabel}>Indisponível</span>
          </div>
        )}

        {/* Quick-add overlay on hover (only when available) */}
        {!unavailable && (
          <div className={styles.overlay}>
            <button className={styles.quickAdd} onClick={handleQuickAdd}>
              + Adicionar ao carrinho
            </button>
          </div>
        )}
      </Link>

      {/* Favorite button */}
      <button
        className={[styles.favoriteBtn, favorited ? styles.favorited : ''].filter(Boolean).join(' ')}
        onClick={() => toggleFavorite(product)}
        aria-label={favorited ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
      >
        <HeartIcon filled={favorited} />
      </button>

      {/* Info */}
      <div className={styles.info}>
        <div className={styles.badges}>
          <Badge variant={product.condition} size="sm">
            {getConditionShortLabel(product.condition)}
          </Badge>
          <span className={styles.size}>{product.size}</span>
        </div>

        <Link to={`/produto/${product.id}`}>
          <h3 className={styles.name}>{product.name}</h3>
        </Link>

        <p className={styles.brand}>{product.brand}</p>

        {product.location && (
          <p className={styles.location}>
            <span aria-hidden="true">📍</span> {product.location}
          </p>
        )}

        <div className={styles.prices}>
          {unavailable ? (
            <span className={styles.soldOut}>Vendido</span>
          ) : (
            <>
              <span className={styles.price}>{formatPrice(product.price)}</span>
              {product.originalPrice > product.price && (
                <span className={styles.originalPrice}>{formatPrice(product.originalPrice)}</span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
