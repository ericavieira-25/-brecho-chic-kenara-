import { Navigate, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { formatDate } from '../../utils/formatters';
import Button from '../../components/ui/Button/Button';
import styles from './Profile.module.css';

export default function Profile() {
  const { user, logout, setError } = useAuth();
  const navigate = useNavigate();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: user?.address || '',
  });
  const [localUser, setLocalUser] = useState(user);
  const [feedbackMsg, setFeedbackMsg] = useState('');

  if (!localUser) return <Navigate to="/login?redirect=/perfil" replace />;

  function handleLogout() {
    logout();
    navigate('/');
  }

  function startEdit() {
    setForm({
      name: localUser.name || '',
      phone: localUser.phone || '',
      address: localUser.address || '',
    });
    setFeedbackMsg('');
    setEditing(true);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    setFeedbackMsg('');
    try {
      const res = await fetch('/api/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          address: form.address.trim(),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.user) {
        setLocalUser(data.user);
        setEditing(false);
        setFeedbackMsg('Perfil atualizado com sucesso!');
      } else {
        setFeedbackMsg(data.erro || 'Não foi possível salvar.');
      }
    } catch {
      setFeedbackMsg('Erro de conexão. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className={styles.page}>
      <div className={styles.inner}>
        <h1 className={styles.title}>Meu Perfil</h1>

        <div className={styles.card}>
          <div className={styles.avatar}>
            <img
              src={localUser.avatar || `https://picsum.photos/seed/${localUser.id}/200/200`}
              alt={localUser.name}
            />
          </div>
          <div className={styles.info}>
            <h2 className={styles.name}>{localUser.name}</h2>
            <p className={styles.email}>{localUser.email}</p>
            {localUser.phone && <p className={styles.detail}>📞 {localUser.phone}</p>}
            {localUser.address && <p className={styles.detail}>📍 {localUser.address}</p>}
            {localUser.createdAt && (
              <p className={styles.since}>Membro desde {formatDate(localUser.createdAt)}</p>
            )}
          </div>
        </div>

        {feedbackMsg && (
          <p className={styles.feedback}>{feedbackMsg}</p>
        )}

        {editing ? (
          <form className={styles.editForm} onSubmit={handleSave}>
            <label>
              Nome
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                required
              />
            </label>
            <label>
              Telefone
              <input
                type="tel"
                value={form.phone}
                placeholder="(11) 99999-0000"
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </label>
            <label>
              Endereço
              <input
                type="text"
                value={form.address}
                placeholder="Rua, número – Cidade, UF"
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </label>
            <div className={styles.editActions}>
              <Button type="button" variant="outline" onClick={() => setEditing(false)} disabled={saving}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? 'Salvando…' : 'Salvar'}
              </Button>
            </div>
          </form>
        ) : (
          <div className={styles.actions}>
            <Button variant="outline" onClick={startEdit}>✏️ Editar perfil</Button>
            <Button variant="outline" onClick={() => navigate('/pedidos')}>📦 Meus Pedidos</Button>
            <Button variant="outline" onClick={() => navigate('/favoritos')}>♥ Meus Favoritos</Button>
            {localUser.role === 'administradora' && (
              <Button variant="outline" onClick={() => navigate('/admin')}>🔧 Painel Admin</Button>
            )}
            {localUser.role === 'fornecedora' && (
              <Button variant="outline" onClick={() => navigate('/fornecedor')}>📊 Painel Fornecedora</Button>
            )}
            <Button variant="ghost" onClick={handleLogout} className={styles.logoutBtn}>
              Sair da conta
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
