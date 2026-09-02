import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import styles from './AdminSidebar.module.css';

const menuItems = [
  {
    label: 'Dashboard',
    icon: '📊',
    to: '/admin',
    end: true,
  },
  {
  label: 'Produtos',
  icon: '👗',
  to: '/admin/produtos',
},
  {
    label: 'Financeiro',
    icon: '💰',
    to: '/admin/tabela-financeira',
  },
  {
    label: 'Fornecedoras',
    icon: '👥',
    to: '/admin/fornecedoras',
  },
  {
    label: 'Repasses',
    icon: '💸',
    to: '/admin/repasses',
  },
  
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

function handleLogout() {
  logout();
  navigate('/admin/login', { replace: true });
}

  return (
    <aside className={styles.sidebar}>
      <div className={styles.brand}>
        <div className={styles.logo}>👑</div>

        <div>
          <strong>Brechó Chic</strong>
          <span>Kenara</span>
        </div>
      </div>

      <div className={styles.adminInfo}>
        <div className={styles.avatar}>
          {user?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>

        <div>
          <strong>{user?.name || 'Administradora'}</strong>
          <span>Administradora</span>
        </div>
      </div>

      <nav className={styles.nav} aria-label="Menu administrativo">
        <span className={styles.sectionTitle}>ADMINISTRAÇÃO</span>

        {menuItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `${styles.link} ${isActive ? styles.active : ''}`
            }
          >
            <span className={styles.icon}>{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className={styles.bottom}>
        <NavLink to="/" className={styles.storeLink}>
          🛍️ Voltar para a loja
        </NavLink>

        <button
          type="button"
          className={styles.logout}
          onClick={handleLogout}
        >
          🚪 Sair da conta
        </button>
      </div>
    </aside>
  );
}