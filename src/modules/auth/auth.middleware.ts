import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import passport from 'passport';

// @ts-nocheck
import ApiError from '../../utils/errors/ApiError';
import { IUserDoc } from '../user/user.interfaces';
import { Token } from '../token';
import { activityLogService } from '../activityLogs';
import { companyService } from '../company';
import * as apiKeyService from '../apiKeys/apiKey.service';
import * as workspaceService from '../workspace/workspace.service';
import { roleCanPerform } from '../workspace/workspace.constants';

// @ts-nocheck
/* eslint-disable prettier/prettier */
/* eslint-disable import/prefer-default-export */
export const checkPermission = (operationType: string, resource: string, permissions: string[] = []): boolean => {
  const permissionKey: string = `${operationType}-${resource}`;

  const hasGlobalAdmin = permissions.includes('admin-global');
  const hasResourceAdmin = permissions.includes(`admin-${resource}`);
  const hasSpecificPermission = permissions.includes(permissionKey);

  return hasGlobalAdmin || hasResourceAdmin || hasSpecificPermission;
};

const resolveWorkspaceContext = async (req: Request, user: IUserDoc, refreshTokenDoc: any) => {
  const workspaceId = await workspaceService.resolveActiveWorkspaceId(user.id, {
    jwtWorkspaceId: (user as any).jwtWorkspaceId,
    headerWorkspaceId: (req.headers['x-workspace-id'] || req.headers.workspaceid || req.headers.companyid) as string,
    refreshTokenWorkspaceId: refreshTokenDoc?.workspace,
    legacyCompanyId: user.company?._id?.toString() ?? user.company?.toString(),
  });

  const membership = await workspaceService.requireMembership(user.id, workspaceId);
  const company = await companyService.getCompanyById(workspaceId as any);

  if (!company) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Workspace not found');
  }

  if (company?.billing?.accountDeactivated) {
    throw new ApiError(httpStatus.LOCKED, 'Account Locked, please update your payment details');
  }

  req.user = user;
  req.user.company = company;
  (req as any).activeWorkspaceId = workspaceId;
  (req as any).workspaceMembership = membership;
  req.user.permissions = req.user.permissions || [];
  req.user.isSystemUser = membership.role === 'owner' || membership.role === 'admin';
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

      const refreshToken = await Token.findOne({ token: req.headers.refreshtoken });

      if (refreshToken?.blacklisted || !refreshToken) {
        activityLogService.createActivityLog({
          actionBy: user?._id,
          resourceType: 'USER',
          company: user?.company?._id,
          actionType: 'SECURITY_WARNING',
          description: `Error invalid session at ${new Date()}`,
          status: 'FAILURE',
          statusCode: httpStatus.FORBIDDEN,
        });
        return reject(new ApiError(httpStatus.UNAUTHORIZED, 'Session token is blacklisted'));
      }

      try {
        await resolveWorkspaceContext(req, user, refreshToken);
      } catch (error) {
        return reject(error);
      }

      if (type && resource) {
        const membership = (req as any).workspaceMembership;
        const isApiKeyAuth = Boolean((req.user as any)?.isApiKeyAuth);

        if (!isApiKeyAuth && membership && !roleCanPerform(membership.role, type)) {
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

        if (
          !isApiKeyAuth &&
          !membership &&
          !req.user.isSystemUser &&
          !checkPermission(type, resource, req.user.permissions || [])
        ) {
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
  if (req.method === 'OPTIONS') {
    return next();
  }

  const apiKey = (req.headers['x-api-key'] as string) || (req.query.api_key as string);
  if (apiKey) {
    try {
      const keyDoc = await apiKeyService.validateApiKey(apiKey);

      if (!keyDoc) {
        return next(new ApiError(httpStatus.UNAUTHORIZED, 'Invalid or expired API key'));
      }

      const clientIp = req.ip || req.socket.remoteAddress || '';
      if (!apiKeyService.isIpAllowed(keyDoc, clientIp)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'IP address not allowed'));
      }

      if (type && !apiKeyService.isOperationAllowed(keyDoc.permission, type)) {
        return next(new ApiError(httpStatus.FORBIDDEN, 'Readonly API key cannot perform this action'));
      }

      (req as any).apiKey = keyDoc;
      req.user = {
        company: keyDoc.company,
        _id: keyDoc.createdBy,
        isApiKeyAuth: true,
        apiKeyPermission: keyDoc.permission,
      } as any;
      (req as any).activeWorkspaceId = keyDoc.company?._id?.toString() ?? keyDoc.company?.toString();

      apiKeyService.updateLastUsed(keyDoc._id).catch(() => {});

      return next();
    } catch (error) {
      return next(new ApiError(httpStatus.UNAUTHORIZED, 'API key authentication failed'));
    }
  }

  return new Promise<void>((resolve, reject) => {
    passport.authenticate('jwt', { session: false }, verifyCallback(req, resolve, reject, type, resource))(req, res, next);
  })
    .then(() => next())
    .catch((err) => {
      next(err);
    });
};

export default authMiddleware;
