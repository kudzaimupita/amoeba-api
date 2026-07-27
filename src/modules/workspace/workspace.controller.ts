import { Request, Response } from 'express';
import httpStatus from 'http-status';

import catchAsync from '../catchAsync';
import ApiError from '../../utils/errors/ApiError';
import config from '../../config/config';
import * as workspaceService from './workspace.service';

const getActorMembership = (req: Request) => {
  const membership = (req as any).workspaceMembership;
  if (!membership) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Workspace context required');
  }
  return membership;
};

export const listWorkspaces = catchAsync(async (req: Request, res: Response) => {
  const activeWorkspaceId =
    (req as any).activeWorkspaceId?.toString() ?? req.user?.company?._id?.toString() ?? req.user?.company?.toString();

  const workspaces = await workspaceService.listUserWorkspaces(req.user!.id, activeWorkspaceId);
  res.send({ success: true, data: workspaces, activeWorkspaceId });
});

export const createWorkspace = catchAsync(async (req: Request, res: Response) => {
  const workspace = await workspaceService.createWorkspaceForUser(req.user!.id, req.body.name);
  res.status(httpStatus.CREATED).send({ success: true, data: workspace });
});

export const getWorkspace = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  const workspace = await workspaceService.getWorkspaceById(req.params.workspaceId);
  res.send({ success: true, data: workspace, membership: { role: membership.role, status: membership.status } });
});

export const updateWorkspace = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  const workspace = await workspaceService.updateWorkspace(membership, req.body);
  res.send({ success: true, data: workspace });
});

export const deleteWorkspace = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  await workspaceService.deleteWorkspace(membership);
  res.status(httpStatus.NO_CONTENT).send();
});

export const switchWorkspace = catchAsync(async (req: Request, res: Response) => {
  const { tokenService } = await import('../token');
  const { generateSessionConfig } = await import('../auth/helpers');

  const membership = await workspaceService.switchWorkspace(req.user!.id, req.params.workspaceId);
  const user = req.user as any;

  const tokens = await tokenService.generateAuthTokens(
    user._doc || user,
    48,
    generateSessionConfig(req, 'workspace_switch'),
    req.params.workspaceId,
    0,
    'hours',
    undefined,
    undefined,
    req.params.workspaceId
  );

  res.send({
    success: true,
    data: {
      workspaceId: req.params.workspaceId,
      role: membership.role,
      tokens,
    },
  });
});

export const listMembers = catchAsync(async (req: Request, res: Response) => {
  await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  const members = await workspaceService.listWorkspaceMembers(req.params.workspaceId);
  res.send({ success: true, data: members });
});

export const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  const updated = await workspaceService.updateMemberRole(membership, req.params.userId, req.body.role);
  res.send({ success: true, data: updated });
});

export const removeMember = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  await workspaceService.removeMember(membership, req.params.userId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const inviteMember = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  const { invitation, plainToken } = await workspaceService.createInvitation(membership, req.body.email, req.body.role);

  res.status(httpStatus.CREATED).send({
    success: true,
    data: {
      id: invitation.id,
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      inviteLink: `${config.clientUrl}/accept-invite?token=${plainToken}`,
    },
  });
});

export const listInvitations = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  if (membership.role !== 'owner' && membership.role !== 'admin') {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  const invitations = await workspaceService.listInvitations(req.params.workspaceId);
  res.send({ success: true, data: invitations });
});

export const revokeInvitation = catchAsync(async (req: Request, res: Response) => {
  const membership = await workspaceService.requireMembership(req.user!.id, req.params.workspaceId);
  await workspaceService.revokeInvitation(membership, req.params.invitationId);
  res.status(httpStatus.NO_CONTENT).send();
});

export const previewInvitation = catchAsync(async (req: Request, res: Response) => {
  const invitation = await workspaceService.getInvitationByToken(req.params.token);
  const workspace: any = invitation.workspace;
  res.send({
    success: true,
    data: {
      email: invitation.email,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
      workspace: { id: workspace?.id ?? workspace?._id, name: workspace?.name },
    },
  });
});

export const acceptInvitation = catchAsync(async (req: Request, res: Response) => {
  const { tokenService } = await import('../token');
  const { generateSessionConfig } = await import('../auth/helpers');

  const { membership, workspaceId } = await workspaceService.acceptInvitation(req.body.token, req.user!.id);
  const user = req.user as any;

  const tokens = await tokenService.generateAuthTokens(
    user._doc || user,
    48,
    generateSessionConfig(req, 'invite_accept'),
    workspaceId,
    0,
    'hours',
    undefined,
    undefined,
    workspaceId
  );

  res.send({
    success: true,
    data: {
      workspaceId,
      role: membership.role,
      tokens,
    },
  });
});
