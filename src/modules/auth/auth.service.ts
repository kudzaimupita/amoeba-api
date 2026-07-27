// @ts-nocheck
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import Token from '../token/token.model';
import ApiError from '../../utils/errors/ApiError';
import tokenTypes from '../token/token.types';
import { getUserByEmail, getUserById, updateUserById } from '../user/user.service';
import { IUserDoc } from '../user/user.interfaces';
import { verifyToken, generateAuthTokens } from '../token/token.service';
import { userService } from '../user';
import loginNotificationTemplate from './templates/loginNotification';
import passwordUpdateNotificationTemplate from './templates/passwordUpdateNotification';
import SendNotification from '../comms/internal';
import config from '../../config/config';

// Conditionally import geoip and useragent to avoid TypeScript errors
let geoip;
let useragent;
try {
  geoip = require('geoip-lite');
  useragent = require('useragent');
} catch (error) {
  console.warn('Optional dependencies not installed:', error);
  geoip = { lookup: () => null };
  useragent = { parse: () => ({ device: {}, browser: {}, os: {} }) };
}

// Create a notification service
const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

/**
 * Send login notification email
 * @param {IUserDoc} user - The user who logged in
 * @param {string} ipAddress - IP address of the login
 */
export const sendLoginNotification = async (user, ipAddress) => {
  try {
    // Detect location using geoip
    const geo = geoip.lookup(ipAddress);
    const location = geo ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}` : 'Unknown Location';

    // Detect device and browser details
    const agent = useragent.parse(user.lastUserAgent || '');

    // Prepare browser info with proper fallback
    const browserFamily = agent?.browser?.family || 'Unknown';
    const browserMajor = agent?.browser?.major;
    const browserInfo = browserFamily !== 'Other' && browserFamily !== 'Unknown' 
      ? (browserMajor ? `${browserFamily} ${browserMajor}` : browserFamily)
      : 'Unknown Browser';

    // Prepare OS info with proper fallback
    const osFamily = agent?.os?.family || 'Unknown';
    const osMajor = agent?.os?.major;
    const osInfo = osFamily !== 'Other' && osFamily !== 'Unknown'
      ? (osMajor ? `${osFamily} ${osMajor}` : osFamily)
      : 'Unknown OS';

    // Prepare email parameters
    const emailParams = {
      userName: user.name || 'User',
      loginTime: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ipAddress: ipAddress || 'Unknown IP',
      location: location || 'Unknown Location',
      deviceType: agent?.device?.family || agent?.os?.family || 'Unknown Device',
      browser: browserInfo,
      operatingSystem: osInfo,
    };

    // Send notification email
    await notifier.sendLoginNotificationEmail(user.email, user.name, loginNotificationTemplate, emailParams);
  } catch (error) {
    console.error('Failed to send login notification:', error);
    // Fail silently to not interrupt login flow
  }
};

/**
 * Send password update notification email
 * @param {IUserDoc} user - The user who updated their password
 * @param {string} ipAddress - IP address of the password update
 */
export const sendPasswordUpdateNotification = async (user, ipAddress) => {
  try {
    // Detect location using geoip
    const geo = geoip.lookup(ipAddress);
    const location = geo ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}` : 'Unknown Location';

    // Detect device and browser details
    const agent = useragent.parse(user.currentUserAgent || '');

    // Prepare browser info with proper fallback
    const browserFamily = agent?.browser?.family || 'Unknown';
    const browserMajor = agent?.browser?.major;
    const browserInfo = browserFamily !== 'Other' && browserFamily !== 'Unknown' 
      ? (browserMajor ? `${browserFamily} ${browserMajor}` : browserFamily)
      : 'Unknown Browser';

    // Prepare OS info with proper fallback
    const osFamily = agent?.os?.family || 'Unknown';
    const osMajor = agent?.os?.major;
    const osInfo = osFamily !== 'Other' && osFamily !== 'Unknown'
      ? (osMajor ? `${osFamily} ${osMajor}` : osFamily)
      : 'Unknown OS';

    // Prepare email parameters
    const emailParams = {
      userName: user.name || 'User',
      updateTime: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ipAddress: ipAddress || 'Unknown IP',
      location: location || 'Unknown Location',
      deviceType: agent?.device?.family || agent?.os?.family || 'Unknown Device',
      browser: browserInfo,
      operatingSystem: osInfo,
    };

    // Send notification email
    await notifier.sendPasswordUpdateNotificationEmail(
      user.email,
      user.name,
      passwordUpdateNotificationTemplate,
      emailParams
    );
  } catch (error) {
    console.error('Failed to send password update notification:', error);
    // Fail silently to not interrupt password update flow
  }
};

/**
 * Login with username and password
 * @param {string} email
 * @param {string} password
 * @param {string} [ipAddress=''] - IP address of the login attempt
 */
export const loginUser = async (email, password, ipAddress = '') => {
  const user = await userService.getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password', true, '', 'AUTH_INVALID_CREDENTIALS');
  }
  if (user.status === 'disabled') {
    throw new ApiError(
      httpStatus.UNAUTHORIZED,
      'Account disabled, contact your administrator for assistance',
      true,
      '',
      'ACCOUNT_DISABLED'
    );
  }

  // Update last login details
  user.lastLogin = new Date();
  user.lastLoginIP = ipAddress;
  user.lastUserAgent = user.currentUserAgent; // Store previous user agent
  user.currentUserAgent = user.currentUserAgent; // Update current user agent
  await user.save();

  // Send login notification email
  // await sendLoginNotification(user, ipAddress);

  return user;
};

