// @ts-nocheck
import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';

import * as authService from './auth.service';
// import { pay } from '../company/payStackService';
import { User, userService } from '../user';
import { companyService } from '../company';
/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import { tokenService, tokenTypes } from '../token';

import ApiError from '../../utils/errors/ApiError';
import { IUserDoc } from '../user/user.interfaces';
import SendNotification from '../comms/internal';
import { activityLogService } from '../activityLogs';
import catchAsync from '../catchAsync';
import { createCustomer } from '../company/payStackService';
import generatePin from '../../utils/generatePin';
import { generateSessionConfig } from './helpers';
import { getUserById } from '../user/user.service';
import config from '../../config/config';
import { otpTemplate } from './templates/otp';
import resetPasswordTemplate from './templates/resetPassword';
import { betaUserService } from '../betaUsers/betaUser.service';
import loginNotificationTemplate from './templates/loginNotification';
import * as workspaceService from '../workspace/workspace.service';
import { extractWorkspaceId } from '../workspace/workspace.utils';
import * as recoveryCodeService from '../account/recoveryCode.service';

const templateId = '3yxj6lj661q4do2r';
// const notifier = new SendNotification(config.mailerSendKey,);
const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

const getRefreshTokenFromRequest = (req: Request): string | undefined =>
  (req.headers.refreshtoken || req.headers['refresh-token'] || req.headers.RefreshToken) as string | undefined;

// Helper function to get client IP address
const getClientIpAddress = (req) =>
  req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';

const sendOtpOrFail = async (email: string, pin: number, name: string) => {
  try {
    await notifier.sendOTP('6481be1fe0d0d1b39a05b474', email, pin, name, otpTemplate);
  } catch (error) {
    if (config.env === 'production') {
      throw new ApiError(httpStatus.BAD_GATEWAY, 'Unable to send verification email');
    }
  }
};

export const requestRegister = catchAsync(async (req: Request, res: Response) => {
  // Check if beta whitelisting is enabled
  if (config.betaWhitelistEnabled) {
    const isWhitelisted = await betaUserService.isEmailWhitelisted(req.body.email);
    if (!isWhitelisted) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Beta access required. Please join our waitlist.');
    }
  }

  const userPayload = {
    ...req.body,
    acceptedInvitation: false,
    isSystemUser: true,
    status: 'active',
    permissions: ['SYSTEM_USER'],
    isBoarded: false,
    currentTokens: 0, // 250000
  };

  // Create the user in your system
  const user = await userService.createUser(userPayload);

  // Create a customer in Paystack
  let paystackCustomer;
  try {
    paystackCustomer = await createCustomer(
      user.email,
      user.name.split(' ')[0] || '', // First name (or empty string if not available)
      user.name.split(' ').slice(1).join(' ') || '', // Last name (or empty string if not available),
      '' // user.phone || '' // Phone (or empty string if not available)
    );
  } catch (error) {
    // Continue even if Paystack customer creation fails
    // You might want to add retry logic or handle this differently
  }

  // Create the company with the Paystack customer ID if available
  const company = await companyService.createCompany({
    name: `${user.name} Workspace`,
    systemUser: user._id,
    billing: {
      plan: 'free',
      paystackCustomerId: paystackCustomer?.data?.customer_code || null,
      paystackCustomerData: paystackCustomer?.data || null,
    },
  });

  await workspaceService.createOwnerMembership(user._id, company._id);

  const newUser = (await getUserById(user._id, company._id.toString())) as IUserDoc;

  // Bypass OTP for test email
  if (config.testEmail && req.body.email === config.testEmail) {
    await userService.updateUserById(new ObjectId(user._id), { acceptedInvitation: true, currentTokens: 1000000 }, 'skip');
    const workspaceId = extractWorkspaceId(newUser) ?? company._id.toString();
    const tokens = await tokenService.generateAuthTokens(newUser, 48, generateSessionConfig(req, 'registration'), workspaceId, 0, 'hours', undefined, undefined, workspaceId);
    return res.status(200).send({ user: { ...newUser.toObject(), password: '' }, tokens, bypassed: true });
  }

  const pin = generatePin(6);
  const workspaceId = extractWorkspaceId(newUser) ?? company._id.toString();
  const tokens = await tokenService.generateAuthTokens(newUser, 5, generateSessionConfig(req, 'registration'), workspaceId, pin, 'minutes', undefined, undefined, workspaceId);

  await sendOtpOrFail(user.email, pin, user.name);

  res.status(200).send({ tokenId: String(tokens.pin.token) });
});
export const requestLogin = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;

  // Get client IP address
  const ipAddress = getClientIpAddress(req);

  // Bypass password + OTP for test email
  if (config.testEmail && email === config.testEmail) {
    const user: any = await userService.getUserByEmail(email);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    const tokens = await tokenService.generateAuthTokens(
      user._doc || user,
      48,
      generateSessionConfig(req, 'test_bypass'),
      user._doc?.company?.id || user?.company?.id,
      0,
      'hours',
      undefined,
      undefined,
      user._doc?.lastActiveWorkspace?.toString() || user?.lastActiveWorkspace?.toString() || user._doc?.company?.id || user?.company?.id
    );
    return res.status(200).send({ user: { ...(user._doc || user), password: '' }, tokens, bypassed: true });
  }

  const user = (await authService.loginUser(email, password, ipAddress)) as IUserDoc;
  await tokenService.deleteManyTokens({ user: new ObjectId(user._id), type: tokenTypes.PIN });
  const pin = generatePin(6);

  const tokens = await tokenService.generateAuthTokens(
    user,
    5,
    generateSessionConfig(req, 'email'),
    user?.company?.id,
    pin,
    'minutes'
  );

  await sendOtpOrFail(user.email, pin, user.name);

  res.status(200).send({ tokenId: String(tokens.pin.token) });
});

