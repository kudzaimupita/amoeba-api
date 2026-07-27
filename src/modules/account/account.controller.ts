import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../../utils';
import { ApiError } from '../../utils/errors';
import * as service from './account.service';

const currentUser = (req: Request) => {
  if (!req.user?._id || !req.user?.company?._id) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Authentication required');
  }
  return req.user;
};

const refreshToken = (req: Request) =>
  typeof req.headers.refreshtoken === 'string' ? req.headers.refreshtoken : undefined;

export const listSessions = catchAsync(async (req: Request, res: Response) => {
  res.send({ success: true, data: await service.listOwnedSessions(currentUser(req)._id, refreshToken(req)) });
});

export const revokeSession = catchAsync(async (req: Request, res: Response) => {
  res.send({
    success: true,
    data: await service.revokeOwnedSession(currentUser(req)._id, req.params.sessionId, refreshToken(req)),
  });
});
