import crypto from 'crypto';
import httpStatus from 'http-status';
import mongoose, { Types } from 'mongoose';

import ApiError from '../../utils/errors/ApiError';
import { companyService } from '../company';
import { userService } from '../user';
import User from '../user/user.model';
import Company from '../company/company.model';
import { PlanType } from '../../config/billingPlans';
import WorkspaceMembership from './workspaceMembership.model';
import WorkspaceInvitation from './workspaceInvitation.model';
import {
  canDeleteWorkspace,
  canManageMembers,
  canManageWorkspace,
  MembershipStatus,
  WorkspaceRole,
} from './workspace.constants';
import { IWorkspaceMembershipDoc, WorkspaceSummary } from './workspace.interfaces';

const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

const generateInviteToken = () => crypto.randomBytes(32).toString('hex');

const toObjectId = (value: Types.ObjectId | string) =>
  typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;

export const ensureLegacyMembership = async (userId: Types.ObjectId | string): Promise<IWorkspaceMembershipDoc | null> => {
  const user = await User.findById(userId);
  if (!user?.company) return null;

  const workspaceId = toObjectId(user.company);
  let membership = await WorkspaceMembership.findOne({ user: user._id, workspace: workspaceId });
  if (membership) return membership;

  membership = await WorkspaceMembership.create({
    user: user._id,
    workspace: workspaceId,
    role: user.isSystemUser ? 'owner' : 'member',
    status: 'active',
    joinedAt: new Date(),
  });

  if (!user.lastActiveWorkspace) {
    user.lastActiveWorkspace = workspaceId;
    await user.save();
  }

  return membership;
};

export const backfillMembershipsForAllUsers = async (): Promise<number> => {
  const users = await User.find({ company: { $exists: true, $ne: null } }).select('_id company isSystemUser createdAt lastActiveWorkspace');
  let created = 0;

  for (const user of users) {
    const exists = await WorkspaceMembership.exists({ user: user._id, workspace: user.company });
    if (exists) continue;

    await WorkspaceMembership.create({
      user: user._id,
      workspace: user.company,
      role: user.isSystemUser ? 'owner' : 'member',
      status: 'active',
      joinedAt: new Date(),
    });
    created += 1;

    if (!user.lastActiveWorkspace) {
      user.lastActiveWorkspace = user.company;
      await user.save();
    }
  }

  return created;
};

