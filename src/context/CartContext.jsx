import { createContext, useContext, useCallback, useEffect } from 'react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { isProductAvailable } from '../data/productAvailabilityService.js';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useLocalStorage('brecho_cart', []);

  const addItem = useCallback((product, quantity = 1) => {
    if (!product || product.available === false || !isProductAvailable(product.id)) {
      return;
    }

    setItems((prev) => {
      const existing = prev.find((i) => i.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { ...product, quantity }];
    });
  }, [setItems]);

  const removeItem = useCallback((productId) => {
    setItems((prev) => prev.filter((i) => i.id !== productId));
  }, [setItems]);

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.id === productId ? { ...i, quantity } : i))
    );
  }, [setItems]);

  const clearCart = useCallback(() => {
    setItems([]);
  }, [setItems]);

  const validItems = items.filter((item) => isProductAvailable(item.id));
  const unavailableItems = items.filter((item) => !isProductAvailable(item.id));

  useEffect(() => {
    if (unavailableItems.length > 0) {
      setItems(validItems);
    }
  }, [unavailableItems.length, validItems, setItems]);

  const totalItems = validItems.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = validItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const shipping = subtotal >= 150 ? 0 : 15.9;
  const total = subtotal + shipping;

  return (
    <CartContext.Provider
      value={{ items: validItems, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal, shipping, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
