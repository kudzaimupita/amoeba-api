/* eslint-disable import/no-extraneous-dependencies */
import httpStatus from 'http-status';
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import { catchAsync, pick } from '../../utils';
import ApiError from '../../utils/errors/ApiError';
import { IOptions } from '../../utils/paginate/paginate';
import * as activityLogService from './activityLogs.service';

export const getActivityLogs = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['name', 'resourceId', 'resourceType', 'action', 'actionBy', 'status', 'statusCode']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await activityLogService.queryActivityLogs({ ...filter, company: req.user?.company?._id }, options);
  res.send(result);
});

export const getActivityLog = catchAsync(async (req: Request, res: Response) => {
  if (typeof req.params.activityLogId === 'string') {
    const activityLog = await activityLogService.getActivityLogById(
      new mongoose.Types.ObjectId(req.params.activityLogId),
      req.user?.company?._id
    );
    if (!activityLog) {
      throw new ApiError(httpStatus.NOT_FOUND, 'ActivityLog not found');
    }
    res.send(activityLog);
  }
});
