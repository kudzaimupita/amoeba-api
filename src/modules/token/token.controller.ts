import { Request, Response } from 'express';
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { catchAsync, pick } from '../../utils';
import ApiError from '../../utils/errors/ApiError';
import { IOptions } from '../../utils/paginate/paginate';
import * as tokenService from './token.service';
import { activityLogService } from '../activityLogs';

/**
 * Query tokens with pagination
 */
export const getTokens = catchAsync(async (req: Request, res: Response) => {
  const filter = pick(req.query, ['user', 'type', 'blacklisted']);
  const options: IOptions = pick(req.query, ['sortBy', 'limit', 'page', 'projectBy']);

  // Add company filter for non-admin users
  // if (!req.user?.permissions?.includes('admin')) {
  //   filter.company = req.user?.company?._id;
  // }

  // Convert user ID to ObjectId if provided
  if (filter.user) {
    filter.user = new mongoose.Types.ObjectId(filter.user as string);
  }

  const result = await tokenService.queryTokens(filter, options);

  // Log activity
  await activityLogService.createActivityLog({
    actionBy: req.user?._id,
    resourceType: 'TOKEN',
    company: req.user?.company?._id,
    actionType: 'READ',
    description: `${req.user?.name} queried tokens with filters: ${JSON.stringify(filter)}`,
    status: 'SUCCESS',
    statusCode: 200,
  });

  res.status(httpStatus.OK).json({
    success: true,
    data: result,
    message: 'Tokens retrieved successfully'
  });
});

/**
 * Get single token by ID
 */
export const getToken = catchAsync(async (req: Request, res: Response) => {
  const { tokenId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(tokenId)) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Invalid token ID');
  }

  const token = await tokenService.getTokenById(tokenId);

  if (!token) {
    throw new ApiError(httpStatus.NOT_FOUND, 'Token not found');
  }

  // Check access permissions (admin or token owner)
  if (!req.user?.permissions?.includes('admin') && token.user !== req.user?.id) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Access denied');
  }

  res.status(httpStatus.OK).json({
    success: true,
    data: token,
    message: 'Token retrieved successfully'
  });
});

/**
 * Blacklist multiple tokens
 */
export const blacklistTokens = catchAsync(async (req: Request, res: Response) => {
  const { tokenIds } = req.body;

  if (!Array.isArray(tokenIds) || tokenIds.length === 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Token IDs array is required');
  }

  // Validate all token IDs
  const invalidIds = tokenIds.filter(id => !mongoose.Types.ObjectId.isValid(id));
  if (invalidIds.length > 0) {
    throw new ApiError(httpStatus.BAD_REQUEST, `Invalid token IDs: ${invalidIds.join(', ')}`);
  }

  try {
    const result = await tokenService.blacklistTokens(tokenIds);

    // Log activity
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'UPDATE',
      description: `${req.user?.name} blacklisted ${tokenIds.length} tokens`,
      status: 'SUCCESS',
      statusCode: 200,
      additionalInfo: { tokenIds, modifiedCount: result.modifiedCount }
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        modifiedCount: result.modifiedCount,
        blacklistedTokens: tokenIds
      },
      message: `Successfully blacklisted ${result.modifiedCount} tokens`
    });
  } catch (error: any) {
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'UPDATE',
      description: `Failed to blacklist tokens: ${error.message}`,
      status: 'FAILED',
      statusCode: 500,
    });

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to blacklist tokens: ${error.message}`);
  }
});

/**
 * Delete multiple tokens based on filter
 */
export const deleteManyTokens = catchAsync(async (req: Request, res: Response) => {
  const { filter } = req.body;

  if (!filter || typeof filter !== 'object') {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Filter object is required');
  }

  // Add safety restrictions for non-admin users
  if (!req.user?.permissions?.includes('admin')) {
    // Non-admin users can only delete their own tokens
    filter.user = req.user?.id;
    // And only certain types
    if (!filter.type || !['REFRESH', 'RESET_PASSWORD', 'VERIFY_EMAIL', 'PIN'].includes(filter.type)) {
      throw new ApiError(httpStatus.FORBIDDEN, 'Invalid token type for deletion');
    }
  }

  try {
    // Count tokens before deletion for logging
    const tokensToDelete = await tokenService.queryTokens(filter, { limit: 1000 });
    const tokenCount = tokensToDelete.totalResults;

    if (tokenCount === 0) {
      return res.status(httpStatus.OK).json({
        success: true,
        data: { deletedCount: 0 },
        message: 'No tokens found matching the filter'
      });
    }

    const result = await tokenService.deleteManyTokens(filter);

    // Log activity
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'DELETE',
      description: `${req.user?.name} deleted ${tokenCount} tokens with filter: ${JSON.stringify(filter)}`,
      status: 'SUCCESS',
      statusCode: 200,
      additionalInfo: { filter, deletedCount: tokenCount }
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        deletedCount: tokenCount,
        filter
      },
      message: `Successfully deleted ${tokenCount} tokens`
    });
  } catch (error: any) {
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'DELETE',
      description: `Failed to delete tokens: ${error.message}`,
      status: 'FAILED',
      statusCode: 500,
    });

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to delete tokens: ${error.message}`);
  }
});