export const resendLoginRequest = catchAsync(async (req: Request, res: Response) => {
  const { docId } = req.body;
  if (!mongoose.isValidObjectId(docId)) {
    console.error('Invalid resend login token id:', {
      docId,
      bodyKeys: Object.keys(req.body || {}),
    });
    throw new ApiError(401, 'Invalid token id', true, '', 'AUTH_OTP_EXPIRED');
  }

  const tokenResult = await tokenService.getTokenById(docId);
  if (!tokenResult) {
    console.error('Resend login token not found:', {
      docId,
      bodyKeys: Object.keys(req.body || {}),
    });
    throw new ApiError(401, 'Invalid token id', true, '', 'AUTH_OTP_EXPIRED');
  }
  const expiresDate = new Date(tokenResult.expires);
  const currentDate = new Date();

  if (expiresDate < currentDate) {
    console.error('Resend login token expired:', {
      docId,
      expires: tokenResult.expires,
      now: currentDate,
    });
    throw new ApiError(401, 'Verification code expired', true, '', 'AUTH_OTP_EXPIRED');
  }

  // const user = await userService.getUserById(tokenResult?.user?._id, 'skip');
  const user: any = await userService.getUserById(new mongoose.Types.ObjectId(tokenResult.user), 'skip');
  if (!user._doc) {
    console.error('Resend login token user not found:', {
      docId,
      userId: tokenResult.user,
    });
    throw new ApiError(401, 'Invalid token', true, '', 'AUTH_OTP_EXPIRED');
  }

  await tokenService.deleteManyTokens({ user: new ObjectId(user._doc._id), type: 'pin' });
  const pin = generatePin(6);
  const tokens = await tokenService.generateAuthTokens(
    user,
    5,
    generateSessionConfig(req, 'resend_otp'),
    user?.company?.id,
    pin,
    'minutes'
  );

  await sendOtpOrFail(user._doc.email, pin, user._doc.name);

  res.status(200).send({ tokenId: String(tokens.pin.token) });
});

