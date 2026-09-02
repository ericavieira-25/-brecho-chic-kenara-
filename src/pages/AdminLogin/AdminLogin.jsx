import { useState } from 'react';
import { Navigate, useNavigate, Link } from 'react-router-dom';

import { useAuth } from '../../context/AuthContext.jsx';
import { USER_ROLES } from '../../data/roles.js';

import styles from './AdminLogin.module.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { user, login, error, setError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  // Se já estiver logado como administradora,
  // vai direto para o painel.
  if (user?.role === USER_ROLES.ADMIN) {
    return <Navigate to="/admin" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();

    setError('');
    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Digite o e-mail da administradora.');
      setLoading(false);
      return;
    }

    if (!password) {
      setError('Digite sua senha.');
      setLoading(false);
      return;
    }

    const success = login(normalizedEmail, password);

    if (!success) {
      setLoading(false);
      return;
    }

    setLoading(false);
    navigate('/admin', { replace: true });
  };

  return (
    <div className={styles.page}>
      <div className={styles.background}>
        <div className={styles.loginCard}>

          <div className={styles.header}>
            <div className={styles.logo}>
              👑
            </div>

            <h1>Área Administrativa</h1>

            <p>
              Acesso exclusivo da administradora
              <br />
              <strong>Brechó Chic Kenara</strong>
            </p>
          </div>

          <form
            className={styles.form}
            onSubmit={handleSubmit}
          >

            <div className={styles.field}>
              <label htmlFor="admin-email">
                E-mail
              </label>

              <input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@brecho.com"
                autoComplete="username"
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label htmlFor="admin-password">
                Senha
              </label>

              <input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Digite sua senha"
                autoComplete="current-password"
                disabled={loading}
              />
            </div>

            {error && (
              <div
                className={styles.error}
                role="alert"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className={styles.loginButton}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className={styles.spinner} />
                  Entrando...
                </>
              ) : (
                <>
                  🔐 Entrar na administração
                </>
              )}
            </button>

          </form>

          <div className={styles.info}>
            <div className={styles.infoIcon}>
              🛡️
            </div>

            <div>
              <strong>Área protegida</strong>

              <p>
                Somente contas com permissão de
                administradora podem acessar este painel.
              </p>
            </div>
          </div>

          <div className={styles.footer}>
            <Link to="/">
              ← Voltar para a loja
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
}