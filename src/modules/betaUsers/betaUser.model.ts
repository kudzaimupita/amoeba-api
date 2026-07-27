/* eslint-disable prettier/prettier */

import mongoose from 'mongoose';

export interface IBetaUser {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  source?: string;
  signupDate: Date;
  isVerified: boolean;
  isWhitelisted?: boolean;
  waitlistPosition?: number;
  waitlistJoinedAt?: Date;
  invitedBy?: string;
  notes?: string;
}

const betaUserSchema = new mongoose.Schema<IBetaUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    company: {
      type: String,
      trim: true,
    },
    source: {
      type: String,
      trim: true,
    },
    signupDate: {
      type: Date,
      default: Date.now,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    isWhitelisted: {
      type: Boolean,
      default: false,
    },
    waitlistPosition: {
      type: Number,
    },
    waitlistJoinedAt: {
      type: Date,
      default: Date.now,
    },
    invitedBy: {
      type: String,
      trim: true,
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

betaUserSchema.index({ email: 1 }, { unique: true });
betaUserSchema.index({ company: 1 });
betaUserSchema.index({ signupDate: -1 });
betaUserSchema.index({ isWhitelisted: 1 });
betaUserSchema.index({ waitlistPosition: 1 });
betaUserSchema.index({ waitlistJoinedAt: -1 });

export const BetaUser = mongoose.model<IBetaUser>('BetaUser', betaUserSchema);
