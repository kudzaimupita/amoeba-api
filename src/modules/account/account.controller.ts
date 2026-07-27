import httpStatus from 'http-status';
import { Request, Response } from 'express';
import { catchAsync } from '../../utils';
import { ApiError } from '../../utils/errors';
import User from '../user/user.model';
import * as service from './account.service';
import * as recoveryCodeService from './recoveryCode.service';

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

const verifyCurrentPassword = async (userId: string, password: string) => {
  const user = await User.findById(userId).select('+password');
  if (!user?.password || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect password', true, '', 'AUTH_INVALID_CREDENTIALS');
  }
};

export const getRecoveryCodes = catchAsync(async (req: Request, res: Response) => {
  const summary = await recoveryCodeService.getRecoveryCodeSummary(currentUser(req)._id);
  res.send({ success: true, data: summary });
});

export const generateRecoveryCodes = catchAsync(async (req: Request, res: Response) => {
  const user = currentUser(req);
  await verifyCurrentPassword(user._id.toString(), req.body.password);

  const codes = await recoveryCodeService.generateRecoveryCodes(user._id);
  const summary = await recoveryCodeService.getRecoveryCodeSummary(user._id);

  res.status(httpStatus.CREATED).send({
    success: true,
    message: 'Save these recovery codes now. They will not be shown again.',
    data: {
      codes,
      ...summary,
    },
  });
});

export const revokeRecoveryCodes = catchAsync(async (req: Request, res: Response) => {
  const user = currentUser(req);
  await verifyCurrentPassword(user._id.toString(), req.body.password);

  const deletedCount = await recoveryCodeService.revokeAllRecoveryCodes(user._id);
  res.send({ success: true, data: { deletedCount } });
});