export const confirmLogin = catchAsync(async (req: Request, res: Response) => {
  const { pin, docId, recoveryCode } = req.body;

  if (!mongoose.isValidObjectId(docId)) {
    throw new ApiError(401, 'Invalid token id', true, '', 'AUTH_OTP_EXPIRED');
  }

  const tokenResult: any | null = await tokenService.getTokenById(docId);
  if (!tokenResult) {
    throw new ApiError(401, 'Invalid token id', true, '', 'AUTH_OTP_EXPIRED');
  }

  const expiresDate = new Date(tokenResult.expires);
  const currentDate = new Date();

  if (expiresDate < currentDate) {
    throw new ApiError(400, 'Verification code expired', true, '', 'AUTH_OTP_EXPIRED');
  }

  const user: any = await userService.getUserById(new mongoose.Types.ObjectId(tokenResult.user), 'skip');
  if (!user._doc) {
    throw new ApiError(401, 'Invalid token', true, '', 'AUTH_OTP_EXPIRED');
  }

  if (recoveryCode) {
    await recoveryCodeService.verifyAndConsumeRecoveryCode(user._id, recoveryCode);
  } else if (tokenResult.pin !== pin * 1) {
    throw new ApiError(401, 'Invalid OTP pin', true, '', 'AUTH_OTP_INVALID');
  }

  // Get client IP address
  const ipAddress =
    req.ip || req.connection.remoteAddress || req.socket.remoteAddress || req.headers['x-forwarded-for'] || '127.0.0.1';

  const tokens = await tokenService.generateAuthTokens(
    user._doc,
    user.company?.tokenExpire,
    generateSessionConfig(req, 'otp_verified'),
    extractWorkspaceId(user._doc) ?? extractWorkspaceId(user),
    0,
    undefined,
    undefined,
    undefined,
    extractWorkspaceId(user._doc) ?? extractWorkspaceId(user)
  );
  await activityLogService.createActivityLog({
    actionBy: user?._doc._id,
    resourceType: 'USER',
    company: user?._doc.company?._id,
    actionType: 'LOGIN',
    description: `${user?._doc.name} signed in at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });
  await tokenService.deleteManyTokens({ user: new ObjectId(user._id), type: tokenTypes.PIN });

  // Update last login details
  await User.updateOne(
    { _id: new ObjectId(user._id), company: new ObjectId(user.company?.id) },
    {
      $set: {
        lastLogin: new Date(),
        lastLoginIP: ipAddress,
        lastUserAgent: user._doc.currentUserAgent,
        currentUserAgent: req.headers['user-agent'] || 'Unknown',
      },
      $inc: { loginCount: 1 },
    }
  );

  // Send login notification email
  try {
    const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

    // Detect location using geoip
    let geoip;
    let useragent;
    try {
      geoip = require('geoip-lite');
      useragent = require('useragent');
    } catch (error) {
      console.warn('geoip-lite or useragent not available:', error);
    }

    // Improve location detection for local/development environments
    let location = 'Unknown Location';
    let deviceInfo = 'Unknown Device';
    let browserInfo = 'Unknown Browser';
    let osInfo = 'Unknown OS';

    // Check if IP is localhost or IPv6 localhost
    const localIpPatterns = ['127.0.0.1', '::1', '0.0.0.0', 'localhost'];
    const isLocalIp = localIpPatterns.some(pattern => ipAddress.includes(pattern));

    if (isLocalIp) {
      location = 'Local Development Environment';

      // Detect OS and device details for local environment
      if (useragent) {
        const userAgentString = req.headers['user-agent'] || '';
        const agent = useragent.parse(userAgentString);

        // Improve local environment detection
        const osFamily = agent?.os?.family || 'Unknown';
        const osVersion = agent?.os?.major || '';
        deviceInfo = osFamily !== 'Other' && osFamily !== 'Unknown' ? osFamily : 'Development Machine';
        osInfo = osFamily !== 'Other' && osFamily !== 'Unknown' ? 
          (osVersion ? `${osFamily} ${osVersion}` : osFamily) : 'Unknown OS';

        // Improved browser detection
        const browserFamily = agent?.browser?.family || 'Unknown';
        const browserMajor = agent?.browser?.major;
        if (browserFamily !== 'Other' && browserFamily !== 'Unknown') {
          browserInfo = browserMajor ? `${browserFamily} ${browserMajor}` : browserFamily;
        } else {
          browserInfo = 'Unknown Browser';
        }
      }
    } else {
      // Existing geoip logic for non-local IPs
      if (geoip) {
        const geo = geoip.lookup(ipAddress);
        if (geo) {
          location = `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`;
        }
      }

      // Detect device and browser details
      if (useragent) {
        const agent = useragent.parse(req.headers['user-agent'] || '');

        // Device detection
        const deviceFamily = agent?.device?.family || 'Other';
        const osFamily = agent?.os?.family || 'Unknown';
        deviceInfo = deviceFamily !== 'Other' ? deviceFamily : (osFamily !== 'Other' ? osFamily : 'Unknown Device');

        // Browser detection with proper handling of undefined values
        const browserFamily = agent?.browser?.family || 'Unknown';
        const browserMajor = agent?.browser?.major;
        if (browserFamily !== 'Other' && browserFamily !== 'Unknown') {
          browserInfo = browserMajor ? `${browserFamily} ${browserMajor}` : browserFamily;
        } else {
          browserInfo = 'Unknown Browser';
        }

        // OS detection with proper handling of undefined values
        const osMajor = agent?.os?.major;
        if (osFamily !== 'Other' && osFamily !== 'Unknown') {
          osInfo = osMajor ? `${osFamily} ${osMajor}` : osFamily;
        } else {
          osInfo = 'Unknown OS';
        }
      }
    }

    // Prepare email parameters with fallbacks
    const emailParams = {
      userName: user._doc.name || 'User',
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
      deviceType: deviceInfo?.trim() || 'Unknown Device',
      browser: browserInfo?.trim() || 'Unknown Browser',
      operatingSystem: osInfo?.trim() || 'Unknown OS',
    };

    await notifier.sendLoginNotificationEmail(user._doc.email, user._doc.name, loginNotificationTemplate, emailParams);
  } catch (error) {
    console.error('Failed to send login notification:', error);
    // Fail silently to not interrupt login flow
  }

  res.status(200).send({ user: { ...user._doc, password: '' }, tokens });
});

export const confirmRegister = catchAsync(async (req: Request, res: Response) => {
  const { pin, docId } = req.body;
  if (!mongoose.isValidObjectId(docId)) {
    throw new ApiError(401, 'Invalid token id');
  }
  const tokenResult = await tokenService.getTokenById(docId);
  if (!tokenResult) {
    throw new ApiError(401, 'Invalid token id');
  }
  const expiresDate = new Date(tokenResult.expires);
  const currentDate = new Date();

  if (expiresDate < currentDate) {
    throw new ApiError(401, 'Invalid token id');
  }

  const user: any = await userService.getUserById(new mongoose.Types.ObjectId(tokenResult.user), 'skip');
  if (!user._doc) {
    throw new ApiError(401, 'Invalid token');
  }

  if (tokenResult?.pin !== pin * 1) {
    throw new ApiError(401, 'Invalid OTP pin ');
  }

  // await companyService.updateCompanyById(new ObjectId(user?._doc.company?.id), );

  const workspaceId = extractWorkspaceId(user._doc) ?? extractWorkspaceId(user);
  const tokens = await tokenService.generateAuthTokens(
    user._doc,
    user._doc.company?.tokenExpire,
    generateSessionConfig(req, 'oauth'),
    workspaceId,
    0,
    undefined,
    undefined,
    undefined,
    workspaceId
  );

  await userService.updateUserById(new ObjectId(user?._id), { acceptedInvitation: true }, 'skip');
  await tokenService.deleteManyTokens({ user: new ObjectId(user._id), type: 'pin' });

  // Give new users 4 million tokens as a welcome bonus
  await userService.updateUserById(new ObjectId(user?._id), { currentTokens: 1000000 }, 'skip');

  await activityLogService.createActivityLog({
    actionBy: user._doc?._id,
    resourceType: 'USER',
    company: user?._doc.company?._id,
    actionType: 'LOGIN',
    description: `${user?._doc.name} registered account and created company at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });
  res.status(200).send({ user: { ...user._doc, password: '' }, tokens });
});
export const me = catchAsync(async (req: Request, res: Response) => {
  if (!mongoose.isValidObjectId(req.user?.id)) {
    throw new ApiError(401, 'Invalid user');
  }

  const user: any = await userService.getUserById(new mongoose.Types.ObjectId(req.user?.id), 'skip');

  res.status(200).send({ user });
});
export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  // Get client IP address
  const ipAddress = getClientIpAddress(req);

  const user = await authService.resetPassword(req.query.token, req.body.password, ipAddress);
  await userService.updateUserById(user._id, { acceptedInvitation: true }, user?.company?._id);
  await activityLogService.createActivityLog({
    actionBy: user?._id,
    resourceType: 'USER',
    company: user?.company?._id,
    actionType: 'UPDATE',
    description: `${user.name} reset password at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });
  res.status(httpStatus.NO_CONTENT).send();
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  const user = await userService.getUserByEmail(req.body.email);
  const resetPasswordToken = await tokenService.generateResetPasswordToken(
    req.body.email,
    generateSessionConfig(req, 'reset_password'),
    user?.company?.id,
    '5'
  );

  notifier.sendPasswordResetNotification(
    '6481be1fe0d0d1b39a05b474',
    req.body.email,
    `${config.clientUrl}/reset-password?token=${resetPasswordToken}`,
    'hi@servly.app',
    resetPasswordTemplate
  );

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Logout user (blacklist current session)
 */
export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required in headers.refreshtoken');
  }

  await authService.logout(refreshToken);

  // Log activity
  await activityLogService.createActivityLog({
    actionBy: req.user?._id,
    resourceType: 'USER',
    company: req.user?.company?._id,
    actionType: 'LOGOUT',
    description: `User logged out at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Logout all sessions (blacklist all user tokens)
 */
export const logoutAllSessions = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required');
  }

  await authService.logoutAllSessions(refreshToken);

  // Log activity
  await activityLogService.createActivityLog({
    actionBy: req.user?._id,
    resourceType: 'USER',
    company: req.user?.company?._id,
    actionType: 'LOGOUT_ALL_SESSIONS',
    description: `User logged out of all sessions at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Refresh access token using a valid refresh token (rotates refresh token)
 */
export const refreshTokens = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);

  if (!refreshToken) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Refresh token is required in headers.refreshtoken');
  }

  const { tokens } = await authService.refreshAuth(refreshToken, generateSessionConfig(req, 'token_refresh'));

  res.status(httpStatus.OK).send({ tokens });
});

/**
 * OAuth callback handler
 */
export const oauthCallback = catchAsync(async (req: Request, res: Response) => {
  const user = req.user as IUserDoc;

  if (!user) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'OAuth authentication failed');
  }

  // Double-check beta whitelisting (defense in depth)
  if (config.betaWhitelistEnabled) {
    const isWhitelisted = await betaUserService.isEmailWhitelisted(user.email);
    if (!isWhitelisted) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Beta access required. Please join our waitlist.');
    }
  }

  // Get client IP address and user agent from request or attached to user object
  const ipAddress =
    (user as any).loginIpAddress ||
    req.ip ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.headers['x-forwarded-for'] ||
    '127.0.0.1';

  // Generate tokens for the user
  const sessionDetails = generateSessionConfig(req, 'oauth');
  const tokens = await tokenService.generateAuthTokens(
    user,
    48, // 48 hours duration
    sessionDetails,
    user.company,
    0, // No PIN for OAuth
    'hours'
  );

  // Create activity log
  await activityLogService.createActivityLog({
    userId: user._id,
    resourceId: user._id,
    company: user.company,
    actionType: 'LOGIN',
    resourceType: 'USER',
    description: `User logged in via OAuth`,
    status: 'SUCCESS',
    additionalInfo: {
      provider: user.oauthProviders?.[user.oauthProviders.length - 1]?.provider,
      loginType: 'oauth',
      timestamp: new Date(),
    },
  });

  // Send login notification email
  try {
    const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

    // Detect location using geoip
    let geoip;
    let useragent;
    try {
      geoip = require('geoip-lite');
      useragent = require('useragent');
    } catch (error) {
      console.warn('geoip-lite or useragent not available:', error);
    }

    // Improve location detection for local/development environments
    let location = 'Unknown Location';
    let deviceInfo = 'Unknown Device';
    let browserInfo = 'Unknown Browser';
    let osInfo = 'Unknown OS';

    // Check if IP is localhost or IPv6 localhost
    const localIpPatterns = ['127.0.0.1', '::1', '0.0.0.0', 'localhost'];

    if (localIpPatterns.includes(ipAddress)) {
      location = 'Local Development Environment';

      // Detect OS and device details for local environment
      const userAgentString = (user as any).loginUserAgent || req.headers['user-agent'] || '';
      const agent = useragent.parse(userAgentString);

      // Improve local environment detection
      deviceInfo = agent?.os?.family || 'Development Machine';
      osInfo = agent?.os?.family && agent?.os?.version ? `${agent?.os?.family} ${agent?.os?.version}` : 'Windows';

      browserInfo =
        agent?.browser?.family !== 'Other' ? `${agent?.browser?.family} ${agent?.browser?.major || ''}` : 'Local Browser';
    } else {
      // Existing geoip logic for non-local IPs
      const geo = geoip.lookup(ipAddress);
      if (geo) {
        location = `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}`;
      }

      // Detect device and browser details
      const userAgentString = (user as any).loginUserAgent || req.headers['user-agent'] || '';
      const agent = useragent.parse(userAgentString);

      deviceInfo = agent?.device?.family !== 'Other' ? agent?.device?.family : agent?.os?.family || 'Unknown Device';

      browserInfo =
        agent?.browser?.family !== 'Other' ? `${agent?.browser?.family} ${agent?.browser?.major || ''}` : 'Unknown Browser';

      osInfo = agent?.os?.family !== 'Other' ? `${agent?.os?.family} ${agent?.os?.major || ''}` : 'Unknown OS';
    }

    // Prepare email parameters
    const emailParams = {
      userName: user.name,
      loginTime: new Date().toLocaleString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      ipAddress,
      location,
      deviceType: deviceInfo.trim(),
      browser: browserInfo.trim(),
      operatingSystem: osInfo.trim(),
    };

    await notifier.sendLoginNotificationEmail(user.email, user.name, loginNotificationTemplate, emailParams);
  } catch (error) {
    console.error('Failed to send OAuth login notification:', error);
    // Fail silently to not interrupt login flow
  }

  // Redirect to frontend with tokens
  const clientUrl = config.clientUrl || 'http://localhost:5173';
  const fullUser = { ...user.toObject(), password: '' }; // Get full user object without password
  const redirectUrl = `${clientUrl}/auth/callback?token=${tokens.access.token}&refresh=${
    tokens.refresh.token
  }&user=${encodeURIComponent(JSON.stringify(fullUser))}`;

  res.redirect(redirectUrl);
});

/**
 * Link OAuth provider to existing account
 */
export const linkOAuthProvider = catchAsync(async (req: Request, res: Response) => {
  const { provider, code } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  if (!['google', 'github'].includes(provider)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid OAuth provider');
  }

  // TODO: Implement OAuth token exchange with code
  // This would typically involve exchanging the auth code for user profile data
  // For now, we'll assume the frontend has already handled OAuth and sends user data

  res.status(httpStatus.OK).json({
    message: 'OAuth provider linked successfully',
  });
});

/**
 * Unlink OAuth provider from account
 */
export const unlinkOAuthProvider = catchAsync(async (req: Request, res: Response) => {
  const { provider } = req.params;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  // Check if user has password or other OAuth providers before unlinking
  const { hasPassword } = user;
  const otherProviders = user.oauthProviders?.filter((p) => p.provider !== provider) || [];

  if (!hasPassword && otherProviders.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Cannot unlink the only authentication method');
  }

  // Remove the OAuth provider
  user.oauthProviders = otherProviders;
  await user.save();

  res.status(httpStatus.OK).json({
    message: 'OAuth provider unlinked successfully',
  });
});

/**
 * Get linked OAuth providers for current user
 */
export const getLinkedProviders = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const linkedProviders =
    user.oauthProviders?.map((p) => ({
      provider: p.provider,
      email: p.email,
      name: p.name,
      linkedAt: p.linkedAt,
    })) || [];

  res.status(httpStatus.OK).json({
    hasPassword: user.hasPassword,
    linkedProviders,
  });
});

// ---------------------------------------------------------------------------
// Figma OAuth — service linking (not login)
// Used by the Figma plugin to connect the user's Figma account for MCP integration.
// ---------------------------------------------------------------------------

/**
 * Initiate Figma OAuth flow.
 * Returns an authorization URL that the plugin opens in a new browser tab.
 */
export const initiateFigmaOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const { clientId, callbackUrl } = config.oauth.figma;
  if (!clientId) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Figma OAuth is not configured');
  }

  // Generate a state parameter that encodes the user ID for the callback
  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');

  const authUrl =
    `https://www.figma.com/oauth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `scope=files:read&` +
    `state=${encodeURIComponent(state)}&` +
    `response_type=code`;

  res.status(httpStatus.OK).json({ authUrl });
});

