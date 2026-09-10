import { useId } from 'react';
import styles from './Input.module.css';

export default function Input({
  label,
  error,
  id,
  type = 'text',
  className = '',
  ...props
}) {
  const generatedId = useId();
  id = id || generatedId;
  return (
    <div className={styles.wrapper}>
      {label && <label htmlFor={id} className={styles.label}>{label}</label>}
      <input
        id={id}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        type={type}
        className={[styles.input, error ? styles.hasError : '', className].filter(Boolean).join(' ')}
        {...props}
      />
      {error && <p id={`${id}-error`} role="alert" className={styles.error}>{error}</p>}
    </div>
  );
}
