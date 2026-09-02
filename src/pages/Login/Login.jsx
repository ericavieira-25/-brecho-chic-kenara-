import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './Login.module.css';

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.email) errs.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'E-mail inválido';
    if (!form.password) errs.password = 'Senha obrigatória';
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const errs = validate();
    if (Object.keys(errs).length) { setFieldErrors(errs); return; }
    setFieldErrors({});
    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    const ok = login(form.email, form.password);
    setLoading(false);
    if (ok) navigate(redirect);
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>🌸 Brechó Chic Kenara</Link>
          <h1 className={styles.title}>Bem-vinda de volta!</h1>
          <p className={styles.subtitle}>Entre na sua conta para continuar</p>
        </div>

        <div className={styles.demoHint}>
          <strong>Conta demo:</strong> demo@brecho.com / 123456
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="E-mail"
            id="email"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            error={fieldErrors.email}
            placeholder="seu@email.com"
            autoComplete="email"
          />
          <Input
            label="Senha"
            id="password"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            error={fieldErrors.password}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          {error && <p className={styles.globalError}>{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
            Entrar
          </Button>
        </form>

        <p className={styles.footer}>
          Não tem conta? <Link to="/cadastro" className={styles.link}>Cadastre-se</Link>
        </p>
      </div>
    </div>
  );
}