/**
 * Figma OAuth callback.
 * Exchanges the authorization code for tokens and stores them on the user record.
 * Serves a simple HTML page telling the user to close the tab.
 */
export const figmaOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing code or state parameter');
  }

  // Decode state to get userId
  let stateData: { userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString());
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid state parameter');
  }

  const { clientId, clientSecret, callbackUrl } = config.oauth.figma;

  // Exchange code for tokens via Figma API
  const tokenResponse = await fetch('https://api.figma.com/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: callbackUrl,
      code: code as string,
      grant_type: 'authorization_code',
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('[Figma OAuth] Token exchange failed:', errorText);
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to exchange Figma authorization code');
  }

  const tokenData = await tokenResponse.json();

  // Get Figma user info
  let figmaUserId: string | undefined;
  try {
    const meResponse = await fetch('https://api.figma.com/v1/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (meResponse.ok) {
      const meData = await meResponse.json();
      figmaUserId = meData.id;
    }
  } catch {
    // Non-critical — continue without Figma user ID
  }

  // Store tokens on user record
  await User.updateOne(
    { _id: stateData.userId },
    {
      $set: {
        'serviceTokens.figma': {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + (tokenData.expires_in || 7776000) * 1000),
          userId: figmaUserId,
          connectedAt: new Date(),
        },
      },
    }
  );

  // Serve a simple success page
  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head><title>Figma Connected</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: white;">
        <div style="text-align: center;">
          <h2>Figma Connected</h2>
          <p style="color: rgba(255,255,255,0.6);">You can close this tab and return to the Figma plugin.</p>
        </div>
      </body>
    </html>
  `);
});

/**
 * Get Figma OAuth connection status.
 */
export const getFigmaOAuthStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await User.findById(userId).select('serviceTokens.figma');
  const figma = (user as any)?.serviceTokens?.figma;

  res.status(httpStatus.OK).json({
    connected: !!(figma?.accessToken),
    userId: figma?.userId || undefined,
    connectedAt: figma?.connectedAt || undefined,
  });
});

/**
 * Disconnect Figma OAuth.
 */
export const disconnectFigmaOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  await User.updateOne(
    { _id: userId },
    { $unset: { 'serviceTokens.figma': 1 } }
  );

  res.status(httpStatus.NO_CONTENT).send();
});

// ---------------------------------------------------------------------------
// Claude API — service linking
// Stores a Claude API key for the user (for MCP-powered code generation).
// ---------------------------------------------------------------------------

/**
 * Initiate Claude connection.
 * Claude doesn't use OAuth — the backend uses its own API key (CLAUDE_API).
 * This endpoint marks the user as connected if the server has Claude configured.
 */
export const initiateClaudeOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const hasClaudeApi = !!config.claudeApi;

  if (hasClaudeApi) {
    await User.updateOne(
      { _id: userId },
      {
        $set: {
          'serviceTokens.claude': {
            apiKey: 'backend-managed',
            connectedAt: new Date(),
          },
        },
      }
    );
  }

  res.status(httpStatus.OK).json({
    authUrl: null,
    connected: hasClaudeApi,
    message: hasClaudeApi
      ? 'Claude AI is configured on the server. Connection established.'
      : 'Claude API key is not configured on the server. Contact your admin.',
  });
});

/**
 * Get Claude connection status.
 */
export const getClaudeOAuthStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await User.findById(userId).select('serviceTokens.claude');
  const claude = (user as any)?.serviceTokens?.claude;
  const hasClaudeApi = !!config.claudeApi;

  res.status(httpStatus.OK).json({
    connected: !!(claude?.apiKey) && hasClaudeApi,
    connectedAt: claude?.connectedAt || undefined,
  });
});

/**
 * Disconnect Claude.
 */
export const disconnectClaudeOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  await User.updateOne(
    { _id: userId },
    { $unset: { 'serviceTokens.claude': 1 } }
  );

  res.status(httpStatus.NO_CONTENT).send();
});

// ---------------------------------------------------------------------------
// Atlassian — service linking (OAuth 2.0 3LO)
// Stores Atlassian tokens for Confluence integration.
// ---------------------------------------------------------------------------

const ATLASSIAN_AUTH_BASE = 'https://auth.atlassian.com';
const ATLASSIAN_TOKEN_URL = `${ATLASSIAN_AUTH_BASE}/oauth/token`;
const ATLASSIAN_RESOURCES_URL = 'https://api.atlassian.com/oauth/token/accessible-resources';

/**
 * Initiate Atlassian OAuth flow.
 * Returns an authorization URL that the client opens in a new browser tab.
 */
export const initiateAtlassianOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const { clientId, callbackUrl } = config.oauth.atlassian;
  if (!clientId) {
    throw new ApiError(httpStatus.SERVICE_UNAVAILABLE, 'Atlassian OAuth is not configured');
  }

  const state = Buffer.from(JSON.stringify({ userId, ts: Date.now() })).toString('base64url');

  const scopes = [
    // Granular scopes required by Confluence v2 API
    'read:page:confluence',
    'write:page:confluence',
    'read:space:confluence',
    'write:space:confluence',
    'read:content:confluence',
    'write:content:confluence',
    'read:content.metadata:confluence',
    // Classic scopes for v1 API compatibility
    'read:confluence-space.summary',
    'write:confluence-space',
    'read:confluence-content.all',
    'read:confluence-content.summary',
    'write:confluence-content',
    'write:confluence-file',
    'read:confluence-user',
    // Refresh token support
    'offline_access',
  ];

  const authUrl =
    `${ATLASSIAN_AUTH_BASE}/authorize?` +
    `audience=api.atlassian.com&` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `scope=${encodeURIComponent(scopes.join(' '))}&` +
    `redirect_uri=${encodeURIComponent(callbackUrl)}&` +
    `state=${encodeURIComponent(state)}&` +
    `response_type=code&` +
    `prompt=consent`;

  res.status(httpStatus.OK).json({ authUrl });
});

/**
 * Atlassian OAuth callback.
 * Exchanges the authorization code for tokens, fetches the cloud ID,
 * and stores everything on the user record.
 */
export const atlassianOAuthCallback = catchAsync(async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Missing code or state parameter');
  }

  let stateData: { userId: string };
  try {
    stateData = JSON.parse(Buffer.from(state as string, 'base64url').toString());
  } catch {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid state parameter');
  }

  const { clientId, clientSecret, callbackUrl } = config.oauth.atlassian;

  // Exchange code for tokens
  const tokenResponse = await fetch(ATLASSIAN_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'authorization_code',
      client_id: clientId,
      client_secret: clientSecret,
      code: code as string,
      redirect_uri: callbackUrl,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('[Atlassian OAuth] Token exchange failed:', errorText);
    throw new ApiError(httpStatus.BAD_GATEWAY, 'Failed to exchange Atlassian authorization code');
  }

  const tokenData = await tokenResponse.json();

  // Fetch accessible resources to get the cloud ID
  let cloudId: string | undefined;
  try {
    const resourcesResponse = await fetch(ATLASSIAN_RESOURCES_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}`, Accept: 'application/json' },
    });
    if (resourcesResponse.ok) {
      const resources = await resourcesResponse.json();
      if (resources.length > 0) {
        cloudId = resources[0].id;
      }
    }
  } catch {
    console.error('[Atlassian OAuth] Failed to fetch accessible resources');
  }

  if (!cloudId) {
    throw new ApiError(httpStatus.BAD_GATEWAY, 'No accessible Atlassian site found. Ensure you have a Confluence instance.');
  }

  // Store tokens on user record
  await User.updateOne(
    { _id: stateData.userId },
    {
      $set: {
        'serviceTokens.atlassian': {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(Date.now() + (tokenData.expires_in || 3600) * 1000),
          cloudId,
          connectedAt: new Date(),
        },
      },
    }
  );

  res.status(200).send(`
    <!DOCTYPE html>
    <html>
      <head><title>Atlassian Connected</title></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #1a1a2e; color: white;">
        <div style="text-align: center;">
          <h2>Atlassian Connected</h2>
          <p style="color: rgba(255,255,255,0.6);">You can close this tab and return to the app.</p>
        </div>
      </body>
    </html>
  `);
});

