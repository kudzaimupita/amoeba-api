export const WORKSPACE_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export const MEMBERSHIP_STATUSES = ['active', 'invited', 'suspended'] as const;
export type MembershipStatus = (typeof MEMBERSHIP_STATUSES)[number];

export const INVITATION_STATUSES = ['pending', 'accepted', 'revoked', 'expired'] as const;
export type InvitationStatus = (typeof INVITATION_STATUSES)[number];

const ROLE_RANK: Record<WorkspaceRole, number> = {
  owner: 4,
  admin: 3,
  member: 2,
  viewer: 1,
};

export const hasMinimumRole = (actual: WorkspaceRole, required: WorkspaceRole): boolean =>
  ROLE_RANK[actual] >= ROLE_RANK[required];

export const canManageMembers = (role: WorkspaceRole): boolean => hasMinimumRole(role, 'admin');
export const canManageWorkspace = (role: WorkspaceRole): boolean => hasMinimumRole(role, 'admin');
export const canDeleteWorkspace = (role: WorkspaceRole): boolean => role === 'owner';

export const roleCanPerform = (role: WorkspaceRole, operationType?: string): boolean => {
  if (!operationType) return true;
  if (role === 'owner' || role === 'admin') return true;
  if (role === 'viewer') return operationType === 'read' || operationType === 'readList';
  return operationType !== 'delete' && operationType !== 'admin';
};
