import { Link } from 'react-router-dom';
import Button from '../../components/ui/Button/Button';
import styles from './NotFound.module.css';

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <p className={styles.code}>404</p>
        <h1 className={styles.title}>Página não encontrada</h1>
        <p className={styles.text}>
          Oops! A página que você está procurando não existe ou foi removida.
        </p>
        <div className={styles.actions}>
          <Link to="/">
            <Button variant="primary" size="lg">Voltar para o início</Button>
          </Link>
          <Link to="/catalogo">
            <Button variant="outline" size="lg">Explorar catálogo</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
