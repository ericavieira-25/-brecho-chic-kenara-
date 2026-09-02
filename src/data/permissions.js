import { USER_ROLES } from './roles.js';

export const ROLE_PERMISSIONS = Object.freeze({
  [USER_ROLES.CLIENT]: Object.freeze({
    canAccessOwnProfile: true,
    canBuy: true,
    canViewCatalog: true,
    canManageFavorites: true,
    canViewOwnOrders: true,
  }),
  [USER_ROLES.SUPPLIER]: Object.freeze({
    canAccessOwnProfile: true,
    canManageOwnProducts: true,
    canViewOwnSales: true,
    canViewOwnFinancialSummary: true,
    canViewCatalog: true,
    canViewSupplierOnlyData: true,
  }),
  [USER_ROLES.ADMIN]: Object.freeze({
    canAccessAdminDashboard: true,
    canViewAllSuppliers: true,
    canViewAllSales: true,
    canViewAllProducts: true,
    canViewFinancialReports: true,
  }),
});

export function getUserPermissions(user) {
  if (!user || !user.role) return {};
  return ROLE_PERMISSIONS[user.role] || {};
}

export function canAccess(user, permissionKey) {
  const permissions = getUserPermissions(user);
  return Boolean(permissions[permissionKey]);
}

export function requireRole(user, allowedRoles = []) {
  if (!user) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
}
