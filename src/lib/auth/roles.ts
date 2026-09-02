export const administratorRoles = ['reviewer', 'admin', 'super_admin'] as const;

export type AdministratorRole = (typeof administratorRoles)[number];

const roleRank: Record<AdministratorRole, number> = {
  reviewer: 1,
  admin: 2,
  super_admin: 3,
};

export function administratorHasRole(
  administratorRole: AdministratorRole,
  requiredRole: AdministratorRole,
) {
  return roleRank[administratorRole] >= roleRank[requiredRole];
}
