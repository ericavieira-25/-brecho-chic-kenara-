import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useGuard } from '../../hooks/useGuard';
import { USER_ROLES } from '../../data/roles';
import { categories } from '../../data/categories';
import { getFeaturedProducts, getNewestProducts } from '../../data/productService';
import ProductCard from '../../components/ui/ProductCard/ProductCard';
import Button from '../../components/ui/Button/Button';
import styles from './Home.module.css';

export default function Home() {
  const { hasRole } = useGuard();
  const isAdmin = hasRole(USER_ROLES.ADMIN);
  const [newest, setNewest] = useState([]);
const [featured, setFeatured] = useState([]);

useEffect(() => {
  async function loadProducts() {
    const [newestProducts, featuredProducts] = await Promise.all([
      getNewestProducts(8),
      getFeaturedProducts(4),
    ]);

    setNewest(newestProducts);
    setFeatured(featuredProducts);
  }

  loadProducts();
}, []);
  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
              <span className={styles.heroPill}>
                <span className={styles.heroPillHeart}>♥</span>
                Jesus, meu Sócio majoritário
              </span>
              <h1 className={styles.heroTitle}>
                Moda com alma,<br />
                <span className={styles.heroHighlight}>estilo e fé</span>
              </h1>
              <p className={styles.heroDesc}>
                Peças únicas, selecionadas com carinho, para mulheres que vestem
                sua história com elegância e gratidão.
              </p>
            <div className={styles.heroCtas}>
              <Link to="/catalogo">
                <Button variant="primary" size="lg">Explorar Catálogo</Button>
              </Link>
              {isAdmin && (
                <Link to="/adicionar-produto">
                  <Button variant="outline" size="lg">📦 Adicionar Produto</Button>
                </Link>
              )}
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>200+</span>
                <span className={styles.statLabel}>peças disponíveis</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>♥</span>
                <span className={styles.statLabel}>peças com amor</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>com propósito</span>
              </div>
            </div>
          </div>

          <div className={styles.heroImages} aria-hidden="true">
            <div className={`${styles.heroImg} ${styles.heroImg1}`}>
              <img src="https://picsum.photos/seed/hero-a/400/700" alt="Moda" />
            </div>
            <div className={`${styles.heroImg} ${styles.heroImg2}`}>
              <img src="https://picsum.photos/seed/hero-b/400/320" alt="Estilo" />
            </div>
            <div className={`${styles.heroImg} ${styles.heroImg3}`}>
              <img src="https://picsum.photos/seed/hero-c/400/320" alt="Tendência" />
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES STRIP ── */}
      <div className={styles.features}>
        <div className={styles.featuresInner}>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>👗</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Peças com História</span>
              <span className={styles.featureDesc}>Cada peça tem sua própria beleza</span>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✨</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Selecionadas com Carinho</span>
              <span className={styles.featureDesc}>Qualidade verificada em cada peça</span>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>🚚</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Frete Grátis</span>
              <span className={styles.featureDesc}>Em compras acima de R$ 150</span>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>💕</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Compra Segura</span>
              <span className={styles.featureDesc}>Pagamento via PIX protegido</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORIES ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Explorar</p>
            <h2 className={styles.sectionTitle}>Categorias</h2>
          </div>
          <Link to="/catalogo" className={styles.seeAll}>Ver todas →</Link>
        </div>
        <div className={styles.categoriesGrid}>
          {categories.map((cat) => (
            <Link key={cat.id} to={`/catalogo?categoria=${cat.id}`} className={styles.categoryCard}>
              <div className={styles.categoryImgWrap}>
                <img src={cat.image} alt={cat.name} loading="lazy" />
              </div>
              <div className={styles.categoryInfo}>
                <span className={styles.categoryIcon}>{cat.icon}</span>
                <span className={styles.categoryName}>{cat.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FEATURED DEALS ── */}
      <div className={styles.sectionFullBg}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.sectionEyebrow}>Melhores Descontos</p>
              <h2 className={styles.sectionTitle}>Peças em Destaque</h2>
              <p className={styles.sectionDesc}>Oportunidades incríveis com os maiores descontos do catálogo.</p>
            </div>
            <Link to="/catalogo" className={styles.seeAll}>Ver catálogo →</Link>
          </div>
          <div className={styles.productsGrid}>
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </div>

      {/* ── NEW ARRIVALS ── */}
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <div>
            <p className={styles.sectionEyebrow}>Acabou de chegar</p>
            <h2 className={styles.sectionTitle}>Novidades</h2>
            <p className={styles.sectionDesc}>As peças mais recentes adicionadas ao nosso catálogo.</p>
          </div>
          <Link to="/catalogo?sort=mais-recentes" className={styles.seeAll}>Ver todas →</Link>
        </div>
        <div className={styles.productsGrid}>
          {newest.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 'var(--space-10)' }}>
          <Link to="/catalogo">
            <Button variant="outline" size="lg">Ver todos os produtos</Button>
          </Link>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <div className={styles.howSection}>
        <div className={styles.howInner}>
          <div className={styles.howHeader}>
            <p className={styles.sectionEyebrow}>Simples assim</p>
            <h2 className={styles.sectionTitle}>Como funciona</h2>
          </div>
          <div className={styles.steps}>
            <div className={styles.step}>
              <span className={styles.stepNum}>01</span>
              <div className={styles.stepIcon}>🔍</div>
              <h3 className={styles.stepTitle}>Navegue</h3>
              <p className={styles.stepText}>Explore o catálogo com peças únicas selecionadas com carinho pela Kenara.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>02</span>
              <div className={styles.stepIcon}>💕</div>
              <h3 className={styles.stepTitle}>Escolha</h3>
              <p className={styles.stepText}>Filtre por categoria, tamanho e preço para encontrar sua peça perfeita.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>03</span>
              <div className={styles.stepIcon}>🙏</div>
              <h3 className={styles.stepTitle}>Receba com fé</h3>
              <p className={styles.stepText}>Pague via PIX e receba em casa. Cada compra abençoada! 💕</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SLOGAN / ASSINATURA ── */}
      <div className={styles.sloganSection}>
        <div className={styles.sloganInner}>
          <div className={styles.sloganHeart}>♥</div>
          <p className={styles.sloganEyebrow}>Nossa missão</p>
          <h2 className={styles.sloganTitle}>
            Jesus, meu<br />
            <span className={styles.sloganHighlight}>Sócio majoritário</span>
          </h2>
          <p className={styles.sloganDesc}>
            O Brechó Chic Kenara nasceu da fé e do amor pela moda sustentável.
            Cada peça é selecionada com gratidão e entregue com carinho. 💕
          </p>
          <div className={styles.sloganContact}>
            <a
              href="https://www.instagram.com/chic.kenara/"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sloganLink}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              @chic.kenara
            </a>
            <a
              href="https://wa.me/5555997181206"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sloganLink}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12 0C5.373 0 0 5.373 0 12c0 2.127.558 4.126 1.533 5.857L.057 23.428a.75.75 0 0 0 .921.921l5.571-1.476A11.942 11.942 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.714 9.714 0 0 1-4.953-1.354l-.355-.211-3.684.976.99-3.595-.232-.371A9.715 9.715 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/>
              </svg>
              55-997181206
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
