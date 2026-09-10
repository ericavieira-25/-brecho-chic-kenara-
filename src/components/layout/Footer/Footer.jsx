import { Link } from 'react-router-dom';

import { useGuard } from '../../../hooks/useGuard';
import { USER_ROLES } from '../../../data/roles';
import styles from './Footer.module.css';

export default function Footer() {
  const { hasRole } = useGuard();
  const isAdmin = hasRole(USER_ROLES.ADMIN);
  return (
    <footer className={styles.footer}>
      <div className={styles.inner}>
        {/* Brand */}
        <div className={styles.brand}>
          <Link to="/" className={styles.logo}>
            <span className={styles.logoIcon}>🌸</span>
            <span className={styles.logoText}>
              <span className={styles.logoMain}>Brechó Chic</span>
              <span className={styles.logoSub}>Kenara</span>
            </span>
          </Link>
          <p className={styles.slogan}>
            Moda consciente e estilo único. Peças de segunda mão com história e personalidade.
          </p>
          <div className={styles.social}>
            <a href="https://www.instagram.com/chic.kenara/" target="_blank" rel="noopener noreferrer" className={styles.socialLink} aria-label="Instagram">📷</a>

          </div>

        </div>

        {/* Institucional */}
        <div className={styles.links}>
          <h4 className={styles.colTitle}>Institucional</h4>
          <a href="/#sobre" className={styles.link}>Sobre nós</a>
          <a href="https://wa.me/5555997181206" className={styles.link}>Contato</a>
        </div>

        {/* Navegação */}
        <div className={styles.links}>
          <h4 className={styles.colTitle}>Explorar</h4>
          <Link to="/" className={styles.link}>Início</Link>
          <Link to="/catalogo" className={styles.link}>Catálogo</Link>
          <Link to="/favoritos" className={styles.link}>Favoritos</Link>
          <Link to="/carrinho" className={styles.link}>Carrinho</Link>
        </div>

        {/* Conta */}
        <div className={styles.links}>
          <h4 className={styles.colTitle}>Minha Conta</h4>
          <Link to="/login" className={styles.link}>Entrar</Link>
          <Link to="/cadastro" className={styles.link}>Criar conta</Link>
          <Link to="/pedidos" className={styles.link}>Meus Pedidos</Link>
          {isAdmin && (
            <Link to="/adicionar-produto" className={styles.link}>📦 Adicionar Produto</Link>
          )}
        </div>
      </div>

      <div className={styles.bottom}>
        <p className={styles.copyright}>© {new Date().getFullYear()} Brechó Chic Kenara. Todos os direitos reservados.</p>
        <p className={styles.madeWith}>Moda sustentável com amor 🌿</p>
      </div>
    </footer>
  );
}

