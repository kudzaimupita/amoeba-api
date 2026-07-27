import mongoose from 'mongoose';
import paginate from '../../utils/paginate/paginate';
import toJSON from '../../utils/toJSON/toJSON';
import { IWorkspaceMembershipDoc, IWorkspaceMembershipModel } from './workspace.interfaces';
import { MEMBERSHIP_STATUSES, WORKSPACE_ROLES } from './workspace.constants';

const workspaceMembershipSchema = new mongoose.Schema<IWorkspaceMembershipDoc, IWorkspaceMembershipModel>(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    workspace: { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    role: { type: String, enum: WORKSPACE_ROLES, required: true },
    status: { type: String, enum: MEMBERSHIP_STATUSES, default: 'active', index: true },
    invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    joinedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

workspaceMembershipSchema.index({ user: 1, workspace: 1 }, { unique: true });
workspaceMembershipSchema.index({ workspace: 1, status: 1 });

workspaceMembershipSchema.plugin(toJSON);
workspaceMembershipSchema.plugin(paginate);

const WorkspaceMembership = mongoose.model<IWorkspaceMembershipDoc, IWorkspaceMembershipModel>(
  'WorkspaceMembership',
  workspaceMembershipSchema
);

export default WorkspaceMembership;
