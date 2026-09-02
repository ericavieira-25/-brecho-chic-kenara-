import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useFavorites } from '../../context/FavoritesContext';
import {
  getProductById,
  getRelatedBySupplier,
} from '../../data/productService';
import {
  formatPrice,
  calcDiscount,
  getConditionLabel,
} from '../../utils/formatters';
import Badge from '../../components/ui/Badge/Badge';
import Button from '../../components/ui/Button/Button';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import styles from './ProductDetail.module.css';

function HeartIcon({ filled = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className={styles.heartIcon}
    >
      <path
        d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"
        fill={filled ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
const [related, setRelated] = useState([]);
const [loading, setLoading] = useState(true);
useEffect(() => {
  async function loadProduct() {
  setLoading(true);

  const foundProduct = await getProductById(id);

  setProduct(foundProduct || null);

  if (foundProduct) {
    const relatedProducts = await getRelatedBySupplier(
      foundProduct,
      4
    );

    setRelated(relatedProducts);
  } else {
    setRelated([]);
  }

  setLoading(false);
}

  loadProduct();
}, [id]);

  const { addItem } = useCart();
  const { toggleFavorite, isFavorite } = useFavorites();

  const [activeImg, setActiveImg] = useState(0);
  const [added, setAdded] = useState(false);
if (loading) {
  return (
    <div className={styles.notFound}>
      <h2>Carregando produto...</h2>
    </div>
  );
}
  if (!product) {
    return (
      <div className={styles.notFound}>
        <div className={styles.notFoundIcon}>🛍️</div>

        <h2>Produto não encontrado</h2>

        <p>
          Essa peça pode ter sido removida ou não está
          mais disponível.
        </p>

        <Button
          variant="outline"
          onClick={() => navigate('/catalogo')}
        >
          ← Voltar ao catálogo
        </Button>
      </div>
    );
  }

  const images =
    Array.isArray(product.images) && product.images.length
      ? product.images
      : ['/placeholder-product.jpg'];

  const safeActiveImg =
    activeImg >= images.length ? 0 : activeImg;

  const discount = calcDiscount(
    product.originalPrice,
    product.price
  );

  const favorited = isFavorite(product.id);
  const unavailable = product.available === false;



  const conditionVariant =
    {
      otimo: 'otimo',
      bom: 'bom',
      regular: 'regular',
    }[product.condition] || 'default';

  function handleAddToCart() {
    if (unavailable) return;

    addItem(product);
    setAdded(true);

    setTimeout(() => {
      setAdded(false);
    }, 2000);
  }

  function handleFavorite() {
    toggleFavorite(product);
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>

        {/* BREADCRUMB */}

        <nav
          className={styles.breadcrumb}
          aria-label="Navegação"
        >
          <Link
            to="/"
            className={styles.breadcrumbLink}
          >
            Início
          </Link>

          <span className={styles.breadcrumbSep}>
            /
          </span>

          <Link
            to="/catalogo"
            className={styles.breadcrumbLink}
          >
            Catálogo
          </Link>

          <span className={styles.breadcrumbSep}>
            /
          </span>

          <Link
            to={`/catalogo?categoria=${product.category}`}
            className={styles.breadcrumbLink}
          >
            {product.category?.charAt(0).toUpperCase()}
            {product.category?.slice(1)}
          </Link>

          <span className={styles.breadcrumbSep}>
            /
          </span>

          <span className={styles.breadcrumbCurrent}>
            {product.name}
          </span>
        </nav>

        {/* PRODUTO */}

        <div className={styles.grid}>

          {/* GALERIA */}

          <div className={styles.gallery}>

            <div className={styles.mainImg}>

              <img
                src={images[safeActiveImg]}
                alt={product.name}
              />

              {discount > 0 && !unavailable && (
                <span className={styles.discountBadge}>
                  -{discount}%
                </span>
              )}

              {unavailable && (
                <div className={styles.unavailableOverlay}>
                  <span>
                    Vendido
                  </span>
                </div>
              )}

            </div>

            {images.length > 1 && (
              <div className={styles.thumbs}>

                {images.map((img, index) => (
                  <button
                    type="button"
                    key={`${img}-${index}`}
                    className={[
                      styles.thumb,
                      index === safeActiveImg
                        ? styles.thumbActive
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() =>
                      setActiveImg(index)
                    }
                    aria-label={`Ver imagem ${
                      index + 1
                    }`}
                  >
                    <img
                      src={img}
                      alt=""
                    />
                  </button>
                ))}

              </div>
            )}

          </div>

          {/* INFORMAÇÕES */}

          <div className={styles.info}>

            {/* BADGES */}

            <div className={styles.badges}>

              <Badge variant={conditionVariant}>
                {getConditionLabel(
                  product.condition
                )}
              </Badge>

              <Badge variant="default">
                Tamanho {product.size}
              </Badge>

              {unavailable && (
                <span
                  className={
                    styles.soldBadge
                  }
                >
                  Vendido
                </span>
              )}

            </div>

            {/* TÍTULO */}

            <h1 className={styles.name}>
              {product.name}
            </h1>

            <p className={styles.brand}>
              {product.brand}
            </p>

            {/* PREÇO */}

            <div className={styles.prices}>

              {unavailable ? (
                <span className={styles.soldOut}>
                  Produto vendido
                </span>
              ) : (
                <>
                  <span className={styles.price}>
                    {formatPrice(
                      product.price
                    )}
                  </span>

                  {product.originalPrice >
                    product.price && (
                    <span
                      className={
                        styles.originalPrice
                      }
                    >
                      {formatPrice(
                        product.originalPrice
                      )}
                    </span>
                  )}

                  {discount > 0 && (
                    <span
                      className={
                        styles.discount
                      }
                    >
                      -{discount}%
                    </span>
                  )}
                </>
              )}

            </div>

            {/* DETALHES */}

            <div className={styles.meta}>

              <div className={styles.metaRow}>
                <span
                  className={
                    styles.metaLabel
                  }
                >
                  Tamanho
                </span>

                <span
                  className={
                    styles.metaValue
                  }
                >
                  {product.size}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span
                  className={
                    styles.metaLabel
                  }
                >
                  Condição
                </span>

                <span
                  className={
                    styles.metaValue
                  }
                >
                  {getConditionLabel(
                    product.condition
                  )}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span
                  className={
                    styles.metaLabel
                  }
                >
                  Marca
                </span>

                <span
                  className={
                    styles.metaValue
                  }
                >
                  {product.brand}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span
                  className={
                    styles.metaLabel
                  }
                >
                  Vendedora
                </span>

                <span
                  className={
                    styles.metaValue
                  }
                >
                  {product.supplierName ||
                    product.seller ||
                    'Fornecedora'}
                </span>
              </div>

              {product.location && (
                <div className={styles.metaRow}>
                  <span
                    className={
                      styles.metaLabel
                    }
                  >
                    Localização
                  </span>

                  <span
                    className={
                      styles.metaValue
                    }
                  >
                    📍 {product.location}
                  </span>
                </div>
              )}

            </div>

            {/* AÇÕES */}

            <div className={styles.actions}>

              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={unavailable}
                className={styles.addBtn}
              >
                {unavailable
                  ? 'Produto vendido'
                  : added
                  ? '✓ Adicionado ao carrinho'
                  : '🛒 Adicionar ao carrinho'}
              </Button>

              <button
                type="button"
                className={[
                  styles.favBtn,
                  favorited
                    ? styles.favBtnActive
                    : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={handleFavorite}
                aria-label={
                  favorited
                    ? 'Remover dos favoritos'
                    : 'Adicionar aos favoritos'
                }
                aria-pressed={favorited}
              >
                <HeartIcon
                  filled={favorited}
                />
              </button>

            </div>

            {/* FRETE */}

            {!unavailable && (
              <div className={styles.shipping}>
                <span className={styles.shippingIcon}>
                  🚚
                </span>

                <div>
                  <strong>
                    Frete grátis
                  </strong>

                  <span>
                    em compras acima de
                    R$ 150,00
                  </span>
                </div>
              </div>
            )}

            {/* DESCRIÇÃO */}

            <div className={styles.description}>

              <h2
                className={
                  styles.descTitle
                }
              >
                Sobre esta peça
              </h2>

              <p
                className={
                  styles.descText
                }
              >
                {product.description ||
                  'Sem descrição cadastrada.'}
              </p>

            </div>

            {/* TAGS */}

            {Array.isArray(product.tags) &&
              product.tags.length > 0 && (
                <div className={styles.tags}>
                  {product.tags.map((tag) => (
                    <Link
                      key={tag}
                      to={`/catalogo?q=${encodeURIComponent(
                        tag
                      )}`}
                      className={styles.tag}
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

          </div>
        </div>

        {/* PRODUTOS RELACIONADOS */}

        {related.length > 0 && (
          <section className={styles.related}>

            <div className={styles.relatedHeader}>
              <div>
                <span
                  className={
                    styles.relatedEyebrow
                  }
                >
                  Você também pode gostar
                </span>

                <h2
                  className={
                    styles.relatedTitle
                  }
                >
                  Mais peças desta fornecedora
                </h2>
              </div>

              <Link
                to={`/catalogo?seller=${encodeURIComponent(
                  product.seller || ''
                )}`}
                className={
                  styles.relatedLink
                }
              >
                Ver catálogo →
              </Link>
            </div>

            <div
              className={
                styles.relatedGrid
              }
            >
              {related.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                />
              ))}
            </div>

          </section>
        )}

        {/* VOLTAR */}

        <div className={styles.footer}>
          <Link
            to="/catalogo"
            className={
              styles.backLink
            }
          >
            ← Voltar ao catálogo
          </Link>
        </div>

      </div>
    </div>
  );
}