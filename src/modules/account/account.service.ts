import httpStatus from 'http-status';
import { ApiError } from '../../utils/errors';
import Token from '../token/token.model';
import tokenTypes from '../token/token.types';

const sessionView = (session: any, currentRefreshToken?: string) => {
  const details = session.sessionDetails || {};
  let status = 'active';
  if (session.blacklisted) status = 'revoked';
  else if (session.expires <= new Date()) status = 'expired';

  return {
    id: session._id,
    current: Boolean(currentRefreshToken && session.token === currentRefreshToken),
    device: typeof details.device === 'string' ? details.device.slice(0, 120) : 'Unknown device',
    browser: typeof details.browser === 'string' ? details.browser.slice(0, 120) : 'Unknown browser',
    os: typeof details.os === 'string' ? details.os.slice(0, 120) : 'Unknown OS',
    loginType: typeof details.loginType === 'string' ? details.loginType.slice(0, 40) : 'email',
    signedInAt: details.timestamp || session.createdAt,
    expiresAt: session.expires,
    status,
  };
};

export const listOwnedSessions = async (userId: any, currentRefreshToken?: string) => {
  const sessions = await Token.find({ user: userId.toString(), type: tokenTypes.REFRESH }).sort({ createdAt: -1 });
  return sessions.map((session) => sessionView(session, currentRefreshToken));
};

export const revokeOwnedSession = async (userId: any, sessionId: string, currentRefreshToken?: string) => {
  const session: any = await Token.findOne({ _id: sessionId, user: userId.toString(), type: tokenTypes.REFRESH });
  if (!session) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Login session not found', true, '', 'ACCOUNT_SESSION_NOT_FOUND');
  }

  const current = Boolean(currentRefreshToken && session.token === currentRefreshToken);
  if (current) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot revoke the current session', true, '', 'ACCOUNT_SESSION_CURRENT');
  }

  session.blacklisted = true;
  await session.save();
  return sessionView(session, currentRefreshToken);
};
