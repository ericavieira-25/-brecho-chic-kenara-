import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { demoUsers } from '../data/mockUser';
import { USER_ROLES } from '../data/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('brecho_user', null);
  const [error, setError] = useState('');

  const login = useCallback(async (email, password) => {
    setError('');

    const normalizedEmail = String(email ?? '').trim().toLowerCase();

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email: normalizedEmail, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        setUser(data.user);
        return true;
      }
      if (![404, 405, 500, 502, 503].includes(response.status)) {
        setError(data.erro || 'E-mail ou senha inválidos.');
        return false;
      }
    } catch {
      // The demo accounts remain available when the API is not deployed.
    }

    const matchedUser = demoUsers.find(
      (candidate) =>
        candidate.email.toLowerCase() === normalizedEmail &&
        String(candidate.password) === String(password ?? '')
    );
    if (!matchedUser) {
      setError('E-mail ou senha inválidos.');
      return false;
    }

    const { password: _pw, ...safeUser } = matchedUser;
    setUser(safeUser);
    return true;
  }, [setUser]);

  const register = useCallback(async (name, email, password) => {
    setError('');
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'register', name, email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        setUser(data.user);
        return true;
      }
      if (![404, 405, 500, 502, 503].includes(response.status)) {
        setError(data.erro || 'Não foi possível criar a conta.');
        return false;
      }
    } catch {
      // Fall back to the original local demo behavior without an API.
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name: String(name).trim(),
      email: String(email).trim().toLowerCase(),
      role: USER_ROLES.CLIENT,
      avatar: `https://picsum.photos/seed/user-${Date.now()}/200/200`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    return true;
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
    fetch('/api/users', { method: 'DELETE', credentials: 'include' }).catch(() => {});
    fetch('/api/auth', { method: 'DELETE', credentials: 'include' });
  }, [setUser]);

  const adminLogin = useCallback(async (email, password) => {
    setError('');
    let apiUnavailable = false;

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'login', email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.user) {
        if (data.user.role !== USER_ROLES.ADMIN) {
          setError('Acesso restrito à administradora.');
          return false;
        }
        setUser(data.user);
        return true;
      }
      apiUnavailable = [404, 405, 500, 502, 503].includes(response.status);
      if (!apiUnavailable) {
        setError(data.erro || 'E-mail ou senha inválidos.');
        return false;
      }
    } catch {
      apiUnavailable = true;
    }

    // Keep the existing admin-only endpoint as a compatibility fallback.
    if (apiUnavailable) try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const demoAdmin = demoUsers.find(
          (candidate) =>
            candidate.email === email &&
            candidate.role === USER_ROLES.ADMIN &&
            String(candidate.password) === String(password)
        );
        if (demoAdmin && [404, 405, 500, 502, 503].includes(response.status)) {
          const { password: _password, ...safeUser } = demoAdmin;
          setUser(safeUser);
          return true;
        }
        setError(data.erro || 'Não foi possível entrar.');
        return false;
      }
      const matchedUser = demoUsers.find((candidate) => candidate.email === email);
      if (matchedUser) {
        const { password: _password, ...safeUser } = matchedUser;
        setUser(safeUser);
      }
      return true;
    } catch {
      const demoAdmin = demoUsers.find(
        (candidate) =>
          candidate.email === email &&
          candidate.role === USER_ROLES.ADMIN &&
          String(candidate.password) === String(password)
      );
      if (demoAdmin) {
        const { password: _password, ...safeUser } = demoAdmin;
        setUser(safeUser);
        return true;
      }
      setError('Não foi possível entrar.');
      return false;
    }
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, logout, register, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
