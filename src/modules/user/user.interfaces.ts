/* eslint-disable import/no-extraneous-dependencies */
import mongoose, { Document, Model } from 'mongoose';
import { ObjectId } from 'mongodb';

import { AccessAndRefreshTokens } from '../token/token.interfaces';
import { QueryResult } from '../../utils/paginate/paginate';

export interface IOAuthProvider {
  provider: 'google' | 'github' | 'figma' | 'claude';
  providerId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  linkedAt: Date;
}

export interface IServiceTokens {
  figma?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    userId?: string;
    connectedAt?: Date;
  };
  claude?: {
    apiKey?: string;
    connectedAt?: Date;
  };
  atlassian?: {
    accessToken?: string;
    refreshToken?: string;
    expiresAt?: Date;
    cloudId?: string;
    connectedAt?: Date;
  };
}

export interface IUser {
  name: string;
  email: string;
  password?: string; // Make optional for OAuth users
  role: string;
  isEmailVerified: boolean;
  isBoarded: boolean;
  stripeCustomerId: string;
  company: any;
  isTopUpNotified: boolean;
  topUpNotificationDate: any;
  status: string;
  permissions: string[];
  isOrgSetup: boolean;
  isSystemUser: boolean;
  acceptedInvitation: boolean;
  isAdmin?: boolean;
  isDeactivated?: boolean;
  lastLogin?: Date;
  lastLoginIP?: string;
  currentUserAgent?: string;
  lastUserAgent?: string;
  loginCount?: number;
  currentTokens?: number;
  // OAuth fields
  oauthProviders?: IOAuthProvider[];
  hasPassword?: boolean; // Track if user has set a password
  // Service tokens for external integrations (Figma MCP, Claude API)
  serviceTokens?: IServiceTokens;
}
export interface GetUserFilter {
  _id: ObjectId;
  company?: ObjectId; // optional since it may not be present if 'skip' is passed
}

export interface IUserDoc extends IUser, Document {
  _doc: any;
  isPasswordMatch(password: string): Promise<boolean>;
  hasOAuthProvider(provider: string): boolean;
  addOAuthProvider(providerData: any): void;
}

export interface IUserModel extends Model<IUserDoc> {
  isEmailTaken(email: string, excludeUserId?: mongoose.Types.ObjectId): Promise<boolean>;
  paginate(filter: Record<string, any>, options: Record<string, any>): Promise<QueryResult>;
}

export type UpdateUserBody = Partial<IUser>;

export type RequestRegisterBody = Partial<IUser>;

export type NewRegisteredUser = Omit<IUser, 'role' | 'isEmailVerified'>;

export type NewCreatedUser = Omit<IUser, 'isEmailVerified'>;

export interface IUserWithTokens {
  user: IUserDoc;
  tokens: AccessAndRefreshTokens;
}

export interface TokenUsageAnalytics {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
  totalCost: number;
  dailyUsage: Array<{
    date: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    conversationCount: number;
    executionCount: number;
  }>;
  monthlyUsage: Array<{
    month: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    conversationCount: number;
    executionCount: number;
  }>;
  modelBreakdown: Array<{
    model: string;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    cost: number;
    usageCount: number;
  }>;
}

export interface ConversationAnalytics {
  totalConversations: number;
  activeConversations: number;
  completedConversations: number;
  failedConversations: number;
  averageConversationDuration: number;
  conversationsByApplication: Array<{
    applicationId: string;
    applicationName: string;
    conversationCount: number;
    successRate: number;
    averageDuration: number;
    totalTokens: number;
    lastActivity: Date;
  }>;
  conversationsByStatus: Array<{
    status: string;
    count: number;
    percentage: number;
  }>;
  recentConversations: Array<{
    conversationId: string;
    applicationName: string;
    status: string;
    createdAt: Date;
    duration: number;
    inputTokens: number;
    outputTokens: number;
    totalSteps: number;
  }>;
}

export interface ExecutionAnalytics {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  biggestExecutionMaps: Array<{
    conversationId: string;
    applicationName: string;
    totalSteps: number;
    executionTime: number;
    inputTokens: number;
    outputTokens: number;
    status: string;
    createdAt: Date;
    complexity: 'simple' | 'moderate' | 'complex' | 'very_complex';
  }>;
  executionsByType: Array<{
    stepType: string;
    count: number;
    successRate: number;
    averageTime: number;
    totalTokens: number;
  }>;
  performanceMetrics: {
    averageStepsPerExecution: number;
    averageTokensPerStep: number;
    mostUsedStepTypes: Array<{
      stepType: string;
      count: number;
      percentage: number;
    }>;
    peakUsageHours: Array<{
      hour: number;
      executionCount: number;
    }>;
  };
}

export interface ApplicationUsageStats {
  applicationId: string;
  applicationName: string;
  totalConversations: number;
  totalExecutions: number;
  totalTokens: number;
  averageTokensPerConversation: number;
  successRate: number;
  lastUsed: Date;
  createdAt: Date;
  totalCost: number;
  complexityDistribution: {
    simple: number;
    moderate: number;
    complex: number;
    very_complex: number;
  };
}

export interface UserAnalyticsDashboard {
  user: {
    userId: string;
    email: string;
    name: string;
    accountCreated: Date;
    lastActivity: Date;
    subscription: string;
  };
  tokenAnalytics: TokenUsageAnalytics;
  conversationAnalytics: ConversationAnalytics;
  executionAnalytics: ExecutionAnalytics;
  applicationStats: ApplicationUsageStats[];
  chartData: {
    dailyTokenUsage: Array<{
      date: string;
      tokens: number;
      cost: number;
    }>;
    conversationTrends: Array<{
      date: string;
      count: number;
      successRate: number;
    }>;
    executionPerformance: Array<{
      date: string;
      averageTime: number;
      successRate: number;
    }>;
    topApplications: Array<{
      name: string;
      usage: number;
      tokens: number;
    }>;
  };
  insights: {
    mostActiveDay: string;
    mostUsedApplication: string;
    averageSessionLength: number;
    costEfficiencyTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
    alerts: Array<{
      type: 'warning' | 'info' | 'success';
      message: string;
      actionRequired: boolean;
    }>;
  };
}

export interface AnalyticsFilters {
  dateRange?: {
    startDate: Date;
    endDate: Date;
  };
  applicationIds?: string[];
  timeGrouping?: 'hour' | 'day' | 'week' | 'month';
  includeFailedExecutions?: boolean;
  limit?: number;
  offset?: number;
}
