export const USER_ROLES = Object.freeze({
  CLIENT: 'cliente',
  SUPPLIER: 'fornecedora',
  ADMIN: 'administradora',
});

export const USER_ROLE_OPTIONS = Object.freeze([
  USER_ROLES.CLIENT,
  USER_ROLES.SUPPLIER,
  USER_ROLES.ADMIN,
]);

export function isValidUserRole(role) {
  return USER_ROLE_OPTIONS.includes(role);
}

export function hasRole(user, role) {
  return user?.role === role;
}

export function canAccessRole(user, allowedRoles = []) {
  if (!user) return false;
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
  return roles.includes(user.role);
}
