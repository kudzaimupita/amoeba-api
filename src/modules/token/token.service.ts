/* eslint-disable no-param-reassign */
import moment, { Moment } from 'moment';
import httpStatus from 'http-status';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { AccessAndRefreshTokens, ITokenDoc } from './token.interfaces';

import ApiError from '../../utils/errors/ApiError';
import { IOptions } from '../../utils/paginate/paginate';
import { IUserDoc } from '../user/user.interfaces';
import Token from './token.model';
import config from '../../config/config';
/* eslint-disable @typescript-eslint/default-param-last */
import tokenTypes from './token.types';
import { userService } from '../user';

/**
 * Generate token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
export const generateToken = (
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: string,
  secret: string = config.jwt.secret,
  pluginId?: any,
  workspaceId?: string
): string => {
  if (!secret) {
    secret = config.jwt.secret;
  }
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  } as any;
  if (pluginId) {
    payload.sub = JSON.stringify({ userId, pluginId });
  }
  if (workspaceId && type === tokenTypes.ACCESS) {
    payload.wid = workspaceId;
  }
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {mongoose.Types.ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<ITokenDoc>}
 */
export const saveToken = async (
  token: string,
  userId: mongoose.Types.ObjectId,
  expires: Moment,
  type: string,
  blacklisted: boolean = false,
  sessionDetails: object,
  company: string,
  pin: number | null,
  pluginId?: any,
  workspaceId?: string
): Promise<ITokenDoc> => {
  const tokenDoc = await Token.create({
    token,
    user: pluginId ? JSON.stringify({ userId, pluginId }) : userId,
    expires: expires.toDate(),
    type,
    blacklisted,
    sessionDetails,
    workspace: workspaceId || company || undefined,
    pin,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<ITokenDoc>}
 */
export const verifyToken = async (token: string, type: string): Promise<ITokenDoc> => {
  const payload = jwt.verify(token, config.jwt.secret);
  if (typeof payload.sub !== 'string') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'bad user');
  }
  const tokenDoc = await Token.findOne({
    token,
    type,
    user: payload.sub,
    blacklisted: false,
  });
  if (!tokenDoc) {
    throw new Error('Token not found');
  }
  return tokenDoc;
};

export const queryTokens = async (filter: Record<string, any>, options: IOptions) => {
  const documents = await Token.paginate(filter, options);
  return documents;
};

/**
 * Generate auth tokens
 * @param {IUserDoc} user
 * @returns {Promise<AccessAndRefreshTokens>}
 */
export const generateAuthTokens = async (
  user: IUserDoc,
  duration: any,
  sessionDetails: any,
  company: string,
  pin: number,
  timeUnits: string = 'hours',
  pluginId?: any,
  secret?: any,
  workspaceId?: string
): Promise<AccessAndRefreshTokens> => {
  const activeWorkspaceId = workspaceId || company;
  const accessTokenExpires = moment().add(duration || 48, timeUnits);
  const accessToken = generateToken(
    user._id,
    accessTokenExpires,
    tokenTypes.ACCESS,
    secret || '',
    pluginId,
    activeWorkspaceId
  );

  const refreshTokenExpires = moment().add(duration || 48, timeUnits);
  const refreshToken = generateToken(user._id, refreshTokenExpires, tokenTypes.REFRESH, secret || '', pluginId);
  await saveToken(
    refreshToken,
    user._id,
    refreshTokenExpires,
    tokenTypes.REFRESH,
    false,
    sessionDetails,
    company,
    null,
    pluginId,
    activeWorkspaceId
  );

  let pinDoc = {} as any;
  if (pin) {
    pinDoc = await saveToken(
      refreshToken,
      user._id,
      accessTokenExpires,
      'pin',
      false,
      sessionDetails,
      company,
      pin,
      pluginId,
      activeWorkspaceId
    );
  }

  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken,
      expires: refreshTokenExpires.toDate(),
    },
    pin: {
      token: pinDoc?._id,
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
export const generateResetPasswordToken = async (
  email: string,
  sessionDetails: any,
  company: string,
  duration: string
): Promise<string> => {
  const user = await userService.getUserByEmail(email);
  if (!user) {
    throw new ApiError(httpStatus.NO_CONTENT, '');
  }
  const expires = moment().add(duration || config.jwt.resetPasswordExpirationMinutes, 'minutes');
  const resetPasswordToken = generateToken(user.id, expires, tokenTypes.RESET_PASSWORD);
  await saveToken(resetPasswordToken, user.id, expires, tokenTypes.RESET_PASSWORD, false, sessionDetails, company, null);
  return resetPasswordToken;
};

export const blacklistTokens = async (ids: string[]) => {
  const success = await Token.updateMany(
    {
      _id: {
        $in: ids,
      },
    },
    { $set: { blacklisted: true } }
  );
  return success;
};

export const deleteManyTokens = async (filter: Record<string, any>): Promise<boolean> => {
  await Token.deleteMany(filter);
  return true;
};
export const getTokenById = async (id: string) => {
  const documents = await Token.findById(id);

  return documents;
};
