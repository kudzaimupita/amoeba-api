/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import httpStatus from 'http-status';
import config from '../../config/config';
import { logger } from '../logger';
import ApiError from './ApiError';
import { activityLogService } from '../../modules/activityLogs';

export const errorConverter = (err: any, _req: Request, _res: Response, next: NextFunction) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? httpStatus.BAD_REQUEST : httpStatus.INTERNAL_SERVER_ERROR;
    const message: string = error.message || `${httpStatus[statusCode]}`;
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err: ApiError, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    // Delegate to Express' default handler when response is already committed
    if (config.env === 'development') {
      logger.error('Error occurred after response headers were sent', err);
    }
    return next(err);
  }

  let { statusCode, message } = err;
  if (config.env === 'production' && !err.isOperational) {
    statusCode = httpStatus.INTERNAL_SERVER_ERROR;
    message = 'Internal Server Error';
  }
  if (config.env !== 'test' && req.user?.company?._id) {
    activityLogService
      .createActivityLog({
        actionBy: req.user?._id,
        resourceType: 'SYSTEM',
        company: req?.user?.company?._id,
        actionType: 'SYSTEM_EVENT',
        description: `Error ${message} at ${new Date()}`,
        status: 'FAILURE',
        statusCode,
      })
      .catch((activityError) => logger.warn('Failed to record API error activity', activityError));
  }

  res.locals.errorMessage = err.message;

  let defaultErrorCode: string | undefined;
  if (statusCode === httpStatus.TOO_MANY_REQUESTS) defaultErrorCode = 'AUTH_RATE_LIMITED';
  else if (statusCode === httpStatus.LOCKED) defaultErrorCode = 'ACCOUNT_LOCKED';
  else if (statusCode === httpStatus.FORBIDDEN) defaultErrorCode = 'AUTH_PERMISSION_DENIED';
  else if (statusCode === httpStatus.UNAUTHORIZED) defaultErrorCode = 'AUTH_SESSION_EXPIRED';

  const response = {
    code: statusCode,
    ...((err.errorCode || defaultErrorCode) && { errorCode: err.errorCode || defaultErrorCode }),
    message,
    ...(config.env === 'development' && { stack: err.stack }),
  };

  if (config.env === 'development') {
    logger.error(err);
  }

  res.status(statusCode).send(response);
};
