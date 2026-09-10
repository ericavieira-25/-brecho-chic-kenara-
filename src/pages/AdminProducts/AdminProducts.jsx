import { useConfirmation } from '../../hooks/useConfirmation.jsx';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { getAllProducts, deleteProduct } from '../../data/productService.js';

import styles from './AdminProducts.module.css';

export default function AdminProducts() {
  const [confirmAction, confirmationDialog] = useConfirmation();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  async function loadProducts() {
    try {
      setErrorMessage('');
      setProducts(await getAllProducts());
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setErrorMessage(error.message || 'Não foi possível carregar as peças.');
    }
  }

  useEffect(() => {
    loadProducts();
  }, []);

  async function handleDelete(productId) {
    const confirmed = await confirmAction(
      'Tem certeza que deseja excluir esta peça?'
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteProduct(productId);
      await loadProducts();
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      setErrorMessage(error.message || 'Não foi possível excluir a peça.');
    }
  }

  return (
    <main className={styles.page}>
      {confirmationDialog}
      <div className={styles.container}>
        {errorMessage && <p role="alert">{errorMessage}</p>}
        <nav aria-label="Navegação de produtos" style={{display:'flex', gap:'1rem', marginBottom:'1rem'}}>
          <Link to="/admin">← Painel administrativo</Link>
          <Link to="/admin/produtos/novo">+ Cadastrar peça</Link>
        </nav>

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
                          {({disponivel:'Disponível', reservado:'Reservada', vendido:'Vendida', indisponivel:'Indisponível'})[product.status] || 'Indisponível'}
                        </span>
                      </td>


                      <td>
                        <div className={styles.actions}>

                          <button
                            type="button"
                            className={styles.editButton}
                            disabled={['reservado', 'vendido'].includes(product.status)}
                            title={['reservado', 'vendido'].includes(product.status) ? 'Peças reservadas ou vendidas não podem ser editadas' : 'Editar peça'}
                            onClick={() => navigate(`/admin/produtos/${product.id}/editar`)}
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
