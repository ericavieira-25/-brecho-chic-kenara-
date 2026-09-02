/**
 * useGuard.js
 *
 * Hook para validação de acesso baseado em papéis e permissões.
 * Centraliza a lógica de autorização em um único lugar reutilizável.
 */

import { useAuth } from '../context/AuthContext';
import { canAccessRole, hasRole } from '../data/roles';
import { canAccess, requireRole } from '../data/permissions';

/**
 * Verifica se o usuário está autenticado.
 * @param {object} user - usuário da context
 * @returns {boolean} true se autenticado
 */
export function isAuthenticated(user) {
  return Boolean(user && user.id);
}

/**
 * Verifica se o usuário tem um papel específico.
 * @param {object} user - usuário da context
 * @param {string} role - papel esperado
 * @returns {boolean}
 */
export function checkUserRole(user, role) {
  return hasRole(user, role);
}

/**
 * Verifica se o usuário tem acesso a um ou mais papéis.
 * @param {object} user - usuário da context
 * @param {string|string[]} allowedRoles - papel(s) permitido(s)
 * @returns {boolean}
 */
export function checkRoleAccess(user, allowedRoles) {
  return canAccessRole(user, allowedRoles);
}

/**
 * Verifica se o usuário tem uma permissão específica.
 * @param {object} user - usuário da context
 * @param {string} permissionKey - chave da permissão
 * @returns {boolean}
 */
export function checkPermission(user, permissionKey) {
  return canAccess(user, permissionKey);
}

/**
 * Hook reutilizável para validação de acesso.
 * Encapsula a lógica de guard para uso em componentes e rotas.
 *
 * Retorna um objeto com as funções de validação e o usuário atual.
 *
 * @returns {object} { user, isAuth, hasRole: fn, hasAccess: fn, hasPermission: fn }
 *
 * @example
 * const guard = useGuard();
 * if (!guard.isAuth) return <Navigate to="/login" />;
 * if (!guard.hasRole('fornecedora')) return <Navigate to="/" />;
 * if (!guard.hasPermission('canViewOwnSales')) return <AccessDenied />;
 */
export function useGuard() {
  const { user } = useAuth();

  return {
    user,
    isAuth: isAuthenticated(user),
    hasRole: (role) => checkUserRole(user, role),
    hasAnyRole: (roles) => checkRoleAccess(user, roles),
    hasPermission: (permissionKey) => checkPermission(user, permissionKey),
  };
}

/**
 * Hook para verificar acesso a uma rota específica.
 * Mais específico que useGuard para casos de rota protegida.
 *
 * @param {string|string[]} allowedRoles - papel(s) permitido(s)
 * @param {object} options - configurações opcionais
 * @returns {object} { hasAccess, user, isLoading }
 *
 * @example
 * const { hasAccess } = useRouteGuard([USER_ROLES.ADMIN, USER_ROLES.SUPPLIER]);
 * if (!hasAccess) return <Navigate to="/403" />;
 */
export function useRouteGuard(allowedRoles, options = {}) {
  const { user } = useAuth();
  const { requireAuth = true } = options;

  const isAuthenticated_ = isAuthenticated(user);
  const hasAccess = requireAuth ? isAuthenticated_ && checkRoleAccess(user, allowedRoles) : true;

  return {
    hasAccess,
    user,
    isAuthenticated: isAuthenticated_,
    isLoading: false,
  };
}