/**
 * Logout
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logout = async (refreshToken: string): Promise<void> => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Not found');
  }
  refreshTokenDoc.blacklisted = true;
  await refreshTokenDoc.save();
};

/**
 * Logout all sessions (blacklist all tokens for user)
 * @param {string} refreshToken
 * @returns {Promise<void>}
 */
export const logoutAllSessions = async (refreshToken: string): Promise<void> => {
  const refreshTokenDoc = await Token.findOne({ token: refreshToken, type: tokenTypes.REFRESH, blacklisted: false });
  if (!refreshTokenDoc) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Session not found');
  }

  // Blacklist all tokens for this user
  await Token.updateMany(
    {
      user: refreshTokenDoc.user,
      blacklisted: false
    },
    {
      $set: { blacklisted: true }
    }
  );
};

/**
 * Refresh auth tokens (rotate refresh token, issue new access token)
 * @param {string} refreshToken
 * @param {object} [sessionDetails]
 * @returns {Promise<{ tokens: import('../token/token.interfaces').AccessAndRefreshTokens }>}
 */
export const refreshAuth = async (refreshToken: string, sessionDetails: object = {}) => {
  try {
    const refreshTokenDoc = await verifyToken(refreshToken, tokenTypes.REFRESH);
    const user = await getUserById(new mongoose.Types.ObjectId(refreshTokenDoc.user), 'skip');
    if (!user) {
      throw new Error('User not found');
    }

    refreshTokenDoc.blacklisted = true;
    await refreshTokenDoc.save();

    const workspaceId =
      refreshTokenDoc.workspace?.toString() ||
      user.lastActiveWorkspace?.toString() ||
      user.company?.toString();

    const tokens = await generateAuthTokens(
      user,
      user.company?.tokenExpire || 48,
      sessionDetails,
      workspaceId,
      0,
      'hours',
      undefined,
      undefined,
      workspaceId
    );

    return { tokens };
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate');
  }
};

/**
 * Reset password
 * @param {string} resetPasswordToken
 * @param {string} newPassword
 * @param {string} [ipAddress=''] - IP address of the password reset
 */
export const resetPassword = async (resetPasswordToken, newPassword, ipAddress = '') => {
  try {
    const resetPasswordTokenDoc = await verifyToken(resetPasswordToken, tokenTypes.RESET_PASSWORD);
    const user = await getUserById(new mongoose.Types.ObjectId(resetPasswordTokenDoc.user), 'skip');
    if (!user) {
      throw new Error();
    }

    // Update user password
    await updateUserById(user.id, { password: newPassword }, 'skip');

    // Delete reset password tokens
    await Token.deleteMany({ user: user.id, type: tokenTypes.RESET_PASSWORD });

    // Update user's current user agent for tracking
    user.currentUserAgent = user.currentUserAgent;
    await user.save();

    // Send password update notification
    await sendPasswordUpdateNotification(user, ipAddress);

    return user;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Password reset failed');
  }
};

/**
 * Verify email
 * @param {string} verifyEmailToken
 * @returns {Promise<IUserDoc | null>}
 */
export const verifyEmail = async (verifyEmailToken: any): Promise<IUserDoc | null> => {
  try {
    const verifyEmailTokenDoc = await verifyToken(verifyEmailToken, tokenTypes.VERIFY_EMAIL);
    const user = await getUserById(new mongoose.Types.ObjectId(verifyEmailTokenDoc.user), 'skip');
    if (!user) {
      throw new Error();
    }
    await Token.deleteMany({ user: user.id, type: tokenTypes.VERIFY_EMAIL });
    const updatedUser = await updateUserById(user.id, { isEmailVerified: true }, 'skip');
    return updatedUser;
  } catch (error) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Email verification failed');
  }
};

/**
 * Change password for authenticated user
 * @param {string} userId - User ID
 * @param {string} currentPassword - Current password
 * @param {string} newPassword - New password
 * @param {string} [ipAddress=''] - IP address of the password change
 */
export const changePassword = async (userId, currentPassword, newPassword, ipAddress = '') => {
  const user = await getUserById(new mongoose.Types.ObjectId(userId), 'skip');
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user has a password set (OAuth users don't have passwords)
  if (!user.hasPassword) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Password change not available for OAuth-only accounts. Please set a password first.');
  }

  // Verify current password
  if (!(await user.isPasswordMatch(currentPassword))) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Current password is incorrect');
  }

  // Update password
  await updateUserById(user.id, { password: newPassword }, 'skip');

  // Send password update notification
  await sendPasswordUpdateNotification(user, ipAddress);
};

// Export other existing methods
export const loginUserWithEmailAndPassword = async (email, password) => {
  const user = await getUserByEmail(email);
  if (!user || !(await user.isPasswordMatch(password))) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'Incorrect email or password');
  }
  return user;
};
