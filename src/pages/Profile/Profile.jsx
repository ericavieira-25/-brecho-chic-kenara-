import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) return <Navigate to="/login?redirect=/perfil" replace />;

  function handleLogout() {
    logout();
    navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Meu Perfil</h1>

        <div className={styles.card}>
          <div className={styles.avatar}>
            <img src={user.avatar || `https://picsum.photos/seed/${user.id}/200/200`} alt={user.name} />
          </div>
          <div className={styles.info}>
            <h2 className={styles.name}>{user.name}</h2>
            <p className={styles.email}>{user.email}</p>
            {user.createdAt && (
              <p className={styles.since}>Membro desde {formatDate(user.createdAt)}</p>
            )}
          </div>
        </div>

        <div className={styles.actions}>
          <Button variant="outline" onClick={() => navigate('/pedidos')}>📦 Meus Pedidos</Button>
          <Button variant="outline" onClick={() => navigate('/favoritos')}>♥ Meus Favoritos</Button>
          <Button variant="outline" onClick={() => navigate('/adicionar-produto')}>📸 Vender Peça</Button>
          <Button variant="ghost" onClick={handleLogout} className={styles.logoutBtn}>Sair da conta</Button>
        </div>
      </div>
    </div>
  );
}