/**
 * Get Atlassian OAuth connection status.
 */
export const getAtlassianOAuthStatus = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  const user = await User.findById(userId).select('serviceTokens.atlassian');
  const atlassian = (user as any)?.serviceTokens?.atlassian;

  res.status(httpStatus.OK).json({
    connected: !!(atlassian?.accessToken),
    cloudId: atlassian?.cloudId || undefined,
    connectedAt: atlassian?.connectedAt || undefined,
  });
});

/**
 * Disconnect Atlassian OAuth.
 */
export const disconnectAtlassianOAuth = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user?.id;
  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  await User.updateOne(
    { _id: userId },
    { $unset: { 'serviceTokens.atlassian': 1 } }
  );

  res.status(httpStatus.NO_CONTENT).send();
});

/**
 * Change password for authenticated user
 */
export const changePassword = catchAsync(async (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    throw new ApiError(httpStatus.UNAUTHORIZED, 'User not authenticated');
  }

  // Get client IP address
  const ipAddress = getClientIpAddress(req);

  // Change password using auth service
  await authService.changePassword(userId, currentPassword, newPassword, ipAddress);

  // Log activity
  await activityLogService.createActivityLog({
    actionBy: userId,
    resourceType: 'USER',
    company: req.user?.company,
    actionType: 'UPDATE',
    description: `Password changed at ${new Date()}`,
    status: 'SUCCESS',
    statusCode: 200,
  });

  res.status(httpStatus.NO_CONTENT).send();
});
