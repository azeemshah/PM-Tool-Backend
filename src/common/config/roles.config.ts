import { Role } from '../enums/role.enum';

// Define permissions for each role
const rolePermissions: Record<string, string[]> = {
  [Role.ADMIN]: [
    'VIEW_ONLY',
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
  [Role.TEAM_LEAD]: ['CREATE_TASK', 'EDIT_TASK', 'CREATE_PROJECT', 'EDIT_PROJECT', 'VIEW_ONLY'],
  [Role.PROJECT_MANAGER]: [
    'CREATE_TASK',
    'EDIT_TASK',
    'CREATE_PROJECT',
    'EDIT_PROJECT',
    'VIEW_ONLY',
  ],
  [Role.MEMBER]: ['CREATE_TASK', 'EDIT_TASK', 'VIEW_ONLY'],
  [Role.VIEWER]: ['VIEW_ONLY'],
  [Role.WATCHER]: ['VIEW_ONLY'],
  Owner: [
    'VIEW_ONLY',
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
  [Role.TEAM_LEAD]: '1.1',
  [Role.PROJECT_MANAGER]: '1.2',
  [Role.MEMBER]: '2',
  [Role.VIEWER]: '3',
  [Role.WATCHER]: '4',
  Owner: '0',
};

function normalizeRole(role: string): string {
  const r = (role || '').trim().toUpperCase();
  if (r === 'ADMIN') return Role.ADMIN;
  if (r === 'TEAM LEAD') return Role.TEAM_LEAD;
  if (r === 'TEAM_LEAD') return Role.TEAM_LEAD;
  if (r === 'PROJECT MANAGER') return Role.PROJECT_MANAGER;
  if (r === 'PROJECT_MANAGER') return Role.PROJECT_MANAGER;
  if (r === 'MEMBER') return Role.MEMBER;
  if (r === 'VIEWER') return Role.VIEWER;
  if (r === 'WATCHER') return Role.WATCHER;
  if (r === 'OWNER') return 'Owner';
  return role;
}

export function getPermissionsForRole(role: string): string[] {
  const key = normalizeRole(role);
  return rolePermissions[key] || [];
}

export function getRoleId(role: string): string {
  const key = normalizeRole(role);
  return roleIds[key] || role;
}
