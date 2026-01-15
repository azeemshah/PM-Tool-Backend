import { Role } from '../enums/role.enum';

// Define permissions for each role
const rolePermissions: Record<string, string[]> = {
  [Role.ADMIN]: [
    'MANAGE_WORKSPACE_SETTINGS',
    'CHANGE_MEMBER_ROLE',
    'REMOVE_MEMBER',
    'CREATE_PROJECT',
    'EDIT_PROJECT',
    'DELETE_PROJECT',
    'CREATE_TASK',
    'EDIT_TASK',
    'DELETE_TASK',
  ],
  [Role.MEMBER]: ['CREATE_TASK', 'EDIT_TASK', 'CREATE_PROJECT', 'EDIT_PROJECT', 'VIEW_ONLY'],
  [Role.VIEWER]: ['VIEW_ONLY'],
  Owner: [
    'EDIT_WORKSPACE',
    'DELETE_WORKSPACE',
    'MANAGE_WORKSPACE_SETTINGS',
    'ADD_MEMBER',
    'CHANGE_MEMBER_ROLE',
    'REMOVE_MEMBER',
    'CREATE_PROJECT',
    'EDIT_PROJECT',
    'DELETE_PROJECT',
    'CREATE_TASK',
    'EDIT_TASK',
    'DELETE_TASK',
  ],
};

// Role IDs mapping
const roleIds: Record<string, string> = {
  [Role.ADMIN]: '1',
  [Role.MEMBER]: '2',
  [Role.VIEWER]: '3',
  Owner: '0',
};

export function getPermissionsForRole(role: string): string[] {
  return rolePermissions[role] || [];
}

export function getRoleId(role: string): string {
  return roleIds[role] || role;
}
