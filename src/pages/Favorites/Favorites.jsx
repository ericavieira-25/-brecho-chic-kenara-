import { Link } from 'react-router-dom';
import { useFavorites } from '../../context/FavoritesContext';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Button from '../../components/ui/Button/Button';
import styles from './Favorites.module.css';

export default function Favorites() {
  const { favorites } = useFavorites();

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Meus Favoritos</h1>
        {favorites.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyIcon}>♡</p>
            <h2>Nenhum favorito ainda</h2>
            <p>Explore o catálogo e salve as peças que você mais amar.</p>
            <Link to="/catalogo">
              <Button variant="primary">Explorar catálogo</Button>
            </Link>
          </div>
        ) : (
          <>
            <p className={styles.count}>{favorites.length} {favorites.length === 1 ? 'peça salva' : 'peças salvas'}</p>
            <div className={styles.grid}>
              {favorites.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
