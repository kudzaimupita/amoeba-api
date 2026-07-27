import request from 'supertest';
import httpStatus from 'http-status';

import Token from '../../src/modules/token/token.model';
import tokenTypes from '../../src/modules/token/token.types';
import User from '../../src/modules/user/user.model';
import { app } from './app';
import { AuthenticatedSession, authHeaders } from './auth.helper';

export const getPinFromTokenId = async (docId: string): Promise<number> => {
  const token = await Token.findById(docId);
  if (!token || token.pin == null) {
    throw new Error(`PIN token not found for docId ${docId}`);
  }

  return token.pin;
};

export const registerWithOtp = async (payload: {
  email: string;
  password: string;
  name: string;
}): Promise<{ session: AuthenticatedSession; docId: string; pin: number }> => {
  const registerResponse = await request(app).post('/v1/auth/register').send(payload);

  if (registerResponse.status !== httpStatus.OK || !registerResponse.body.tokenId) {
    throw new Error(`OTP register start failed (${registerResponse.status}): ${JSON.stringify(registerResponse.body)}`);
  }

  const docId = registerResponse.body.tokenId as string;
  const pin = await getPinFromTokenId(docId);

  const confirmResponse = await request(app).post('/v1/auth/confirm-register').send({ pin, docId });

  if (confirmResponse.status !== httpStatus.OK) {
    throw new Error(`OTP register confirm failed (${confirmResponse.status}): ${JSON.stringify(confirmResponse.body)}`);
  }

  const accessToken = confirmResponse.body.tokens.access.token as string;
  const refreshToken = confirmResponse.body.tokens.refresh.token as string;

  const session: AuthenticatedSession = {
    user: confirmResponse.body.user,
    accessToken,
    refreshToken,
    headers: authHeaders(accessToken, refreshToken),
    companyId:
      confirmResponse.body.user.company?._id?.toString() ??
      confirmResponse.body.user.company?.id?.toString() ??
      confirmResponse.body.user.company,
  };

  return { session, docId, pin };
};

export const loginWithOtp = async (email: string, password: string): Promise<AuthenticatedSession> => {
  const loginResponse = await request(app).post('/v1/auth/request-login').send({ email, password });

  if (loginResponse.status !== httpStatus.OK || !loginResponse.body.tokenId) {
    throw new Error(`OTP login start failed (${loginResponse.status}): ${JSON.stringify(loginResponse.body)}`);
  }

  const docId = loginResponse.body.tokenId as string;
  const pin = await getPinFromTokenId(docId);

  const confirmResponse = await request(app).post('/v1/auth/confirm-login').send({ pin, docId });

  if (confirmResponse.status !== httpStatus.OK) {
    throw new Error(`OTP login confirm failed (${confirmResponse.status}): ${JSON.stringify(confirmResponse.body)}`);
  }

  const accessToken = confirmResponse.body.tokens.access.token as string;
  const refreshToken = confirmResponse.body.tokens.refresh.token as string;

  return {
    user: confirmResponse.body.user,
    accessToken,
    refreshToken,
    headers: authHeaders(accessToken, refreshToken),
    companyId:
      confirmResponse.body.user.company?._id?.toString() ??
      confirmResponse.body.user.company?.id?.toString() ??
      confirmResponse.body.user.company,
  };
};

export const getResetPasswordTokenForEmail = async (email: string): Promise<string> => {
  const user = await User.findOne({ email });
  const tokenDoc = await Token.findOne({
    type: tokenTypes.RESET_PASSWORD,
    user: user?._id?.toString(),
  }).sort({ createdAt: -1 });

  if (!tokenDoc?.token) {
    throw new Error(`Reset password token not found for ${email}`);
  }

  return tokenDoc.token;
};
