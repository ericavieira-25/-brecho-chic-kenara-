import styles from './Button.module.css';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className = '',
  ...props
}) {
  return (
    <button
      type={type}
      className={[styles.btn, styles[variant], styles[size], className].filter(Boolean).join(' ')}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? <span className={styles.spinner} /> : children}
    </button>
  );
}
