/**
 * Role-to-Permissions Mapping
 * Defines what permissions each role has in a workspace
 */

export const ROLE_PERMISSIONS: Record<string, string[]> = {
  Owner: [
    'CREATE_WORKSPACE',
    'DELETE_WORKSPACE',
    'EDIT_WORKSPACE',
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
  Admin: [
    'EDIT_WORKSPACE',
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
  Member: ['CREATE_PROJECT', 'EDIT_PROJECT', 'CREATE_TASK', 'EDIT_TASK'],
  Viewer: ['VIEW_ONLY'],
};

// Role IDs for frontend reference
export const ROLE_IDS: Record<string, string> = {
  Owner: 'owner',
  Admin: 'admin',
  Member: 'member',
  Viewer: 'viewer',
};

/**
 * Get permissions for a given role
 */
export const getPermissionsForRole = (role: string): string[] => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Get role ID for a given role name
 */
export const getRoleId = (role: string): string => {
  return ROLE_IDS[role] || role.toLowerCase();
};
