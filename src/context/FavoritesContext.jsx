import { createContext, useContext, useCallback } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';

const FavoritesContext = createContext(null);

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useLocalStorage('brecho_favorites', []);

  const addFavorite = useCallback((product) => {
    setFavorites((prev) => {
      if (prev.find((p) => p.id === product.id)) return prev;
      return [...prev, product];
    });
  }, [setFavorites]);

  const removeFavorite = useCallback((productId) => {
    setFavorites((prev) => prev.filter((p) => p.id !== productId));
  }, [setFavorites]);

  const toggleFavorite = useCallback((product) => {
    setFavorites((prev) => {
      if (prev.find((p) => p.id === product.id)) {
        return prev.filter((p) => p.id !== product.id);
      }
      return [...prev, product];
    });
  }, [setFavorites]);

  const isFavorite = useCallback((productId) => {
    return favorites.some((p) => p.id === productId);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used inside FavoritesProvider');
  return ctx;
}
