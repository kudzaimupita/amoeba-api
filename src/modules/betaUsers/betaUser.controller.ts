/* eslint-disable prettier/prettier */
/* eslint-disable import/prefer-default-export */

import { Request, Response } from 'express';

import httpStatus from 'http-status';
import { ApiError } from '../../utils/errors';
import { betaUserService } from './betaUser.service';
import catchAsync from '../catchAsync';

export const betaUserController = {
  /**
   * Add user to waitlist
   */
  addToWaitlist: catchAsync(async (req: Request, res: Response) => {
    const { email, firstName, lastName, company, source } = req.body;

    const waitlistUser = await betaUserService.addToWaitlist({
      email,
      firstName,
      lastName,
      company,
      source,
    });

    res.status(httpStatus.CREATED).json({
      success: true,
      message: 'Successfully added to waitlist',
      data: waitlistUser,
    });
  }),

  /**
   * Get waitlist with pagination and filters
   */
  getWaitlist: catchAsync(async (req: Request, res: Response) => {
    const { 
      page = 1, 
      limit = 50, 
      sortBy = 'waitlistPosition', 
      sortOrder = 'asc' 
    } = req.query;

    const result = await betaUserService.getWaitlist({
      page: Number(page),
      limit: Number(limit),
      sortBy: String(sortBy),
      sortOrder: sortOrder as 'asc' | 'desc',
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  }),

  /**
   * Get whitelisted users
   */
  getWhitelistedUsers: catchAsync(async (req: Request, res: Response) => {
    const { page = 1, limit = 50 } = req.query;

    const result = await betaUserService.getWhitelistedUsers({
      page: Number(page),
      limit: Number(limit),
    });

    res.status(httpStatus.OK).json({
      success: true,
      data: result.users,
      pagination: result.pagination,
    });
  }),

  /**
   * Whitelist a user
   */
  whitelistUser: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;
    const { invitedBy, notes } = req.body;

    const user = await betaUserService.whitelistUser(email, invitedBy, notes);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'User successfully whitelisted',
      data: user,
    });
  }),

  /**
   * Remove user from whitelist
   */
  removeFromWhitelist: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;

    const user = await betaUserService.removeFromWhitelist(email);

    res.status(httpStatus.OK).json({
      success: true,
      message: 'User removed from whitelist',
      data: user,
    });
  }),

  /**
   * Delete user from waitlist/whitelist
   */
  deleteUser: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;

    const deleted = await betaUserService.deleteUser(email);

    if (!deleted) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    res.status(httpStatus.OK).json({
      success: true,
      message: 'User successfully deleted',
    });
  }),

  /**
   * Get waitlist statistics
   */
  getWaitlistStats: catchAsync(async (req: Request, res: Response) => {
    const stats = await betaUserService.getWaitlistStats();

    res.status(httpStatus.OK).json({
      success: true,
      data: stats,
    });
  }),

  /**
   * Check if email is whitelisted (public endpoint)
   */
  checkWhitelistStatus: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.params;

    const isWhitelisted = await betaUserService.isEmailWhitelisted(email);

    res.status(httpStatus.OK).json({
      success: true,
      data: {
        email,
        isWhitelisted,
      },
    });
  }),

  /**
   * Test early access welcome email (for testing purposes)
   */
  testEarlyAccessEmail: catchAsync(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      throw new ApiError(httpStatus.BAD_REQUEST, 'Email is required');
    }

    // Test the early access welcome email
    await betaUserService.whitelistUser(email, 'admin-test', 'Test early access email');

    res.status(httpStatus.OK).json({
      success: true,
      message: 'Test early access email sent successfully',
    });
  }),

  // Legacy methods for backward compatibility
  async createBetaUser(req: Request, res: Response) {
    try {
      const { email, firstName, lastName, company, source } = req.body;

      const newBetaUser = await betaUserService.addToWaitlist({
        email,
        firstName,
        lastName,
        company,
        source,
      });

      res.status(httpStatus.CREATED).json({
        success: true,
        message: 'Beta user registered successfully',
        data: newBetaUser,
      });
    } catch (error) {
      res.status(httpStatus.BAD_REQUEST).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error registering beta user',
      });
    }
  },

  async getBetaUsers(req: Request, res: Response) {
    try {
      const { page = 1, limit = 50 } = req.query;

      const result = await betaUserService.getWaitlist({
        page: Number(page),
        limit: Number(limit),
      });

      res.status(httpStatus.OK).json({
        success: true,
        data: result.users,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: error instanceof Error ? error.message : 'Error fetching beta users',
      });
    }
  },
};
