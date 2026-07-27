import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

// @ts-nocheck
import ApiError from '../../utils/errors/ApiError';
import { IUserDoc } from '../user/user.interfaces';
import { Token } from '../token';
import { activityLogService } from '../activityLogs';
import { companyService } from '../company';
// Import directly to avoid circular dependency
import * as apiKeyService from '../apiKeys/apiKey.service';

// @ts-nocheck
/* eslint-disable prettier/prettier */
/* eslint-disable import/prefer-default-export */
export const checkPermission = (operationType: string, resource: string, permissions: string[]): boolean => {
  const permissionKey: string = `${operationType}-${resource}`;

  // Check for admin permissions that bypass specific permission checks
  const hasGlobalAdmin = permissions.includes('admin-global');
  const hasResourceAdmin = permissions.includes(`admin-${resource}`);
  const hasSpecificPermission = permissions.includes(permissionKey);

  return hasGlobalAdmin || hasResourceAdmin || hasSpecificPermission;
};

const verifyCallback =
  (req: Request, resolve: any, reject: any, type?: string, resource?: string) =>
    async (err: Error, user: IUserDoc, info: string) => {

      if (err || info || !user) {

        activityLogService.createActivityLog({
          actionBy: req.user?._id,
          resourceType: 'USER',
          company: req?.user?.company?._id,
          actionType: 'SECURITY_WARNING',
          description: `Error invalid session at ${new Date()}`,
          status: 'FAILURE',
          statusCode: httpStatus.FORBIDDEN,
        });
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Please authenticate'));
      }
      req.user = user;

      const refreshToken = await Token.findOne({ token: req.headers.refreshtoken });

      // Only allow company switching for system admins with proper company ID
      if (req.user?.isSystemUser && req.headers.companyid) {
        const companyId = req.headers.companyid as any;

        const company = await companyService.getCompanyById(companyId);
        if (!company) {
          return reject(new ApiError(httpStatus.NOT_FOUND, 'Company not found'));
        }
        if (company && company?.billing?.accountDeactivated) {
          if (resource !== 'billing') {
            reject(new ApiError(httpStatus.LOCKED, 'Account Locked, please update your payment details'));
          }
        }
        req.user.company = company;
      } else {
        const company = await companyService.getCompanyById(req?.user?.company?._id);
        if (company && company?.billing?.accountDeactivated) {
          if (resource !== 'billing') {
            reject(new ApiError(httpStatus.LOCKED, 'Account Locked, please update your payment details'));
          }
        }
      }

      if (refreshToken?.blacklisted || !refreshToken) {
        activityLogService.createActivityLog({
          actionBy: req.user?._id,
          resourceType: 'USER',
          company: req?.user?.company?._id,
          actionType: 'SECURITY_WARNING',
          description: `Error invalid session at ${new Date()}`,
          status: 'FAILURE',
          statusCode: httpStatus.FORBIDDEN,
        });
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Session token is blacklisted'));
      }
      // Check permissions if type and resource are specified
      if (type && resource) {
        if (!req.user.isSystemUser && !checkPermission(type, resource, req.user.permissions || [])) {
          activityLogService.createActivityLog({
            actionBy: req.user?._id,
            resourceType: 'USER',
            company: req?.user?.company?._id,
            actionType: 'SECURITY_WARNING',
            description: `Permission denied for ${type}-${resource} at ${new Date()}`,
            status: 'FAILURE',
            statusCode: httpStatus.FORBIDDEN,
          });
          return reject(new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions'));
        }
      }

      resolve();
    };

const authMiddleware = (type?: string, resource?: string) => async (req: Request, res: Response, next: NextFunction) => {
  // Skip authentication for OPTIONS requests (CORS preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }

  // Check for API key authentication first
  const apiKey = req.headers['x-api-key'] as string || req.query.api_key as string;
  if (apiKey) {
    try {
      const keyDoc = await apiKeyService.validateApiKey(apiKey);

      if (!keyDoc) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired API key'));
      }

      // Check IP whitelist
      const clientIp = req.ip || req.socket.remoteAddress || '';
      if (!apiKeyService.isIpAllowed(keyDoc, clientIp)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'IP address not allowed'));
      }

      // Check permission level for operation
      if (type && !apiKeyService.isOperationAllowed(keyDoc.permission, type)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Readonly API key cannot perform this action'));
      }

      // Set request context with API key info
      (req as any).apiKey = keyDoc;
      req.user = {
        company: keyDoc.company,
        _id: keyDoc.createdBy,
        isApiKeyAuth: true,
        apiKeyPermission: keyDoc.permission,
      } as any;

      // Update last used timestamp (async, don't wait)
      apiKeyService.updateLastUsed(keyDoc._id).catch(() => { });

      return next();
    } catch (error) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key authentication failed'));
    }
  }

  // Fall back to JWT authentication
  return new Promise<void>((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, type, resource))(req, res, next);
  })
    .then(() => next())
    .catch((err) => {
      next(err);
    });
};

export default authMiddleware;
