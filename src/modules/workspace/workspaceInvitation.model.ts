import mongoose from 'mongoose';
import paginate from '../../utils/paginate/paginate';
import toJSON from '../../utils/toJSON/toJSON';
import { IWorkspaceInvitationDoc, IWorkspaceInvitationModel } from './workspace.interfaces';
import { INVITATION_STATUSES, WORKSPACE_ROLES } from './workspace.constants';

const workspaceInvitationSchema = new mongoose.Schema<IWorkspaceInvitationDoc, IWorkspaceInvitationModel>(
  {
    email: { type: String, required: true, lowercase: true, trim: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    role: { type: String, enum: WORKSPACE_ROLES, default: 'member' },
    tokenHash: { type: String, required: true, index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true, index: true },
    status: { type: String, enum: INVITATION_STATUSES, default: 'pending', index: true },
    acceptedAt: { type: Date },
    acceptedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

workspaceInvitationSchema.index({ workspace: 1, email: 1, status: 1 });

workspaceInvitationSchema.plugin(toJSON);
workspaceInvitationSchema.plugin(paginate);

const WorkspaceInvitation = mongoose.model<IWorkspaceInvitationDoc, IWorkspaceInvitationModel>(
  'WorkspaceInvitation',
  workspaceInvitationSchema
);

export default WorkspaceInvitation;
