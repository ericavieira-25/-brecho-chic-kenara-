/**
 * ProtectedRoute.jsx
 *
 * Componente reutilizável para proteção de rotas baseada em papéis de usuário.
 * Encapsula toda a lógica de autorização, redirecionamento e tratamento de acesso.
 *
 * Garante que:
 * - Rotas anônimas não são acessíveis
 * - Rotas protegidas validam o papel do usuário
 * - Redirecionamentos são consistentes e centralizados
 */

import { Navigate } from 'react-router-dom';
import { useGuard } from '../../../hooks/useGuard.js';

/**
 * Componente que protege uma rota verificando autenticação e papéis de usuário.
 *
 * @param {object} props
 * @param {ReactNode} props.children - Componente/página a renderizar
 * @param {string|string[]} props.allowedRoles - Papel(is) permitido(s) para acessar
 * @param {string} props.redirectTo - Caminho para redirecionamento (padrão: "/login")
 * @param {string} props.accessDeniedPath - Caminho se acesso negado (padrão: "/403")
 * @param {ReactNode} props.fallback - Componente a mostrar enquanto carrega (opcional)
 *
 * @returns {ReactNode}
 *
 * @example
 * // Proteger rota de admin
 * <ProtectedRoute allowedRoles={USER_ROLES.ADMIN}>
 *   <AdminDashboard />
 * </ProtectedRoute>
 *
 * @example
 * // Proteger rota com múltiplos papéis
 * <ProtectedRoute allowedRoles={[USER_ROLES.SUPPLIER, USER_ROLES.ADMIN]}>
 *   <SupplierPanel />
 * </ProtectedRoute>
 *
 * @example
 * // Proteger rota com redirecionamento customizado
 * <ProtectedRoute
 *   allowedRoles={USER_ROLES.CLIENT}
 *   redirectTo="/login"
 *   accessDeniedPath="/not-authorized"
 * >
 *   <CheckoutPage />
 * </ProtectedRoute>
 */
export function ProtectedRoute({
  children,
  allowedRoles,
  redirectTo = '/login',
  accessDeniedPath = '/403',
  fallback = null,
}) {
  const { isAuth, hasAnyRole } = useGuard();

  // Não autenticado: redirecionar para login
  if (!isAuth) {
    return <Navigate to={redirectTo} replace />;
  }

  // Autenticado mas sem permissão de papéis: redirecionar para acesso negado
  if (allowedRoles && !hasAnyRole(allowedRoles)) {
    return <Navigate to={accessDeniedPath} replace />;
  }

  // Tudo OK: renderizar componente
  return children || fallback;
}

/**
 * Componente de página 403 (Acesso Negado).
 * Pode ser renderizado em uma rota catch-all ou via ProtectedRoute.
 *
 * @returns {ReactNode}
 */
export function AccessDenied() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        textAlign: 'center',
        padding: '2rem',
      }}
    >
      <h1>403 — Acesso Negado</h1>
      <p>Você não tem permissão para acessar esta página.</p>
      <a href="/" style={{ marginTop: '1rem', textDecoration: 'underline', cursor: 'pointer' }}>
        Voltar para Home
      </a>
    </div>
  );
}

/**
 * HOC (Higher-Order Component) para proteção de componentes.
 * Útil quando a rota não é o melhor lugar para aplicar o guard.
 *
 * @param {ReactComponent} Component - Componente a proteger
 * @param {string|string[]} allowedRoles - Papel(is) permitido(s)
 * @param {object} options - Configurações adicionais
 *
 * @returns {ReactComponent}
 *
 * @example
 * const ProtectedAdmin = withGuard(AdminPanel, USER_ROLES.ADMIN);
 */
export function withGuard(Component, allowedRoles, options = {}) {
  const { fallback = <AccessDenied />, ...guardOptions } = options;

  return function GuardedComponent(props) {
    return (
      <ProtectedRoute allowedRoles={allowedRoles} fallback={fallback} {...guardOptions}>
        <Component {...props} />
      </ProtectedRoute>
    );
  };
}
