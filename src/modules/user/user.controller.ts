// @ts-nocheck
// import * as userService from './user.service';

import { Request, Response } from 'express';
import { ObjectId } from 'bson';
import generator from 'generate-password';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync, pick } from '../../utils';

import ApiError from '../../utils/errors/ApiError';
import { checkPermission } from '../auth/auth.middleware';
import { Company } from '../company';
import { IOptions } from '../../utils/paginate/paginate';
import SendNotification from '../comms/internal';
/* eslint-disable import/no-extraneous-dependencies */
import { tokenService } from '../token';
import { userService } from '.';
import config from '../../config/config';
import { inviteUserTemlate } from '../auth/templates/userInvitation';
import { getUserAnalyticsDashboard, getDetailedAnalyticsData } from './user.service';
import { AnalyticsFilters } from './user.interfaces';
// import { userService } from '.';

const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');

export const getAdminUsers = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('admin', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  const filter = pick(req.query, ['email', 'isSystemUser', 'isAdmin', 'isDeactivated']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  options.populate = 'company';
  const result = await userService.queryUsers({ ...filter }, options);
  res.send(result);
});

export const getUsers = catchAsync(async (req: Request, res: Response) => {
  const isApiKeyAuth = Boolean((req.user as any)?.isApiKeyAuth);

  if (
    !isApiKeyAuth &&
    !req.user.isSystemUser &&
    !checkPermission('readList', 'user', req.user.permissions || [])
  ) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  const filter = pick(req.query, ['name', 'email', 'isDeactivated']);

  if (filter?.email) {
    filter.email = { $regex: `.*${filter.email}.*`, $options: 'i' };
  }
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);
  const result = await userService.queryUsers({ ...filter, company: req.user?.company?._id }, options);
  res.send(result);
});

export const getUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('read', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  if (typeof req.params.userId === 'string') {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params.userId), req.user?.company?._id);
    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }
    res.send(user);
  }
});

export const updateUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('manage', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  if (typeof req.params.userId === 'string') {
    const oldUser = await userService.getUserById(new mongoose.Types.ObjectId(req.params.userId), req.user?.company?._id);

    // Only prevent certain updates for system users, but allow admin to deactivate them
    if (oldUser?.isSystemUser && !req.user?.permissions?.includes('admin')) {
      delete req.body?.permissions;
      delete req.body?.isSystemUser;
      delete req.body?.isDeactivated;
      delete req.body?.company;
      delete req.body?.isAdmin;
    }

    const user = await userService.updateUserById(
      new mongoose.Types.ObjectId(req.params.userId),
      req.body,
      req.user?.company?._id
    );
    res.send(user);
  }
});

export const deleteUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('manage', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  if (typeof req.params.userId === 'string') {
    await userService.deleteUserById(new mongoose.Types.ObjectId(req.params.userId), req.user?.company?._id);
    res.status(httpStatus.NO_CONTENT).send();
  }
});

/**
 * Fix user acceptance status for users who should have acceptedInvitation: true
 */
export const fixUserAcceptanceStatus = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('manage', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  if (typeof req.params.userId === 'string') {
    const user = await userService.getUserById(new mongoose.Types.ObjectId(req.params.userId), req.user?.company?._id);

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // If user is fully onboarded but acceptedInvitation is false, fix it
    if (!user.acceptedInvitation && user.isBoarded && user.isEmailVerified) {
      const updatedUser = await userService.updateUserById(
        new mongoose.Types.ObjectId(req.params.userId),
        { acceptedInvitation: true },
        req.user?.company?._id
      );

      res.status(httpStatus.OK).json({
        message: 'User acceptance status fixed successfully',
        user: updatedUser
      });
    } else {
      res.status(httpStatus.OK).json({
        message: 'User acceptance status is already correct',
        user
      });
    }
  }
});

export const inviteUser = catchAsync(async (req: Request, res: Response) => {
  if (!req.user.isSystemUser && !checkPermission('manage', 'user', req.user.permissions)) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Insufficient permissions');
  }
  const company = (await Company.findById(req.user?.company?._id)) as any;

  const password = generator.generate({
    length: 10,
    numbers: true,
    symbols: true,
    strict: true,
  });

  Object.assign(req.body, {
    password,
    acceptedInvitation: false,
    isOrgSetup: true,
    isBoarded: true,
    company: new ObjectId(company._id),
  });
  req.body.company = company._id;
  req.body.isSystemUser = false;

  req.body.isAdmin = false;

  req.body.isDeactivated = false;

  req.body.permissions = [
    'admin-global'
  ];
  // req.body.password = randomUUID();
  // req.body.company = company._id;

  const userExists = await userService.getUserByEmail(req.body.email);
  if (userExists) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email is taken');
  }
  const user = await userService.createUser(req.body);

  const resetPasswordToken = await tokenService.generateResetPasswordToken(req.body.email, {}, req.body.company, '5000');

  notifier.sendUserInviteEmail(
    '6481be1fe0d0d1b39a05b474', // Adjust as necessary
    req.body.email,
    `${config.clientUrl}/reset-password?token=${resetPasswordToken}`,
    company.name,
    req.body.name,
    inviteUserTemlate,
    req.user.email
  );

  res.status(201).send(user);
});

/**
 * Get comprehensive user analytics dashboard
 * GET /api/v1/users/analytics
 */
