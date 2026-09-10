import { createContext, useContext, useState, useCallback, useEffect } from 'react';
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    fetch('/api/users', { credentials: 'include' }).then(async (res) => {
      const data = await res.json();
      if (active) setUser(res.ok ? data.user : null);
    }).catch(() => {}).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const authenticate = useCallback(async (body, admin = false) => {
    setError('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...body, email: String(body.email || '').trim().toLowerCase(), admin }),
      });
      const data = await response.json();
      if (!response.ok || !data.user) throw new Error(data.erro || 'Não foi possível entrar.');
      localStorage.removeItem('brecho_orders_real');
      localStorage.removeItem('brecho_last_order_created');
      setUser(data.user);
      return true;
    } catch (err) { setError(err.message || 'Serviço indisponível. Tente novamente.'); return false; }
  }, []);
  const login = useCallback((email, password) => authenticate({ action: 'login', email, password }), [authenticate]);
  const adminLogin = useCallback((email, password) => authenticate({ action: 'login', email, password }, true), [authenticate]);
  const register = useCallback((name, email, password) => authenticate({ action: 'register', name, email, password }), [authenticate]);
  const logout = useCallback(async () => {
    const response = await fetch('/api/users', { method: 'DELETE', credentials: 'include' });
    if (!response.ok) throw new Error('Não foi possível sair. Tente novamente.');
    localStorage.removeItem('brecho_user');
    localStorage.removeItem('brecho_orders_real');
    localStorage.removeItem('brecho_last_order_created');
    setUser(null);
  }, []);
  return <AuthContext.Provider value={{ user, loading, login, adminLogin, register, logout, error, setError, setUser }}>{loading ? <p role="status">Carregando sessão…</p> : children}</AuthContext.Provider>;
}
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
