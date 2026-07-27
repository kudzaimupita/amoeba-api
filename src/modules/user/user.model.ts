import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import validator from 'validator';

import { IUserDoc, IUserModel } from './user.interfaces';
import paginate from '../../utils/paginate/paginate';
import { roles } from '../../config/roles';
import toJSON from '../../utils/toJSON/toJSON';

const userSchema = new mongoose.Schema<IUserDoc, IUserModel>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    isTopUpNotified: Boolean,
    topUpNotificationDate: Date,
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      validate(value: string) {
        if (!validator.isEmail(value)) {
          throw new Error('Invalid email');
        }
      },
    },
    password: {
      type: String,
      required: false, // Make optional for OAuth users
      trim: true,
      minlength: 8,
      validate(value: string) {
        if (value && (!value.match(/\d/) || !value.match(/[a-zA-Z]/))) {
          throw new Error('Password must contain at least one letter and one number');
        }
      },
      private: true, // used by the toJSON plugin
    },
    // OAuth provider information
    oauthProviders: [
      {
        provider: {
          type: String,
          enum: ['google', 'github', 'figma', 'claude'],
          required: true,
        },
        providerId: {
          type: String,
          required: true,
        },
        email: String,
        name: String,
        username: String,
        avatarUrl: String,
        profileUrl: String,
        linkedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Service tokens for external integrations (Figma MCP, Claude API).
    // Separate from oauthProviders which handles login authentication.
    serviceTokens: {
      figma: {
        accessToken: { type: String },
        refreshToken: { type: String },
        expiresAt: { type: Date },
        userId: { type: String },
        connectedAt: { type: Date },
      },
      claude: {
        apiKey: { type: String },
        connectedAt: { type: Date },
      },
      atlassian: {
        accessToken: { type: String },
        refreshToken: { type: String },
        expiresAt: { type: Date },
        cloudId: { type: String },
        connectedAt: { type: Date },
      },
    },
    hasPassword: {
      type: Boolean,
      default: false,
    },
    role: {
      type: String,
      enum: roles,
      default: 'user',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isBoarded: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
    },
    company: {
      type: mongoose.Schema.ObjectId,
      ref: 'Company',
    },
    status: {
      type: String,
      default: 'active',
      enum: ['active', 'inActive', 'deactivated', 'deleted'],
    },
    permissions: [
      {
        type: String,
      },
    ],
    isOrgSetup: {
      type: Boolean,
      default: false,
    },
    isSystemUser: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDeactivated: {
      type: Boolean,
      default: false,
    },

    lastLogin: {
      type: Date,
      // default: false,
    },
    lastLoginIP: {
      type: String,
    },
    currentUserAgent: {
      type: String,
    },
    lastUserAgent: {
      type: String,
    },
    loginCount: {
      type: Number,
      default: 0,
      // default: false,
    },
    currentTokens: {
      type: Number,
      default: 0,
      // default: false,
    },
    acceptedInvitation: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);
userSchema.plugin(paginate);

/**
 * Check if email is taken
 * @param {string} email - The user's email
 * @param {ObjectId} [excludeUserId] - The id of the user to be excluded
 * @returns {Promise<boolean>}
 */
userSchema.static('isEmailTaken', async function (email: string, excludeUserId: mongoose.ObjectId): Promise<boolean> {
  const user = await this.findOne({ email, _id: { $ne: excludeUserId } });
  return !!user;
});

/**
 * Check if password matches the user's password
 * @param {string} password
 * @returns {Promise<boolean>}
 */
userSchema.method('isPasswordMatch', async function (password: string): Promise<boolean> {
  const user = this;
  if (!user.password) return false;
  return bcrypt.compare(password, user.password);
});

/**
 * Check if user has OAuth provider
 * @param {string} provider - The OAuth provider (google, github)
 * @returns {boolean}
 */
userSchema.method('hasOAuthProvider', function (provider: string): boolean {
  const user = this;
  return user.oauthProviders?.some((p) => p.provider === provider) || false;
});

/**
 * Add OAuth provider to user
 * @param {object} providerData - OAuth provider data
 * @returns {Promise<void>}
 */
userSchema.method('addOAuthProvider', function (providerData: any) {
  const user = this;
  if (!user.oauthProviders) {
    user.oauthProviders = [];
  }

  // Remove existing provider of same type
  user.oauthProviders = user.oauthProviders.filter((p) => p.provider !== providerData.provider);

  // Add new provider
  user.oauthProviders.push({
    ...providerData,
    linkedAt: new Date(),
  });
});

userSchema.pre('save', async function (next) {
  const user = this;

  // Update hasPassword field
  user.hasPassword = !!user.password;

  // Hash password if it exists and is modified
  if (user.isModified('password') && user.password) {
    user.password = await bcrypt.hash(user.password, 8);
  }

  // Auto-verify email for OAuth users if email matches OAuth email
  if (user.oauthProviders && user.oauthProviders.length > 0) {
    const oauthEmail = user.oauthProviders.find((p) => p.email === user.email);
    if (oauthEmail && !user.isEmailVerified) {
      user.isEmailVerified = true;
    }
  }

  next();
});
userSchema.index({ email: 1 }); // already unique, but adding index explicitly for clarity
userSchema.index({ company: 1 }); // to speed up queries by company
userSchema.index({ email: 1, company: 1 }); // compound index for email+company filters
userSchema.index({ role: 1 }); // optional: if you filter users by role
userSchema.index({ status: 1 }); // optional: if you often filter by status

const User = mongoose.model<IUserDoc, IUserModel>('User', userSchema);

export default User;