/**
 * Clean up expired tokens (admin only)
 */
export const cleanupExpiredTokens = catchAsync(async (req: Request, res: Response) => {
  // Only admins can perform cleanup
  if (!req.user?.permissions?.includes('admin')) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
  }

  try {
    const expiredFilter = {
      expires: { $lt: new Date() }
    };

    const expiredTokens = await tokenService.queryTokens(expiredFilter, { limit: 1000 });
    const expiredCount = expiredTokens.totalResults;

    if (expiredCount === 0) {
      return res.status(httpStatus.OK).json({
        success: true,
        data: { deletedCount: 0 },
        message: 'No expired tokens found'
      });
    }

    await tokenService.deleteManyTokens(expiredFilter);

    // Log activity
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'DELETE',
      description: `${req.user?.name} cleaned up ${expiredCount} expired tokens`,
      status: 'SUCCESS',
      statusCode: 200,
      additionalInfo: { deletedCount: expiredCount }
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: { deletedCount: expiredCount },
      message: `Successfully cleaned up ${expiredCount} expired tokens`
    });
  } catch (error: any) {
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'DELETE',
      description: `Failed to cleanup expired tokens: ${error.message}`,
      status: 'FAILED',
      statusCode: 500,
    });

    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to cleanup expired tokens: ${error.message}`);
  }
});

/**
 * Get token statistics (admin only)
 */
export const getTokenStats = catchAsync(async (req: Request, res: Response) => {
  // Only admins can view stats
  if (!req.user?.permissions?.includes('admin')) {
    throw new ApiError(httpStatus.FORBIDDEN, 'Admin access required');
  }

  try {
    const stats = {
      totalTokens: 0,
      activeTokens: 0,
      blacklistedTokens: 0,
      expiredTokens: 0,
      byType: {} as Record<string, number>,
      byUser: {} as Record<string, number>
    };

    // Get all tokens for analysis
    const allTokens = await tokenService.queryTokens({}, { limit: 10000 });
    stats.totalTokens = allTokens.totalResults;

    const now = new Date();

    allTokens.results.forEach((token: any) => {
      // Count by status
      if (token.blacklisted) {
        stats.blacklistedTokens++;
      } else if (token.expires < now) {
        stats.expiredTokens++;
      } else {
        stats.activeTokens++;
      }

      // Count by type
      stats.byType[token.type] = (stats.byType[token.type] || 0) + 1;

      // Count by user
      const userId = token.user.toString();
      stats.byUser[userId] = (stats.byUser[userId] || 0) + 1;
    });

    // Log activity
    await activityLogService.createActivityLog({
      actionBy: req.user?._id,
      resourceType: 'TOKEN',
      company: req.user?.company?._id,
      actionType: 'READ',
      description: `${req.user?.name} viewed token statistics`,
      status: 'SUCCESS',
      statusCode: 200,
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: stats,
      message: 'Token statistics retrieved successfully'
    });
  } catch (error: any) {
    throw new ApiError(httpStatus.INTERNAL_SERVER_ERROR, `Failed to get token statistics: ${error.message}`);
  }
});