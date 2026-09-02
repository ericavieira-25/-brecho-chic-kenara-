import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAllProducts } from '../../data/productService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Catalog.module.css';

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('recent');

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        setLoading(true);

        const result = await getAllProducts();
        console.log('PRODUTOS RECEBIDOS NO CATÁLOGO:', result);

        setProducts(Array.isArray(result) ? result : []);
      } catch (error) {
        console.error('Erro ao carregar catálogo:', error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  const filteredProducts = products
    .filter((product) => {
      const searchText = search.trim().toLowerCase();

      const productName = String(product.name || '').toLowerCase();
      const productBrand = String(product.brand || '').toLowerCase();
      const productDescription = String(
        product.description || ''
      ).toLowerCase();

      const productTags = Array.isArray(product.tags)
        ? product.tags
        : [];

      const matchesSearch =
        !searchText ||
        productName.includes(searchText) ||
        productBrand.includes(searchText) ||
        productDescription.includes(searchText) ||
        productTags.some((tag) =>
          String(tag).toLowerCase().includes(searchText)
        );

      const matchesCategory =
        !category || product.category === category;

      const matchesSize =
        !size || product.size === size;

      const matchesCondition =
        !condition || product.condition === condition;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesCondition
      );
    })
    .sort((a, b) => {
      const priceA = Number(a.price) || 0;
      const priceB = Number(b.price) || 0;

      const originalPriceA =
        Number(a.originalPrice) || 0;

      const originalPriceB =
        Number(b.originalPrice) || 0;

      if (sort === 'priceAsc') {
        return priceA - priceB;
      }

      if (sort === 'priceDesc') {
        return priceB - priceA;
      }

      if (sort === 'discount') {
        const discountA =
          originalPriceA > priceA
            ? ((originalPriceA - priceA) /
                originalPriceA) *
              100
            : 0;

        const discountB =
          originalPriceB > priceB
            ? ((originalPriceB - priceB) /
                originalPriceB) *
              100
            : 0;

        return discountB - discountA;
      }

      return (
        new Date(b.createdAt || 0) -
        new Date(a.createdAt || 0)
      );
    });

  function clearFilters() {
    setSearch('');
    setCategory('');
    setSize('');
    setCondition('');
    setSort('recent');
  }

  function getConditionLabel(value) {
    const labels = {
      otimo: 'Ótimo estado',
      bom: 'Bom estado',
      regular: 'Estado regular',
    };

    return labels[value] || value || 'Não informado';
  }

  function getCategoryLabel(value) {
    const labels = {
      vestidos: 'Vestidos',
      blusas: 'Blusas',
      calcas: 'Calças',
      saias: 'Saias',
      casacos: 'Casacos',
      acessorios: 'Acessórios',
    };

    return labels[value] || value || 'Sem categoria';
  }

  function getProductImage(product) {
    if (
      Array.isArray(product.images) &&
      product.images.length > 0
    ) {
      return product.images[0];
    }

    if (product.photo) {
      return product.photo;
    }

    if (product.image) {
      return product.image;
    }

    return '/placeholder-product.jpg';
  }

  if (loading) {
    return (
      <main className={styles.page}>
        <div className={styles.container}>
          <section className={styles.empty}>
            <div className={styles.emptyIcon}>
              🛍️
            </div>

            <h2>
              Carregando produtos...
            </h2>

            <p>
              Buscando as peças disponíveis.
            </p>
          </section>
        </div>
      </main>
    );
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        <header className={styles.header}>
          <div>
            <p className={styles.eyebrow}>
              BRECHÓ CHIC KENARA
            </p>

            <h1 className={styles.title}>
              Catálogo
            </h1>

            <p className={styles.subtitle}>
              Encontre peças únicas para o seu estilo.
            </p>
          </div>

          <span className={styles.count}>
            {filteredProducts.length}{' '}
            {filteredProducts.length === 1
              ? 'produto'
              : 'produtos'}
          </span>
        </header>

        <section className={styles.filters}>

          <div className={styles.searchBox}>
            <label htmlFor="search">
              Buscar
            </label>

            <input
              id="search"
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nome, marca ou estilo..."
            />
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="category">
              Categoria
            </label>

            <select
              id="category"
              value={category}
              onChange={(event) =>
                setCategory(event.target.value)
              }
            >
              <option value="">
                Todas
              </option>

              <option value="vestidos">
                Vestidos
              </option>

              <option value="blusas">
                Blusas
              </option>

              <option value="calcas">
                Calças
              </option>

              <option value="saias">
                Saias
              </option>

              <option value="casacos">
                Casacos
              </option>

              <option value="acessorios">
                Acessórios
              </option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="size">
              Tamanho
            </label>

            <select
              id="size"
              value={size}
              onChange={(event) =>
                setSize(event.target.value)
              }
            >
              <option value="">
                Todos
              </option>

              <option value="PP">PP</option>
              <option value="P">P</option>
              <option value="M">M</option>
              <option value="G">G</option>
              <option value="GG">GG</option>
              <option value="XG">XG</option>
              <option value="36">36</option>
              <option value="38">38</option>
              <option value="40">40</option>
              <option value="Único">Único</option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="condition">
              Conservação
            </label>

            <select
              id="condition"
              value={condition}
              onChange={(event) =>
                setCondition(event.target.value)
              }
            >
              <option value="">
                Todas
              </option>

              <option value="otimo">
                Ótimo estado
              </option>

              <option value="bom">
                Bom estado
              </option>

              <option value="regular">
                Estado regular
              </option>
            </select>
          </div>

          <div className={styles.filterGroup}>
            <label htmlFor="sort">
              Ordenar
            </label>

            <select
              id="sort"
              value={sort}
              onChange={(event) =>
                setSort(event.target.value)
              }
            >
              <option value="recent">
                Mais recentes
              </option>

              <option value="priceAsc">
                Menor preço
              </option>

              <option value="priceDesc">
                Maior preço
              </option>

              <option value="discount">
                Maior desconto
              </option>
            </select>
          </div>

          {(search ||
            category ||
            size ||
            condition ||
            sort !== 'recent') && (
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          )}
        </section>

        {filteredProducts.length === 0 ? (
          <section className={styles.empty}>
            <div className={styles.emptyIcon}>
              🔎
            </div>

            <h2>
              Nenhum produto encontrado
            </h2>

            <p>
              Tente mudar sua busca ou remover
              alguns filtros.
            </p>

            <Button
              variant="primary"
              onClick={clearFilters}
            >
              Limpar filtros
            </Button>
          </section>
        ) : (
          <section className={styles.grid}>
            {filteredProducts.map((product) => {
              const price =
                Number(product.price) || 0;

              const originalPrice =
                Number(product.originalPrice) || 0;

              const hasDiscount =
                originalPrice > price;

              const discount = hasDiscount
                ? Math.round(
                    ((originalPrice - price) /
                      originalPrice) *
                      100
                  )
                : 0;

              const image =
                getProductImage(product);

              return (
                <article
                  key={product.id}
                  className={styles.product}
                >
                  <Link
                    to={`/produto/${product.id}`}
                    className={styles.imageLink}
                  >
                    <div
                      className={
                        styles.imageWrapper
                      }
                    >
                      <img
                        src={image}
                        alt={product.name}
                        className={styles.image}
                        loading="lazy"
                      />

                      {hasDiscount && (
                        <span
                          className={
                            styles.discount
                          }
                        >
                          -{discount}%
                        </span>
                      )}

                      <span
                        className={
                          styles.condition
                        }
                      >
                        {getConditionLabel(
                          product.condition
                        )}
                      </span>
                    </div>
                  </Link>

                  <div
                    className={
                      styles.productInfo
                    }
                  >
                    <span
                      className={
                        styles.category
                      }
                    >
                      {getCategoryLabel(
                        product.category
                      )}
                    </span>

                    <h2
                      className={
                        styles.productName
                      }
                    >
                      <Link
                        to={`/produto/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </h2>

                    <p
                      className={
                        styles.brand
                      }
                    >
                      {product.brand ||
                        'Marca não informada'}
                    </p>

                    <div
                      className={styles.meta}
                    >
                      <span>
                        Tamanho{' '}
                        {product.size ||
                          'Único'}
                      </span>

                      {product.location && (
                        <span>
                          {product.location}
                        </span>
                      )}
                    </div>

                    <div
                      className={
                        styles.priceArea
                      }
                    >
                      <div>
                        <strong
                          className={
                            styles.price
                          }
                        >
                          {formatPrice(price)}
                        </strong>

                        {hasDiscount && (
                          <span
                            className={
                              styles.originalPrice
                            }
                          >
                            {formatPrice(
                              originalPrice
                            )}
                          </span>
                        )}
                      </div>

                      <Link
                        to={`/produto/${product.id}`}
                      >
                        <Button
                          variant="primary"
                          size="sm"
                        >
                          Ver produto
                        </Button>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </section>
        )}
      </div>
    </main>
  );
}