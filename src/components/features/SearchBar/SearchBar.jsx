import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDebounce } from '../../../hooks/useDebounce';
import { quickSearch } from '../../../data/productService';
import styles from './SearchBar.module.css';

export default function SearchBar({ onClose }) {
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 300);
  const [results, setResults] = useState([]);
  const navigate = useNavigate();
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([]);
      return;
    }
    setResults(quickSearch(debouncedQuery, 6));
  }, [debouncedQuery]);

  function handleSelect(id) {
    onClose();
    navigate(`/produto/${id}`);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (query.trim()) {
      onClose();
      navigate(`/catalogo?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.container} onClick={(e) => e.stopPropagation()}>
        <form className={styles.form} onSubmit={handleSubmit}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={inputRef}
            className={styles.input}
            type="search"
            placeholder="Buscar produtos, marcas, categorias..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button type="button" className={styles.closeBtn} onClick={onClose}>✕</button>
        </form>
        {results.length > 0 && (
          <ul className={styles.results}>
            {results.map((p) => (
              <li key={p.id}>
                <button className={styles.resultItem} onClick={() => handleSelect(p.id)}>
                  <img src={p.images[0]} alt={p.name} className={styles.thumb} />
                  <div className={styles.resultInfo}>
                    <span className={styles.resultName}>{p.name}</span>
                    <span className={styles.resultMeta}>{p.brand} · {p.size}</span>
                  </div>
                  <span className={styles.resultPrice}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(p.price)}
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button className={styles.viewAll} onClick={handleSubmit}>
                Ver todos os resultados para "{query}" →
              </button>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
