import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { FavoritesProvider } from './context/FavoritesContext';
import AppRoutes from './routes';

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <FavoritesProvider>
          <AppRoutes />
        </FavoritesProvider>
      </CartProvider>
    </AuthProvider>
  );
}