export const createOwnerMembership = async (
  userId: Types.ObjectId | string,
  workspaceId: Types.ObjectId | string,
  invitedBy?: Types.ObjectId | string
) => {
  const membership = await WorkspaceMembership.findOneAndUpdate(
    { user: toObjectId(userId), workspace: toObjectId(workspaceId) },
    {
      user: toObjectId(userId),
      workspace: toObjectId(workspaceId),
      role: 'owner',
      status: 'active',
      invitedBy: invitedBy ? toObjectId(invitedBy) : undefined,
      joinedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.updateOne({ _id: toObjectId(userId) }, { lastActiveWorkspace: toObjectId(workspaceId), company: toObjectId(workspaceId) });

  return membership;
};

export const createMembership = async (params: {
  userId: Types.ObjectId | string;
  workspaceId: Types.ObjectId | string;
  role: WorkspaceRole;
  status?: MembershipStatus;
  invitedBy?: Types.ObjectId | string;
}) => {
  const membership = await WorkspaceMembership.create({
    user: toObjectId(params.userId),
    workspace: toObjectId(params.workspaceId),
    role: params.role,
    status: params.status ?? 'active',
    invitedBy: params.invitedBy ? toObjectId(params.invitedBy) : undefined,
    joinedAt: new Date(),
  });

  return membership;
};

export const listUserWorkspaces = async (userId: Types.ObjectId | string, activeWorkspaceId?: string): Promise<WorkspaceSummary[]> => {
  await ensureLegacyMembership(userId);

  const memberships = await WorkspaceMembership.find({ user: toObjectId(userId), status: { $in: ['active', 'invited'] } })
    .populate('workspace')
    .sort({ joinedAt: -1 });

  return memberships
    .filter((membership) => membership.workspace)
    .map((membership) => {
      const workspace: any = membership.workspace;
      const id = workspace._id?.toString() ?? workspace.id?.toString();
      return {
        id,
        name: workspace.name,
        role: membership.role,
        status: membership.status,
        isActive: activeWorkspaceId ? id === activeWorkspaceId : false,
      };
    });
};

export const getMembership = async (userId: Types.ObjectId | string, workspaceId: Types.ObjectId | string) => {
  await ensureLegacyMembership(userId);
  return WorkspaceMembership.findOne({ user: toObjectId(userId), workspace: toObjectId(workspaceId), status: { $ne: 'suspended' } });
};

export const requireMembership = async (userId: Types.ObjectId | string, workspaceId: Types.ObjectId | string) => {
  const membership = await getMembership(userId, workspaceId);
  if (!membership || membership.status !== 'active') {
    throw new ApiError(httpStatus.FORBIDDEN, 'You do not have access to this workspace', true, '', 'WORKSPACE_FORBIDDEN');
  }
  return membership;
};

export const resolveActiveWorkspaceId = async (
  userId: Types.ObjectId | string,
  candidates: {
    jwtWorkspaceId?: string;
    headerWorkspaceId?: string;
    refreshTokenWorkspaceId?: string;
    legacyCompanyId?: string;
  }
): Promise<string> => {
  await ensureLegacyMembership(userId);

  const user = await User.findById(userId).select('lastActiveWorkspace company');
  const ordered = [
    candidates.jwtWorkspaceId,
    candidates.headerWorkspaceId,
    candidates.refreshTokenWorkspaceId,
    user?.lastActiveWorkspace?.toString(),
    user?.company?.toString(),
    candidates.legacyCompanyId,
  ].filter(Boolean) as string[];

  for (const workspaceId of ordered) {
    const membership = await getMembership(userId, workspaceId);
    if (membership?.status === 'active') {
      return workspaceId;
    }
  }

  const fallback = await WorkspaceMembership.findOne({ user: toObjectId(userId), status: 'active' }).sort({ joinedAt: -1 });
  if (!fallback) {
    throw new ApiError(httpStatus.FORBIDDEN, 'No active workspace membership found', true, '', 'WORKSPACE_NOT_FOUND');
  }

  return fallback.workspace.toString();
};

export const createWorkspaceForUser = async (userId: Types.ObjectId | string, name: string) => {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  const company = await companyService.createCompany({
    name,
    billing: { plan: PlanType.FREE },
  });

  await createOwnerMembership(user._id, company._id, user._id);

  return company;
};

export const switchWorkspace = async (userId: Types.ObjectId | string, workspaceId: string) => {
  const membership = await requireMembership(userId, workspaceId);
  await User.updateOne({ _id: toObjectId(userId) }, { lastActiveWorkspace: toObjectId(workspaceId), company: toObjectId(workspaceId) });
  return membership;
};

export const listWorkspaceMembers = async (workspaceId: string) => {
  const memberships = await WorkspaceMembership.find({ workspace: workspaceId, status: 'active' })
    .populate('user', 'name email status')
    .sort({ role: -1, joinedAt: 1 });

  return memberships.map((membership) => {
    const user: any = membership.user;
    return {
      membershipId: membership.id,
      userId: user?.id ?? user?._id?.toString(),
      name: user?.name,
      email: user?.email,
      role: membership.role,
      joinedAt: membership.joinedAt,
    };
  });
};

export const updateMemberRole = async (actorMembership: IWorkspaceMembershipDoc, targetUserId: string, role: WorkspaceRole) => {
  if (!canManageMembers(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions to manage members');
  }

  const target = await WorkspaceMembership.findOne({ user: targetUserId, workspace: actorMembership.workspace, status: 'active' });
  if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  if (target.role === 'owner') throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot change the workspace owner role');
  if (role === 'owner') throw new ApiError(httpStatus.BAD_REQUEST, 'Transfer ownership via a dedicated flow');

  target.role = role;
  await target.save();
  return target;
};

export const removeMember = async (actorMembership: IWorkspaceMembershipDoc, targetUserId: string) => {
  if (!canManageMembers(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions to manage members');
  }

  const target = await WorkspaceMembership.findOne({ user: targetUserId, workspace: actorMembership.workspace, status: 'active' });
  if (!target) throw new ApiError(httpStatus.NOT_FOUND, 'Member not found');
  if (target.role === 'owner') throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot remove the workspace owner');

  target.status = 'suspended';
  await target.save();
  return target;
};

export const createInvitation = async (
  actorMembership: IWorkspaceMembershipDoc,
  email: string,
  role: WorkspaceRole = 'member'
) => {
  if (!canManageMembers(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions to invite members');
  }
  if (role === 'owner') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot invite with owner role');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await userService.getUserByEmail(normalizedEmail);
  if (existingUser) {
    const existingMembership = await WorkspaceMembership.findOne({
      user: existingUser._id,
      workspace: actorMembership.workspace,
      status: { $in: ['active', 'invited'] },
    });
    if (existingMembership) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'User is already a member of this workspace');
    }
  }

  await WorkspaceInvitation.updateMany(
    { email: normalizedEmail, workspace: actorMembership.workspace, status: 'pending' },
    { status: 'revoked' }
  );

  const plainToken = generateInviteToken();
  const invitation = await WorkspaceInvitation.create({
    email: normalizedEmail,
    workspace: actorMembership.workspace,
    role,
    tokenHash: hashToken(plainToken),
    invitedBy: actorMembership.user,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    status: 'pending',
  });

  return { invitation, plainToken };
};

export const getInvitationByToken = async (plainToken: string) => {
  const invitation = await WorkspaceInvitation.findOne({ tokenHash: hashToken(plainToken), status: 'pending' }).populate('workspace');
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found or expired');
  if (invitation.expiresAt < new Date()) {
    invitation.status = 'expired';
    await invitation.save();
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invitation has expired');
  }
  return invitation;
};

export const acceptInvitation = async (plainToken: string, userId: Types.ObjectId | string) => {
  const invitation = await getInvitationByToken(plainToken);
  const user = await User.findById(userId);
  if (!user) throw new ApiError(httpStatus.NOT_FOUND, 'User not found');

  if (user.email.toLowerCase() !== invitation.email.toLowerCase()) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Invitation email does not match your account');
  }

  const membership = await WorkspaceMembership.findOneAndUpdate(
    { user: user._id, workspace: invitation.workspace },
    {
      user: user._id,
      workspace: invitation.workspace,
      role: invitation.role,
      status: 'active',
      invitedBy: invitation.invitedBy,
      joinedAt: new Date(),
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  invitation.status = 'accepted';
  invitation.acceptedAt = new Date();
  invitation.acceptedBy = user._id;
  await invitation.save();

  const workspaceId =
    typeof invitation.workspace === 'object' && invitation.workspace !== null
      ? (invitation.workspace as any)._id?.toString?.() ?? (invitation.workspace as any).id
      : invitation.workspace.toString();

  await User.updateOne(
    { _id: user._id },
    {
      lastActiveWorkspace: invitation.workspace,
      company: invitation.workspace,
      acceptedInvitation: true,
      isBoarded: true,
    }
  );

  return { membership, workspaceId };
};

export const listInvitations = async (workspaceId: string) =>
  WorkspaceInvitation.find({ workspace: workspaceId, status: 'pending' }).sort({ createdAt: -1 });

export const revokeInvitation = async (actorMembership: IWorkspaceMembershipDoc, invitationId: string) => {
  if (!canManageMembers(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions to manage invitations');
  }

  const invitation = await WorkspaceInvitation.findOne({ _id: invitationId, workspace: actorMembership.workspace, status: 'pending' });
  if (!invitation) throw new ApiError(httpStatus.NOT_FOUND, 'Invitation not found');

  invitation.status = 'revoked';
  await invitation.save();
  return invitation;
};

export const getWorkspaceById = async (workspaceId: string) => {
  const workspace = await Company.findById(workspaceId);
  if (!workspace) throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found');
  return workspace;
};

export const updateWorkspace = async (actorMembership: IWorkspaceMembershipDoc, updates: Record<string, unknown>) => {
  if (!canManageWorkspace(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions to update workspace');
  }

  return companyService.updateCompanyById(actorMembership.workspace, updates as any);
};

export const deleteWorkspace = async (actorMembership: IWorkspaceMembershipDoc) => {
  if (!canDeleteWorkspace(actorMembership.role)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Only the workspace owner can delete the workspace');
  }

  await WorkspaceMembership.updateMany({ workspace: actorMembership.workspace }, { status: 'suspended' });
  await WorkspaceInvitation.updateMany({ workspace: actorMembership.workspace, status: 'pending' }, { status: 'revoked' });
  await Company.findByIdAndUpdate(actorMembership.workspace, { status: 'deleted' });
};
