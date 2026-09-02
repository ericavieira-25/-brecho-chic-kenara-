import { categories, sizes, conditions } from '../../../data/categories';
import Button from '../../ui/Button/Button';
import styles from './FilterPanel.module.css';

export default function FilterPanel({ filters, onChange, onClear }) {
  function toggle(key, value) {
    const arr = filters[key] || [];
    onChange(key, arr.includes(value) ? arr.filter((v) => v !== value) : [...arr, value]);
  }

  function handlePriceChange(field, val) {
    onChange(field, Number(val));
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <h3 className={styles.title}>Filtros</h3>
        <button className={styles.clearBtn} onClick={onClear}>Limpar tudo</button>
      </div>

      {/* Category */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Categoria</h4>
        {categories.map((cat) => (
          <label key={cat.id} className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={(filters.categories || []).includes(cat.id)}
              onChange={() => toggle('categories', cat.id)}
              className={styles.checkbox}
            />
            {cat.icon} {cat.name}
          </label>
        ))}
      </div>

      {/* Size */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Tamanho</h4>
        <div className={styles.sizeGrid}>
          {sizes.map((s) => (
            <button
              key={s}
              className={[styles.sizeBtn, (filters.sizes || []).includes(s) ? styles.sizeBtnActive : ''].join(' ')}
              onClick={() => toggle('sizes', s)}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Price range */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Faixa de preço</h4>
        <div className={styles.priceInputs}>
          <div className={styles.priceField}>
            <label className={styles.priceLabel}>Mín. R$</label>
            <input
              type="number"
              className={styles.priceInput}
              value={filters.minPrice ?? ''}
              min={0}
              placeholder="0"
              onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            />
          </div>
          <span className={styles.priceSep}>—</span>
          <div className={styles.priceField}>
            <label className={styles.priceLabel}>Máx. R$</label>
            <input
              type="number"
              className={styles.priceInput}
              value={filters.maxPrice ?? ''}
              min={0}
              placeholder="500"
              onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Condition */}
      <div className={styles.section}>
        <h4 className={styles.sectionTitle}>Condição</h4>
        {conditions.map((c) => (
          <label key={c.id} className={styles.checkLabel}>
            <input
              type="checkbox"
              checked={(filters.conditions || []).includes(c.id)}
              onChange={() => toggle('conditions', c.id)}
              className={styles.checkbox}
            />
            {c.label}
          </label>
        ))}
      </div>

      <Button variant="primary" size="sm" onClick={onClear} className={styles.applyBtn}>
        Aplicar filtros
      </Button>
    </aside>
  );
}
