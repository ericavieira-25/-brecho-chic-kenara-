import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/ui/Input/Input';
import Button from '../../components/ui/Button/Button';
import styles from './Register.module.css';

export default function Register() {
  const { register, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nome obrigatório';
    if (!form.email) errs.email = 'E-mail obrigatório';
    else if (!/\S+@\S+\.\S+/.test(form.email)) errs.email = 'E-mail inválido';
    if (!form.password) errs.password = 'Senha obrigatória';
    else if (form.password.length < 6) errs.password = 'Mínimo 6 caracteres';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'As senhas não coincidem';
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
    const ok = await register(form.name, form.email, form.password);
    setLoading(false);
    if (ok) navigate('/');
  }

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.header}>
          <Link to="/" className={styles.logo}>🌸 Brechó Chic Kenara</Link>
          <h1 className={styles.title}>Criar conta</h1>
          <p className={styles.subtitle}>Junte-se à nossa comunidade de moda consciente</p>
        </div>

        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <Input
            label="Nome completo"
            id="name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            error={fieldErrors.name}
            placeholder="Seu nome"
            autoComplete="name"
          />
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
            placeholder="Mínimo 6 caracteres"
            autoComplete="new-password"
          />
          <Input
            label="Confirmar senha"
            id="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            error={fieldErrors.confirmPassword}
            placeholder="Repita a senha"
            autoComplete="new-password"
          />
          {error && <p className={styles.globalError}>{error}</p>}
          <Button type="submit" variant="primary" size="lg" loading={loading} className={styles.submitBtn}>
            Criar conta
          </Button>
        </form>

        <p className={styles.footer}>
          Já tem conta? <Link to="/login" className={styles.link}>Entrar</Link>
        </p>
      </div>
    </div>
  );
}
