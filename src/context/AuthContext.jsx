import { createContext, useContext, useState, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { demoUsers } from '../data/mockUser';
import { USER_ROLES } from '../data/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useLocalStorage('brecho_user', null);
  const [error, setError] = useState('');

  const login = useCallback((email, password) => {
    setError('');

    const normalizedEmail = String(email ?? '').trim().toLowerCase();
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

  const register = useCallback((name, email, password) => {
    setError('');
    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      role: USER_ROLES.CLIENT,
      avatar: `https://picsum.photos/seed/user-${Date.now()}/200/200`,
      createdAt: new Date().toISOString().split('T')[0],
    };
    setUser(newUser);
    return true;
  }, [setUser]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  return (
    <AuthContext.Provider value={{ user, login, logout, register, error, setError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
