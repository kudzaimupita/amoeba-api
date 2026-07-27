import { Document, Model, Types } from 'mongoose';
import { QueryResult } from '../../utils/paginate/paginate';
import { InvitationStatus, MembershipStatus, WorkspaceRole } from './workspace.constants';

export interface IWorkspaceMembership {
  user: Types.ObjectId;
  workspace: Types.ObjectId;
  role: WorkspaceRole;
  status: MembershipStatus;
  invitedBy?: Types.ObjectId;
  joinedAt?: Date;
}

export interface IWorkspaceMembershipDoc extends IWorkspaceMembership, Document {}

export interface IWorkspaceMembershipModel extends Model<IWorkspaceMembershipDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult>;
}

export interface IWorkspaceInvitation {
  email: string;
  workspace: Types.ObjectId;
  role: WorkspaceRole;
  tokenHash: string;
  invitedBy: Types.ObjectId;
  expiresAt: Date;
  status: InvitationStatus;
  acceptedAt?: Date;
  acceptedBy?: Types.ObjectId;
}

export interface IWorkspaceInvitationDoc extends IWorkspaceInvitation, Document {}

export interface IWorkspaceInvitationModel extends Model<IWorkspaceInvitationDoc> {
  paginate(filter: Record<string, unknown>, options: Record<string, unknown>): Promise<QueryResult>;
}

export type WorkspaceSummary = {
  id: string;
  name: string;
  role: WorkspaceRole;
  status: MembershipStatus;
  isActive: boolean;
};
