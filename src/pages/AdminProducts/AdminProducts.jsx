import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

import { getProducts, deleteProduct } from '../../services/productService';

import styles from './AdminProducts.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);

  function loadProducts() {
    const savedProducts = getProducts();
    setProducts(savedProducts);
  }

  useEffect(() => {
    loadProducts();
  }, []);

  function handleDelete(productId) {
    const confirmed = window.confirm(
      'Tem certeza que deseja excluir esta peça?'
    );

    if (!confirmed) {
      return;
    }

    const updatedProducts = deleteProduct(productId);
    setProducts(updatedProducts);
  }

  return (
    <main className={styles.page}>
      <div className={styles.container}>

        <div className={styles.header}>
          <div>
            <span className={styles.eyebrow}>
              ADMINISTRAÇÃO
            </span>

            <h1>Produtos</h1>

            <p>
              Gerencie as peças cadastradas no Brechó Chic Kenara.
            </p>
          </div>

          <Link
            to="/adicionar-produto"
            className={styles.addButton}
          >
            + Adicionar produto
          </Link>
        </div>


        <div className={styles.summary}>
          <div className={styles.summaryCard}>
            <span>Produtos cadastrados</span>
            <strong>{products.length}</strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Disponíveis</span>
            <strong>
              {
                products.filter(
                  (product) => product.status === 'disponivel'
                ).length
              }
            </strong>
          </div>

          <div className={styles.summaryCard}>
            <span>Valor dos produtos</span>
            <strong>
              {formatCurrency(
                products.reduce(
                  (total, product) =>
                    total + Number(product.price || 0),
                  0
                )
              )}
            </strong>
          </div>
        </div>


        {products.length === 0 ? (
          <section className={styles.empty}>
            <div className={styles.emptyIcon}>
              👗
            </div>

            <h2>Nenhum produto cadastrado</h2>

            <p>
              Quando uma peça for cadastrada,
              ela aparecerá aqui.
            </p>

            <Link
              to="/adicionar-produto"
              className={styles.emptyButton}
            >
              Cadastrar primeira peça
            </Link>
          </section>
        ) : (
          <section className={styles.productsSection}>

            <div className={styles.sectionHeader}>
              <h2>Peças cadastradas</h2>

              <button
                type="button"
                onClick={loadProducts}
                className={styles.refreshButton}
              >
                ↻ Atualizar
              </button>
            </div>


            <div className={styles.tableWrapper}>
              <table className={styles.table}>

                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Categoria</th>
                    <th>Preço</th>
                    <th>Fornecedora</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr key={product.id}>

                      <td>
                        <div className={styles.productInfo}>

                          {product.photo ? (
                            <img
                              src={product.photo}
                              alt={product.name}
                              className={styles.productImage}
                            />
                          ) : (
                            <div className={styles.noImage}>
                              👗
                            </div>
                          )}

                          <div>
                            <strong>
                              {product.name}
                            </strong>

                            {product.brand && (
                              <span>
                                {product.brand}
                              </span>
                            )}
                          </div>

                        </div>
                      </td>


                      <td>
                        {product.categoryName ||
                          product.category ||
                          '—'}
                      </td>


                      <td>
                        <strong>
                          {formatCurrency(product.price)}
                        </strong>
                      </td>


                      <td>
                        {product.supplierName || '—'}
                      </td>


                      <td>
                        <span
                          className={`${styles.status} ${
                            product.status === 'disponivel'
                              ? styles.available
                              : styles.unavailable
                          }`}
                        >
                          {product.status === 'disponivel'
                            ? 'Disponível'
                            : 'Indisponível'}
                        </span>
                      </td>


                      <td>
                        <div className={styles.actions}>

                          <button
                            type="button"
                            className={styles.editButton}
                            onClick={() =>
                              alert(
                                'A edição de produtos será implementada na próxima etapa.'
                              )
                            }
                          >
                            ✏️ Editar
                          </button>

                          <button
                            type="button"
                            className={styles.deleteButton}
                            onClick={() =>
                              handleDelete(product.id)
                            }
                          >
                            🗑️ Excluir
                          </button>

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>

              </table>
            </div>

          </section>
        )}

      </div>
    </main>
  );
}


function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number(value) || 0);
}