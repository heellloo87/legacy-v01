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
    canDeleteProjects: true,
    canViewAnalytics: true,
  },

  designer: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
    canDeleteProjects: false,
    canViewAnalytics: false,
  },

  collaborator: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
    canDeleteProjects: false,
    canViewAnalytics: false,
  },

  manufacturing_expert: {
    canAccessAdminPanel: false,
    canManageUsers: false,
    canAssignRoles: false,
    canDeleteProjects: false,
    canViewAnalytics: false,
  },
};
