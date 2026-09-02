import { Link } from 'react-router-dom';
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
  const newest = getNewestProducts(8);
  const featured = getFeaturedProducts(4);

  return (
    <div className={styles.page}>

      {/* ── HERO ── */}
      <section className={styles.hero}>
        <div className={styles.heroBg} aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.heroContent}>
            <span className={styles.heroPill}>
              <span className={styles.heroPillDot} />
              Moda sustentável &amp; consciente
            </span>
            <h1 className={styles.heroTitle}>
              Peças únicas com<br />
              <span className={styles.heroHighlight}>história e estilo</span>
            </h1>
            <p className={styles.heroDesc}>
              Descubra roupas e acessórios de segunda mão cuidadosamente selecionados.
              Moda que valoriza o passado e cuida do futuro.
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
                <span className={styles.statNumber}>50+</span>
                <span className={styles.statLabel}>vendedoras</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statNumber}>100%</span>
                <span className={styles.statLabel}>sustentável</span>
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
            <span className={styles.featureIcon}>🌿</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Moda Consciente</span>
              <span className={styles.featureDesc}>Contribua para um planeta melhor</span>
            </div>
          </div>
          <div className={styles.feature}>
            <span className={styles.featureIcon}>✨</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Peças Selecionadas</span>
              <span className={styles.featureDesc}>Qualidade verificada com carinho</span>
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
            <span className={styles.featureIcon}>💛</span>
            <div className={styles.featureText}>
              <span className={styles.featureTitle}>Compra Segura</span>
              <span className={styles.featureDesc}>Pagamento 100% protegido</span>
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
              <p className={styles.stepText}>Explore nosso catálogo com centenas de peças únicas selecionadas com carinho.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>02</span>
              <div className={styles.stepIcon}>💛</div>
              <h3 className={styles.stepTitle}>Escolha</h3>
              <p className={styles.stepText}>Filtre por categoria, tamanho, preço e condição para encontrar sua peça perfeita.</p>
            </div>
            <div className={styles.step}>
              <span className={styles.stepNum}>03</span>
              <div className={styles.stepIcon}>📦</div>
              <h3 className={styles.stepTitle}>Receba</h3>
              <p className={styles.stepText}>Finalize sua compra com segurança e receba suas peças em casa rapidinho.</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA BANNER ── */}
      <section className={styles.ctaBanner}>
        <div className={styles.ctaInner}>
          <p className={styles.ctaEyebrow}>Para vendedoras</p>
          <h2 className={styles.ctaTitle}>Tem peças para vender?</h2>
          <p className={styles.ctaText}>
            Cadastre suas roupas e acessórios e ganhe dinheiro com o que está parado no armário.
            É fácil, rápido e gratuito.
          </p>
          <div className={styles.ctaBtns}>
            <Link to="/adicionar-produto" className={styles.ctaBtnLight}>
              Quero vender minhas peças
            </Link>
            <Link to="/catalogo" className={styles.ctaBtnOutline}>
              Ver como funciona
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
