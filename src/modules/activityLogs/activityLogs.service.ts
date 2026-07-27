/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import ActivityLog from './activityLogs.model';
import { IOptions, QueryResult } from '../../utils/paginate/paginate';
import { IActivityLogDoc } from './activityLogs.interfaces';

// import { IActivityLogDoc } from './activityLogs.interfaces';
/**
 * Create a activityLog
 * @param {IActivityLogDoc} activityLogBody
 * @returns {Promise<IActivityLogDoc>}
 */
export const createActivityLog = async (activityLogBody: any): Promise<IActivityLogDoc> => {
  const existingCount = await ActivityLog.countDocuments({ resourceId: new ObjectId(activityLogBody.resourceId) });

  const newVersion = existingCount + 1;

  const activityLogData = {
    ...activityLogBody,
    version: newVersion,
  };

  return ActivityLog.create(activityLogData);
};

/**
 * Query for activityLogs
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryActivityLogs = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const activityLogs = (await ActivityLog.paginate(filter, options)) as any;
  return activityLogs;
};

/**
 * Get activityLog by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IActivityLogDoc | null>}
 */
export const getActivityLogById = async (id: mongoose.Types.ObjectId, company: string): Promise<IActivityLogDoc | null> => {
  const filter: any = { _id: new ObjectId(id), company: new ObjectId(company) };

  return ActivityLog.findOne(filter).exec();
};
