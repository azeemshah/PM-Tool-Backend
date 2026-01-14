import { Role } from '../enums/role.enum';

// Define permissions for each role
const rolePermissions: Record<string, string[]> = {
  [Role.ADMIN]: [
    'manage_workspace',
    'manage_members',
    'manage_boards',
    'create_work_items',
    'edit_work_items',
    'delete_work_items',
    'manage_roles',
  ],
  [Role.MEMBER]: [
    'create_work_items',
    'edit_work_items',
    'edit_own_work_items',
    'view_workspace',
    'view_boards',
    'add_comments',
  ],
  [Role.VIEWER]: [
    'view_workspace',
    'view_boards',
    'view_work_items',
  ],
};

// Role IDs mapping
const roleIds: Record<string, string> = {
  [Role.ADMIN]: '1',
  [Role.MEMBER]: '2',
  [Role.VIEWER]: '3',
};

export function getPermissionsForRole(role: string): string[] {
  return rolePermissions[role] || [];
}

export function getRoleId(role: string): string {
  return roleIds[role] || role;
}
