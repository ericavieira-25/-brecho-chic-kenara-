import { useState, useEffect, useRef } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useCart } from '../../../context/CartContext';
import { useFavorites } from '../../../context/FavoritesContext';
import { useGuard } from '../../../hooks/useGuard';
import { USER_ROLES } from '../../../data/roles';
import SearchBar from '../../features/SearchBar/SearchBar';
import CartDrawer from '../../features/CartDrawer/CartDrawer';
import styles from './Header.module.css';

// Inline SVG icons — no external dependency
function IconSearch() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="11" cy="11" r="7" />
      <line x1="16.5" y1="16.5" x2="22" y2="22" />
    </svg>
  );
}

function IconHeart({ filled }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{ fill: filled ? 'currentColor' : 'none' }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function IconShoppingBag() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

function IconUser() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

export default function Header() {
  const { user, logout } = useAuth();
  const { totalItems } = useCart();
  const { favorites } = useFavorites();
  const { hasRole } = useGuard();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const isAdmin = hasRole(USER_ROLES.ADMIN);

  useEffect(() => {
    function handleClickOutside(e) {
      if (
        profileRef.current &&
        !profileRef.current.contains(e.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  function handleNav() {
    setMobileOpen(false);
  }

  function handleLogout() {
    const wasAdmin = user?.role === 'administradora';

    logout();
    setProfileOpen(false);

    if (wasAdmin) {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/', { replace: true });
    }
  }

  return (
    <>
      <header className={styles.header}>
        <div className={styles.inner}>

          {/* Logo */}
          <Link to="/" className={styles.logo}>
            {/* Cabide SVG — identidade visual da marca */}
            <svg className={styles.logoIcon} viewBox="0 0 40 36" fill="none" aria-hidden="true">
              {/* Coroa */}
              <path d="M20 2 L22.5 6 L26 4 L24.5 8 L15.5 8 L14 4 L17.5 6 Z" fill="currentColor"/>
              {/* Cabide */}
              <path d="M20 8 C20 8 20 11 20 12 C18 12 12 15 10 19 C9 21 10 22 12 22 L28 22 C30 22 31 21 30 19 C28 15 22 12 20 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
              <circle cx="20" cy="11.5" r="1.5" fill="currentColor"/>
              {/* Coração pequeno */}
              <path d="M20 28 C20 28 16 25 16 23 C16 21.5 17.5 21 18.5 22 L20 24 L21.5 22 C22.5 21 24 21.5 24 23 C24 25 20 28 20 28Z" fill="currentColor" opacity="0.7"/>
            </svg>

            <span className={styles.logoText}>
              <span className={styles.logoMain}>Chic</span>
              <span className={styles.logoSub}>Kenara</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className={styles.nav}>
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                isActive
                  ? styles.navLinkActive
                  : styles.navLink
              }
            >
              Início
            </NavLink>

            <NavLink
              to="/catalogo"
              className={({ isActive }) =>
                isActive
                  ? styles.navLinkActive
                  : styles.navLink
              }
            >
              Catálogo
            </NavLink>

            <NavLink
              to="/favoritos"
              className={({ isActive }) =>
                isActive
                  ? styles.navLinkActive
                  : styles.navLink
              }
            >
              Favoritos
            </NavLink>
          </nav>

          {/* Actions */}
          <div className={styles.actions}>

            {/* Buscar */}
            <button
              className={styles.iconBtn}
              onClick={() => setSearchOpen(true)}
              aria-label="Buscar"
            >
              <IconSearch />
            </button>

            {/* Favoritos */}
            <Link
              to="/favoritos"
              className={styles.iconBtnLink}
              aria-label={`Favoritos${
                favorites.length > 0
                  ? ` (${favorites.length})`
                  : ''
              }`}
            >
              <IconHeart filled={favorites.length > 0} />

              {favorites.length > 0 && (
                <span className={styles.badge}>
                  {favorites.length}
                </span>
              )}
            </Link>

            {/* Carrinho */}
            <button
              className={styles.iconBtn}
              onClick={() => setCartOpen(true)}
              aria-label={`Carrinho${
                totalItems > 0
                  ? ` (${totalItems})`
                  : ''
              }`}
            >
              <IconShoppingBag />

              {totalItems > 0 && (
                <span className={styles.badge}>
                  {totalItems}
                </span>
              )}
            </button>

            {/* Perfil */}
            <div
              className={styles.profileWrapper}
              ref={profileRef}
            >
              <button
                className={styles.iconBtn}
                onClick={() => setProfileOpen(!profileOpen)}
                aria-label="Perfil"
              >
                <IconUser />
              </button>

              {profileOpen && (
                <div className={styles.profileDropdown}>

                  {user ? (
                    <>
                      <p className={styles.profileName}>
                        {user.name}
                      </p>

                      <Link
                        to="/perfil"
                        className={styles.dropdownItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        Meu Perfil
                      </Link>

                      <Link
                        to="/pedidos"
                        className={styles.dropdownItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        Meus Pedidos
                      </Link>

                      {/* SOMENTE ADMIN */}
                      {/* ÁREA ADMINISTRATIVA */}
{isAdmin && (
  <>
    <Link
      to="/admin"
      className={styles.dropdownItem}
      onClick={() => setProfileOpen(false)}
    >
      ⚙️ Painel Administrativo
    </Link>

    <Link
      to="/admin/produtos/novo"
      className={styles.dropdownItem}
      onClick={() => setProfileOpen(false)}
    >
      👗 Cadastrar Peça
    </Link>
  </>
)}

                      <button
                        className={styles.dropdownLogout}
                        onClick={handleLogout}
                      >
                        Sair da conta
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/login"
                        className={styles.dropdownItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        Entrar
                      </Link>

                      <Link
                        to="/cadastro"
                        className={styles.dropdownItem}
                        onClick={() => setProfileOpen(false)}
                      >
                        Criar conta
                      </Link>
                    </>
                  )}

                </div>
              )}
            </div>

            {/* Hamburger */}
            <button
              className={styles.hamburger}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Menu"
              aria-expanded={mobileOpen}
            >
              <span
                className={[
                  styles.line,
                  mobileOpen ? styles.lineOpen1 : '',
                ].join(' ')}
              />

              <span
                className={[
                  styles.line,
                  mobileOpen ? styles.lineOpen2 : '',
                ].join(' ')}
              />

              <span
                className={[
                  styles.line,
                  mobileOpen ? styles.lineOpen3 : '',
                ].join(' ')}
              />
            </button>

          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <nav className={styles.mobileNav}>

            <NavLink
              to="/"
              end
              className={styles.mobileNavLink}
              onClick={handleNav}
            >
              Início
            </NavLink>

            <NavLink
              to="/catalogo"
              className={styles.mobileNavLink}
              onClick={handleNav}
            >
              Catálogo
            </NavLink>

            <NavLink
              to="/favoritos"
              className={styles.mobileNavLink}
              onClick={handleNav}
            >
              Favoritos
            </NavLink>

            {user ? (
              <>
                <NavLink
                  to="/perfil"
                  className={styles.mobileNavLink}
                  onClick={handleNav}
                >
                  Meu Perfil
                </NavLink>

                <NavLink
                  to="/pedidos"
                  className={styles.mobileNavLink}
                  onClick={handleNav}
                >
                  Meus Pedidos
                </NavLink>

                {/* SOMENTE ADMIN */}
               {/* ÁREA ADMINISTRATIVA */}
{isAdmin && (
  <>
    <NavLink
      to="/admin"
      className={styles.mobileNavLink}
      onClick={handleNav}
    >
      ⚙️ Painel Administrativo
    </NavLink>

    <NavLink
      to="/admin/produtos/novo"
      className={styles.mobileNavLink}
      onClick={handleNav}
    >
      👗 Cadastrar Peça
    </NavLink>
  </>
)}  <button
                  className={styles.mobileNavLogout}
                  onClick={() => {
                    handleLogout();
                    handleNav();
                  }}
                >
                  Sair da conta
                </button>
              </>
            ) : (
              <>
                <NavLink
                  to="/login"
                  className={styles.mobileNavLink}
                  onClick={handleNav}
                >
                  Entrar
                </NavLink>

                <NavLink
                  to="/cadastro"
                  className={styles.mobileNavLink}
                  onClick={handleNav}
                >
                  Criar conta
                </NavLink>
              </>
            )}

          </nav>
        )}
      </header>

      {searchOpen && (
        <SearchBar
          onClose={() => setSearchOpen(false)}
        />
      )}

      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}