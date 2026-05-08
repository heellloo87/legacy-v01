export type UserRole =
  | "admin"
  | "designer"
  | "collaborator"
  | "manufacturing_expert";

export const rolePermissions = {
  admin: {
    canAccessAdminPanel: true,
    canManageUsers: true,
    canAssignRoles: true,
  },

  designer: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
  },

  collaborator: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
  },

  manufacturing_expert: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
  },
};
