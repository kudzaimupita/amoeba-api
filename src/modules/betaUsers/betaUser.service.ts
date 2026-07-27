/* eslint-disable prettier/prettier */

import httpStatus from 'http-status';

import { BetaUser, IBetaUser } from './betaUser.model';
import { ApiError } from '../../utils/errors';
import SendNotification from '../comms/internal';
import config from '../../config/config';
import { earlyAccessTemplate } from '../auth/templates/earlyAccess';

export const betaUserService = {
  /**
   * Check if email is whitelisted for beta access
   * Supports both individual email whitelisting and domain whitelisting
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  async isEmailWhitelisted(email: string): Promise<boolean> {
    const normalizedEmail = email.toLowerCase();
    const emailDomain = normalizedEmail.split('@')[1];

    // Whitelisted domains - students from these domains are auto-approved
    const whitelistedDomains = [
      'virtualwindow.co.za',
      'ycombinator.com'
    ];

    // Check if email domain is whitelisted
    if (whitelistedDomains.includes(emailDomain)) {
      return true;
    }

    // Check if individual email is whitelisted in database
    const betaUser = await BetaUser.findOne({
      email: normalizedEmail,
      isWhitelisted: true
    });
    return !!betaUser;
  },

  /**
   * Add email to waitlist
   * @param {Partial<IBetaUser>} userData - User data for waitlist
   * @returns {Promise<IBetaUser>}
   */
  async addToWaitlist(userData: Partial<IBetaUser>): Promise<IBetaUser> {
    const { email, firstName, lastName, company, source } = userData;

    // Check if user already exists
    const existingUser = await BetaUser.findOne({ email: email?.toLowerCase() });
    if (existingUser) {
      throw new ApiError(httpStatus.CONFLICT, 'Email already registered');
    }

    // Get next waitlist position
    const lastPosition = await BetaUser.findOne(
      { waitlistPosition: { $exists: true } },
      {},
      { sort: { waitlistPosition: -1 } }
    );
    const nextPosition = (lastPosition?.waitlistPosition || 0) + 1;

    // Create new waitlist entry
    const newWaitlistUser = new BetaUser({
      email: email?.toLowerCase(),
      firstName,
      lastName,
      company,
      source,
      isWhitelisted: false,
      waitlistPosition: nextPosition,
      waitlistJoinedAt: new Date(),
    });

    await newWaitlistUser.save();
    return newWaitlistUser;
  },

  /**
   * Get all waitlist users with pagination
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async getWaitlist(options: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const {
      page = 1,
      limit = 50,
      sortBy = 'waitlistPosition',
      sortOrder = 'asc'
    } = options;

    const skip = (page - 1) * limit;
    const sort: { [key: string]: 1 | -1 } = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [users, total] = await Promise.all([
      BetaUser.find({})
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      BetaUser.countDocuments({})
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get whitelisted users
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>}
   */
  async getWhitelistedUsers(options: {
    page?: number;
    limit?: number;
  } = {}) {
    const { page = 1, limit = 50 } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      BetaUser.find({ isWhitelisted: true })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BetaUser.countDocuments({ isWhitelisted: true })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Whitelist a user by email
   * @param {string} email - User email
   * @param {string} invitedBy - Who invited the user
   * @param {string} notes - Optional notes
   * @returns {Promise<IBetaUser>}
   */
  async whitelistUser(email: string, invitedBy?: string, notes?: string): Promise<IBetaUser> {
    const user = await BetaUser.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        isWhitelisted: true,
        invitedBy,
        notes,
        updatedAt: new Date(),
      },
      { new: true, upsert: true }
    );

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    // Send welcome email to the newly whitelisted user
    try {
      const notifier = new SendNotification(config.mailerSendKey, 'noreply@servly.app', 'Servly');
      
      // Extract user name (firstName + lastName or email username)
      let userName: string;
      if (user.firstName && user.lastName) {
        userName = `${user.firstName} ${user.lastName}`;
      } else if (user.firstName) {
        userName = user.firstName;
      } else {
        [userName] = user.email.split('@');
      }

      // Process the template with user data
      const htmlContent = notifier.processTemplate(earlyAccessTemplate, {
        user_name: userName,
      });

      // Send the early access welcome email
      await notifier.sendEmail(
        user.email,
        userName,
        'Welcome to Servly Early Access! 🎉',
        htmlContent
      );

    } catch (emailError) {
      // Don't throw error for email failure - user is still whitelisted
    }

    return user;
  },

  /**
   * Remove user from whitelist
   * @param {string} email - User email
   * @returns {Promise<IBetaUser>}
   */
  async removeFromWhitelist(email: string): Promise<IBetaUser> {
    const user = await BetaUser.findOneAndUpdate(
      { email: email.toLowerCase() },
      {
        isWhitelisted: false,
        updatedAt: new Date(),
      },
      { new: true }
    );

    if (!user) {
      throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
    }

    return user;
  },

  /**
   * Delete user from waitlist/whitelist
   * @param {string} email - User email
   * @returns {Promise<boolean>}
   */
  async deleteUser(email: string): Promise<boolean> {
    const result = await BetaUser.deleteOne({ email: email.toLowerCase() });
    return result.deletedCount > 0;
  },

  /**
   * Get waitlist statistics
   * @returns {Promise<Object>}
   */
  async getWaitlistStats() {
    const [
      totalWaitlist,
      totalWhitelisted,
      recentSignups,
      topCompanies
    ] = await Promise.all([
      BetaUser.countDocuments({}),
      BetaUser.countDocuments({ isWhitelisted: true }),
      BetaUser.countDocuments({
        waitlistJoinedAt: {
          $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
        }
      }),
      BetaUser.aggregate([
        { $match: { company: { $exists: true, $ne: '' } } },
        { $group: { _id: '$company', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    return {
      totalWaitlist,
      totalWhitelisted,
      pendingApproval: totalWaitlist - totalWhitelisted,
      recentSignups,
      topCompanies,
    };
  },
}; 