import { useDialog } from '../../../hooks/useDialog';
import styles from './Modal.module.css';

export default function Modal({ isOpen, onClose, title, children }) {
  const panel = useDialog(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div ref={panel} role="dialog" aria-modal="true" aria-label={title || 'Detalhes'} tabIndex={-1} className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          {title && <h3 className={styles.title}>{title}</h3>}
          <button className={styles.close} onClick={onClose} aria-label="Fechar">
            ✕
          </button>
        </div>
        <div className={styles.body}>{children}</div>
      </div>
    </div>
  );
}
