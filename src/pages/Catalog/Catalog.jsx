import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getAvailableProducts } from '../../data/productService.js';
import { formatPrice } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Catalog.module.css';

export default function Catalog() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [size, setSize] = useState('');
  const [condition, setCondition] = useState('');
  const [sort, setSort] = useState('recent');

  const filteredProducts = useMemo(() => {
    let result = getAvailableProducts().filter((product) => {
      const searchText = search.trim().toLowerCase();

      const matchesSearch =
        !searchText ||
        product.name.toLowerCase().includes(searchText) ||
        product.brand.toLowerCase().includes(searchText) ||
        product.description.toLowerCase().includes(searchText) ||
        product.tags.some((tag) =>
          tag.toLowerCase().includes(searchText)
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
    });

    result = [...result].sort((a, b) => {
      if (sort === 'priceAsc') {
        return a.price - b.price;
      }

      if (sort === 'priceDesc') {
        return b.price - a.price;
      }

      if (sort === 'discount') {
        const discountA =
          ((a.originalPrice - a.price) / a.originalPrice) * 100;

        const discountB =
          ((b.originalPrice - b.price) / b.originalPrice) * 100;

        return discountB - discountA;
      }

      return (
        new Date(b.createdAt) -
        new Date(a.createdAt)
      );
    });

    return result;
  }, [search, category, size, condition, sort]);

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

    return labels[value] || value;
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

    return labels[value] || value;
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
              const hasDiscount =
                product.originalPrice >
                product.price;

              const discount = hasDiscount
                ? Math.round(
                    ((product.originalPrice -
                      product.price) /
                      product.originalPrice) *
                      100
                  )
                : 0;

              return (
                <article
                  key={product.id}
                  className={styles.product}
                >
                  <Link
                    to={`/produto/${product.id}`}
                    className={styles.imageLink}
                  >
                    <div className={styles.imageWrapper}>
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className={styles.image}
                        loading="lazy"
                      />

                      {hasDiscount && (
                        <span className={styles.discount}>
                          -{discount}%
                        </span>
                      )}

                      <span className={styles.condition}>
                        {getConditionLabel(
                          product.condition
                        )}
                      </span>
                    </div>
                  </Link>

                  <div className={styles.productInfo}>

                    <span className={styles.category}>
                      {getCategoryLabel(
                        product.category
                      )}
                    </span>

                    <h2 className={styles.productName}>
                      <Link
                        to={`/produto/${product.id}`}
                      >
                        {product.name}
                      </Link>
                    </h2>

                    <p className={styles.brand}>
                      {product.brand}
                    </p>

                    <div className={styles.meta}>
                      <span>
                        Tamanho {product.size}
                      </span>

                      <span>
                        {product.location}
                      </span>
                    </div>

                    <div className={styles.priceArea}>
                      <div>
                        <strong className={styles.price}>
                          {formatPrice(product.price)}
                        </strong>

                        {hasDiscount && (
                          <span
                            className={styles.originalPrice}
                          >
                            {formatPrice(
                              product.originalPrice
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