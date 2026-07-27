import mongoose from 'mongoose';
import toJSON from '../../utils/toJSON/toJSON';
import paginate from '../../utils/paginate/paginate';
import { IActivityLogDoc, IActivityLogModel } from './activityLogs.interfaces';

const activityLogSchema = new mongoose.Schema<IActivityLogDoc, IActivityLogModel>(
  {
    userId: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      // required: [true, 'User ID is required'],
    },
    actionType: {
      type: String,
      // enum: [
      //   'LOGIN',
      //   'LOGOUT',
      //   'CREATE',
      //   'UPDATE',
      //   'DELETE',
      //   'RESTORE',
      //   'ERROR',
      //   'READ',
      //   'SECURITY_BREACH',
      //   'DATA_CHANGE',
      //   'NETWORK_EVENT',
      //   'SYSTEM_EVENT',
      //   'SECURITY_WARNING',
      //   'SOFT_DELETE',
      //   'IN_PROGRESS',
      //   'PARTIAL_SUCCESS',
      //   'FAILED',
      // ],
      required: [true, 'Action type is required'],
    },
    resourceType: {
      type: String,
      // enum: ['USER', 'APPLICATION', 'DATA', 'NETWORK', 'SYSTEM', 'TOKEN', 'COMPANY'],
      required: [true, 'Resource type is required'],
    },
    resourceId: {
      type: mongoose.Schema.ObjectId,
      required: false,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    ipAddress: {
      type: String,
      // required: [true, 'IP Address is required'],
    },
    userAgent: {
      type: String,
      // required: [true, 'User Agent is required'],
    },
    company: {
      type: mongoose.Schema.ObjectId,
      ref: 'Company',
    },
    sessionId: {
      type: String,
      required: false,
    },
    status: {
      type: String,
      enum: ['SUCCESS', 'FAILURE', 'FAILED', 'IN_PROGRESS', 'PARTIAL_SUCCESS'],
      required: false,
    },
    errorCode: {
      type: String,
      required: false,
    },
    additionalInfo: {
      type: mongoose.Schema.Types.Mixed,
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Add plugin that converts mongoose to json
activityLogSchema.plugin(toJSON);
activityLogSchema.plugin(paginate);

activityLogSchema.index({ company: 1 });
activityLogSchema.index({ userId: 1 });
activityLogSchema.index({ actionType: 1 });
activityLogSchema.index({ resourceType: 1 });
activityLogSchema.index({ createdAt: -1 });

const ActivityLog = mongoose.model<IActivityLogDoc, IActivityLogModel>('ActivityLog', activityLogSchema);

export default ActivityLog;
