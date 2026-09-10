import { useState, useCallback, useRef } from 'react';
export function useLocalStorage(key, initialValue) {
  const [storedValue, setStoredValue] = useState(() => {
    try { const item = window.localStorage.getItem(key); return item ? JSON.parse(item) : initialValue; }
    catch { return initialValue; }
  });
  const current = useRef(storedValue);
  const setValue = useCallback((value) => {
    const next = typeof value === 'function' ? value(current.current) : value;
    current.current = next;
    setStoredValue(next);
    try { window.localStorage.setItem(key, JSON.stringify(next)); }
    catch (error) { console.error('Não foi possível atualizar o cache local:', error); }
  }, [key]);
  return [storedValue, setValue];
}