export const getAnalyticsDashboard = catchAsync(async (req: Request, res: Response) => {
  // Extract filters from query parameters
  const filters: AnalyticsFilters = {};

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  // Application filter
  if (req.query.applicationIds) {
    const appIds = Array.isArray(req.query.applicationIds)
      ? (req.query.applicationIds as string[])
      : [req.query.applicationIds as string];
    filters.applicationIds = appIds;
  }

  // Time grouping
  if (req.query.timeGrouping) {
    filters.timeGrouping = req.query.timeGrouping as 'hour' | 'day' | 'week' | 'month';
  }

  // Include failed executions
  if (req.query.includeFailedExecutions !== undefined) {
    filters.includeFailedExecutions = req.query.includeFailedExecutions === 'true';
  }

  // Pagination
  if (req.query.limit) {
    filters.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.offset) {
    filters.offset = parseInt(req.query.offset as string, 10);
  }

  // Get user ID from authenticated user
  const userId = req.user.id;

  try {
    const analytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: analytics,
      message: 'User analytics retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get analytics: ${error.message}`);
  }
});

/**
 * Get token usage analytics only
 * GET /api/v1/users/analytics/tokens
 */
export const getTokenAnalytics = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  const userId = req.user.id;

  try {
    const fullAnalytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        tokenAnalytics: fullAnalytics.tokenAnalytics,
        chartData: {
          dailyTokenUsage: fullAnalytics.chartData.dailyTokenUsage,
        },
      },
      message: 'Token analytics retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get token analytics: ${error.message}`);
  }
});

/**
 * Get conversation analytics only
 * GET /api/v1/users/analytics/conversations
 */
export const getConversationAnalytics = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  if (req.query.applicationIds) {
    const appIds = Array.isArray(req.query.applicationIds)
      ? (req.query.applicationIds as string[])
      : [req.query.applicationIds as string];
    filters.applicationIds = appIds;
  }

  const userId = req.user.id;

  try {
    const fullAnalytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        conversationAnalytics: fullAnalytics.conversationAnalytics,
        chartData: {
          conversationTrends: fullAnalytics.chartData.conversationTrends,
        },
      },
      message: 'Conversation analytics retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get conversation analytics: ${error.message}`);
  }
});

/**
 * Get execution analytics only
 * GET /api/v1/users/analytics/executions
 */
export const getExecutionAnalytics = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  if (req.query.includeFailedExecutions !== undefined) {
    filters.includeFailedExecutions = req.query.includeFailedExecutions === 'true';
  }

  const userId = req.user.id;

  try {
    const fullAnalytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        executionAnalytics: fullAnalytics.executionAnalytics,
        chartData: {
          executionPerformance: fullAnalytics.chartData.executionPerformance,
        },
      },
      message: 'Execution analytics retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get execution analytics: ${error.message}`);
  }
});

/**
 * Get application usage statistics
 * GET /api/v1/users/analytics/applications
 */
export const getApplicationStats = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  if (req.query.limit) {
    filters.limit = parseInt(req.query.limit as string, 10);
  }

  const userId = req.user.id;

  try {
    const fullAnalytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        applicationStats: fullAnalytics.applicationStats,
        chartData: {
          topApplications: fullAnalytics.chartData.topApplications,
        },
      },
      message: 'Application statistics retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get application stats: ${error.message}`);
  }
});

/**
 * Get user insights and recommendations
 * GET /api/v1/users/analytics/insights
 */
export const getInsights = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  const userId = req.user.id;

  try {
    const fullAnalytics = await getUserAnalyticsDashboard(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        insights: fullAnalytics.insights,
        summary: {
          totalConversations: fullAnalytics.conversationAnalytics.totalConversations,
          totalTokens: fullAnalytics.tokenAnalytics.totalTokens,
          totalCost: fullAnalytics.tokenAnalytics.totalCost,
          successRate:
            fullAnalytics.conversationAnalytics.totalConversations > 0
              ? (fullAnalytics.conversationAnalytics.completedConversations /
                  fullAnalytics.conversationAnalytics.totalConversations) *
                100
              : 0,
          mostUsedApp: fullAnalytics.insights.mostUsedApplication,
        },
      },
      message: 'User insights retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get insights: ${error.message}`);
  }
});

/**
 * Get detailed messages and execution steps data
 * GET /api/v1/users/analytics/detailed
 */
export const getDetailedAnalytics = catchAsync(async (req: Request, res: Response) => {
  const filters: AnalyticsFilters = {};

  // Date range filter
  if (req.query.startDate && req.query.endDate) {
    filters.dateRange = {
      startDate: new Date(req.query.startDate as string),
      endDate: new Date(req.query.endDate as string),
    };
  }

  // Application filter
  if (req.query.applicationIds) {
    const appIds = Array.isArray(req.query.applicationIds)
      ? (req.query.applicationIds as string[])
      : [req.query.applicationIds as string];
    filters.applicationIds = appIds;
  }

  // Pagination
  if (req.query.limit) {
    filters.limit = parseInt(req.query.limit as string, 10);
  }
  if (req.query.offset) {
    filters.offset = parseInt(req.query.offset as string, 10);
  }

  const userId = req.user.id;

  try {
    const detailedData = await getDetailedAnalyticsData(userId, filters);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        messages: detailedData.messages.slice(filters.offset || 0, (filters.offset || 0) + (filters.limit || 50)),
        executionSteps: detailedData.executionSteps.slice(
          filters.offset || 0,
          (filters.offset || 0) + (filters.limit || 50)
        ),
        summary: detailedData.summary,
        pagination: {
          totalMessages: detailedData.messages.length,
          totalExecutionSteps: detailedData.executionSteps.length,
          limit: filters.limit || 50,
          offset: filters.offset || 0,
          hasMoreMessages: (filters.offset || 0) + (filters.limit || 50) < detailedData.messages.length,
          hasMoreSteps: (filters.offset || 0) + (filters.limit || 50) < detailedData.executionSteps.length,
        },
      },
      message: 'Detailed analytics data retrieved successfully',
    });
  } catch (error) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get detailed analytics: ${error.message}`);
  }
});
