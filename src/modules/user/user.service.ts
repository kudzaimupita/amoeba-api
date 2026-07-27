/* eslint-disable no-console */
/* eslint-disable import/no-extraneous-dependencies */
import httpStatus from 'http-status';
import mongoose from 'mongoose';
import { ObjectId } from 'mongodb';
import User from './user.model';
import ApiError from '../../utils/errors/ApiError';
import { IOptions, QueryResult } from '../../utils/paginate/paginate';
import {
  NewCreatedUser,
  UpdateUserBody,
  IUserDoc,
  NewRegisteredUser,
  GetUserFilter,
  TokenUsageAnalytics,
  ConversationAnalytics,
  ExecutionAnalytics,
  ApplicationUsageStats,
  UserAnalyticsDashboard,
  AnalyticsFilters,
} from './user.interfaces';

const isDuplicateEmailError = (error: any): boolean =>
  error?.code === 11000 && (error?.keyPattern?.email || error?.keyValue?.email || error?.message?.includes('email_1'));

const duplicateEmailError = () =>
  new ApiError(httpStatus.BAD_REQUEST, 'An account with this email already exists. Please log in instead.');

/**
 * Create a user
 * @param {NewCreatedUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const createUser = async (userBody: NewCreatedUser): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email)) {
    throw duplicateEmailError();
  }

  try {
    return await User.create(userBody);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw duplicateEmailError();
    }
    throw error;
  }
};

/**
 * Register a user
 * @param {NewRegisteredUser} userBody
 * @returns {Promise<IUserDoc>}
 */
export const registerUser = async (userBody: NewRegisteredUser): Promise<IUserDoc> => {
  if (await User.isEmailTaken(userBody.email)) {
    throw duplicateEmailError();
  }

  try {
    return await User.create(userBody);
  } catch (error) {
    if (isDuplicateEmailError(error)) {
      throw duplicateEmailError();
    }
    throw error;
  }
};

/**
 * Query for users
 * @param {Object} filter - Mongo filter
 * @param {Object} options - Query options
 * @returns {Promise<QueryResult>}
 */
export const queryUsers = async (filter: Record<string, any>, options: IOptions): Promise<QueryResult> => {
  const users = await User.paginate(filter, options);
  return users;
};

/**
 * Get user by id
 * @param {mongoose.Types.ObjectId} id
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserById = async (id: mongoose.Types.ObjectId, company: string): Promise<IUserDoc | null> => {
  const filter: GetUserFilter = { _id: new ObjectId(id) };

  if (company !== 'skip') {
    filter.company = new ObjectId(company);
  }

  return User.findOne(filter).exec();
};

/**
 * Get user by email
 * @param {string} email
 * @returns {Promise<IUserDoc | null>}
 */
export const getUserByEmail = async (email: string): Promise<IUserDoc | null> => User.findOne({ email });

/**
 * Update user by id
 * @param {mongoose.Types.ObjectId} userId
 * @param {UpdateUserBody} updateBody
 * @returns {Promise<IUserDoc | null>}
 */
export const updateUserById = async (
  userId: mongoose.Types.ObjectId,
  updateBody: UpdateUserBody,
  company: string
): Promise<IUserDoc | null> => {
  const user = await getUserById(userId, company);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  if (updateBody.email && (await User.isEmailTaken(updateBody.email, userId))) {
    throw new ApiError(httpStatus.BAD_REQUEST, 'Email already taken');
  }

  Object.assign(user, updateBody);
  await user.save();
  return user;
};

/**
 * Deduct tokens from user's account for AI usage
 * @param {mongoose.Types.ObjectId} userId
 * @param {number} tokensUsed - Number of tokens to deduct
 * @param {string} usage - Description of what the tokens were used for
 * @returns {Promise<{ success: boolean, remainingTokens: number, message?: string }>}
 */
export const deductTokens = async (
  userId: mongoose.Types.ObjectId,
  tokensUsed: number,
  usage: string = 'AI operation'
): Promise<{ success: boolean; remainingTokens: number; message?: string }> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const currentTokens = user.currentTokens || 0;
  const newTokenBalance = currentTokens - tokensUsed;

  // Always deduct tokens, even if it results in negative balance
  // This allows users to complete tasks even if they run out of tokens mid-execution
  await User.findByIdAndUpdate(userId, { currentTokens: newTokenBalance });

  if (currentTokens < tokensUsed) {
    return {
      success: true, // Still return success but with warning message
      remainingTokens: newTokenBalance,
      message: `Insufficient tokens but operation completed. Required: ${tokensUsed}, Available: ${currentTokens}, New balance: ${newTokenBalance}`,
    };
  }

  return {
    success: true,
    remainingTokens: newTokenBalance,
  };
};

/**
 * Check if user has sufficient tokens for an operation
 * @param {mongoose.Types.ObjectId} userId
 * @param {number} tokensRequired
 * @returns {Promise<{ hasTokens: boolean, currentTokens: number }>}
 */
export const checkTokenBalance = async (
  userId: mongoose.Types.ObjectId,
  tokensRequired: number
): Promise<{ hasTokens: boolean; currentTokens: number }> => {
  const user = await User.findById(userId);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }

  const currentTokens = user.currentTokens || 0;
  return {
    hasTokens: currentTokens >= tokensRequired,
    currentTokens,
  };
};

/**
 * Delete user by id
 * @param {mongoose.Types.ObjectId} userId
 * @returns {Promise<IUserDoc | null>}
 */
export const deleteUserById = async (userId: mongoose.Types.ObjectId, company: string): Promise<IUserDoc | null> => {
  const user = await getUserById(userId, company);
  if (!user) {
    throw new ApiError(httpStatus.NOT_FOUND, 'User not found');
  }
  await user.deleteOne();
  return user;
};

/**
 * Get comprehensive user analytics dashboard
 */
export const getUserAnalyticsDashboard = async (
  userId: string,
  filters: AnalyticsFilters = {}
): Promise<UserAnalyticsDashboard> => {
  try {
    // Set default date range (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const dateRange = filters.dateRange || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    };

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get all user's conversations within date range
    const conversationQuery: any = {
      user: userId,
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
    };

    if (filters.applicationIds?.length) {
      conversationQuery.currentApplication = { $in: filters.applicationIds };
    }

    // Get conversations from MongoDB collection (not Mongoose model)
    const conversationsCollection = mongoose.connection.db.collection('conversations');
    const executionsCollection = mongoose.connection.db.collection('executions');

    const conversations = await conversationsCollection.find(conversationQuery).sort({ createdAt: -1 }).toArray();

    // Get executions for these conversations
    const conversationIds = conversations.map((conv) => conv._id);
    const executions = await executionsCollection
      .find({
        conversationId: { $in: conversationIds },
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Calculate analytics
    const tokenAnalytics = await calculateTokenAnalytics(conversations, executions, dateRange);
    const conversationAnalytics = await calculateConversationAnalytics(conversations, executions);
    const executionAnalytics = await calculateExecutionAnalytics(executions, conversations);
    const applicationStats = await calculateApplicationStats(userId, conversations, executions);
    const chartData = await generateChartData(conversations, executions, dateRange);
    const insights = await generateInsights(conversations, executions, tokenAnalytics);

    return {
      user: {
        userId: user._id.toString(),
        email: user.email,
        name: user.name,
        accountCreated: (user as any).createdAt || new Date(),
        lastActivity: conversations[0]?.createdAt || (user as any).updatedAt || new Date(),
        subscription: (user as any).subscription || 'free',
      },
      tokenAnalytics,
      conversationAnalytics,
      executionAnalytics,
      applicationStats,
      chartData,
      insights,
    };
  } catch (error) {
    throw new Error(`Failed to get user analytics: ${error.message}`);
  }
};

/**
 * Get detailed messages and execution data for comprehensive analytics
 */
export const getDetailedAnalyticsData = async (
  userId: string,
  filters: AnalyticsFilters = {}
): Promise<{
  messages: any[];
  executionSteps: any[];
  summary: {
    totalMessages: number;
    totalExecutionSteps: number;
    totalTokensFromMessages: number;
    totalTokensFromExecutions: number;
    totalCostFromMessages: number;
    totalCostFromExecutions: number;
  };
}> => {
  try {
    // Set default date range (last 30 days)
    const defaultEndDate = new Date();
    const defaultStartDate = new Date();
    defaultStartDate.setDate(defaultStartDate.getDate() - 30);

    const dateRange = filters.dateRange || {
      startDate: defaultStartDate,
      endDate: defaultEndDate,
    };

    // Get conversations and executions
    const conversationsCollection = mongoose.connection.db.collection('conversations');
    const executionsCollection = mongoose.connection.db.collection('executions');

    const conversationQuery: any = {
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: {
        $gte: dateRange.startDate,
        $lte: dateRange.endDate,
      },
    };

    const conversations = await conversationsCollection.find(conversationQuery).sort({ createdAt: -1 }).toArray();
    const conversationIds = conversations.map((conv) => conv._id);
    const executions = await executionsCollection
      .find({
        conversationId: { $in: conversationIds },
        createdAt: {
          $gte: dateRange.startDate,
          $lte: dateRange.endDate,
        },
      })
      .sort({ createdAt: -1 })
      .toArray();

    // Extract detailed messages
    const detailedMessages: any[] = [];
    let totalTokensFromMessages = 0;
    let totalCostFromMessages = 0;

    conversations.forEach((conv) => {
      if (conv.messages && Array.isArray(conv.messages)) {
        conv.messages.forEach((message) => {
          const messageTokens = message.metadata?.tokenUsage || {};
          const inputTokens = messageTokens.inputTokens || 0;
          const outputTokens = messageTokens.outputTokens || 0;
          const totalTokens = inputTokens + outputTokens;
          const cost = (inputTokens * 3) / 1000000 + (outputTokens * 15) / 1000000;

          totalTokensFromMessages += totalTokens;
          totalCostFromMessages += cost;

          detailedMessages.push({
            messageId: message.id,
            conversationId: conv._id.toString(),
            conversationTitle: conv.title,
            role: message.role,
            content: message.content?.substring(0, 500) + (message.content?.length > 500 ? '...' : ''), // Truncate for overview
            timestamp: message.timestamp,
            userId: message.userId,
            tokenUsage: {
              inputTokens,
              outputTokens,
              totalTokens,
            },
            cost,
            attachments: message.metadata?.attachments || [],
            context: message.context || {},
          });
        });
      }
    });

    // Extract detailed execution steps
    const detailedExecutionSteps: any[] = [];
    let totalTokensFromExecutions = 0;
    let totalCostFromExecutions = 0;

    executions.forEach((execution) => {
      // Process execution map tasks
      if (execution.executionMap?.tasks) {
        execution.executionMap.tasks.forEach((task) => {
          const taskTokens = task.tokens || {};
          const inputTokens = taskTokens.inputTokens || 0;
          const outputTokens = taskTokens.outputTokens || 0;
          const totalTokens = inputTokens + outputTokens;
          const cost = task.cost || 0;

          totalTokensFromExecutions += totalTokens;
          totalCostFromExecutions += cost;

          // Calculate execution time
          let executionTime = 0;
          if (task.startedAt && task.finishedAt) {
            executionTime = new Date(task.finishedAt).getTime() - new Date(task.startedAt).getTime();
          }

          detailedExecutionSteps.push({
            taskId: task.id,
            executionId: execution._id.toString(),
            conversationId: execution.conversationId?.toString(),
            title: task.title,
            description: task.description,
            type: task.type,
            operation: task.operation,
            priority: task.priority,
            status: task.status,
            startedAt: task.startedAt,
            finishedAt: task.finishedAt,
            executionTime,
            tokenUsage: {
              inputTokens,
              outputTokens,
              totalTokens,
            },
            cost,
            estimatedTokens: task.estimatedTokens,
            prompt: task.prompt?.substring(0, 300) + (task.prompt?.length > 300 ? '...' : ''), // Truncate for overview
            result: task.result
              ? typeof task.result === 'string'
                ? `${task.result.substring(0, 200)}...`
                : '[Object]'
              : null,
            error: task.error,
            dependencies: task.dependencies || [],
            context: task.context || {},
          });
        });
      }

      // Also process statusByTask for additional step details
      if (execution.statusByTask) {
        Object.entries(execution.statusByTask).forEach(([taskId, taskRecord]: [string, any]) => {
          // Check if we already have this task from executionMap
          const alreadyProcessed = detailedExecutionSteps.some(
            (step) => step.executionId === execution._id.toString() && step.taskId === taskId
          );

          if (!alreadyProcessed) {
            const taskTokens = taskRecord.tokens || {};
            const inputTokens = taskTokens.inputTokens || 0;
            const outputTokens = taskTokens.outputTokens || 0;
            const totalTokens = inputTokens + outputTokens;
            const cost = taskRecord.cost || 0;

            totalTokensFromExecutions += totalTokens;
            totalCostFromExecutions += cost;

            // Calculate execution time
            let executionTime = 0;
            if (taskRecord.startedAt && taskRecord.finishedAt) {
              executionTime = new Date(taskRecord.finishedAt).getTime() - new Date(taskRecord.startedAt).getTime();
            }

            detailedExecutionSteps.push({
              taskId,
              executionId: execution._id.toString(),
              conversationId: execution.conversationId?.toString(),
              title: `Task ${taskId}`,
              status: taskRecord.status,
              startedAt: taskRecord.startedAt,
              finishedAt: taskRecord.finishedAt,
              executionTime,
              tokenUsage: {
                inputTokens,
                outputTokens,
                totalTokens,
              },
              cost,
              resultSummary:
                taskRecord.resultSummary?.substring(0, 200) + (taskRecord.resultSummary?.length > 200 ? '...' : ''),
              error: taskRecord.error,
            });
          }
        });
      }
    });

    return {
      messages: detailedMessages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
      executionSteps: detailedExecutionSteps.sort((a, b) => {
        const aTime = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const bTime = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return bTime - aTime;
      }),
      summary: {
        totalMessages: detailedMessages.length,
        totalExecutionSteps: detailedExecutionSteps.length,
        totalTokensFromMessages,
        totalTokensFromExecutions,
        totalCostFromMessages,
        totalCostFromExecutions,
      },
    };
  } catch (error) {
    throw new Error(`Failed to get detailed analytics data: ${error.message}`);
  }
};

/**
 * Calculate token usage analytics from messages and execution details
 */
const calculateTokenAnalytics = async (
  conversations: any[],
  executions: any[],
  dateRange: { startDate: Date; endDate: Date }
): Promise<TokenUsageAnalytics> => {
  let totalInputTokens = 0;
  let totalOutputTokens = 0;

  // Extract token data from conversation messages
  for (const conv of conversations) {
    if (conv.messages && Array.isArray(conv.messages)) {
      for (const message of conv.messages) {
        if (message.metadata?.tokenUsage) {
          totalInputTokens += message.metadata.tokenUsage.inputTokens || 0;
          totalOutputTokens += message.metadata.tokenUsage.outputTokens || 0;
        }
      }
    }
  }

  // Extract token data from execution tasks
  for (const execution of executions) {
    if (execution.statusByTask) {
      Object.values(execution.statusByTask).forEach((taskRecord: any) => {
        if (taskRecord.tokens) {
          totalInputTokens += taskRecord.tokens.inputTokens || 0;
          totalOutputTokens += taskRecord.tokens.outputTokens || 0;
        }
      });
    }
    // Also check executionMap tasks for token data
    if (execution.executionMap?.tasks) {
      execution.executionMap.tasks.forEach((task: any) => {
        if (task.tokens) {
          totalInputTokens += task.tokens.inputTokens || 0;
          totalOutputTokens += task.tokens.outputTokens || 0;
        }
      });
    }
  }

  const totalTokens = totalInputTokens + totalOutputTokens;

  // Estimate cost (Claude 3.5 Sonnet pricing: $3/1M input, $15/1M output)
  const totalCost = (totalInputTokens * 3) / 1000000 + (totalOutputTokens * 15) / 1000000;

  // Group by day from conversations and messages
  const dailyUsageMap = new Map();

  // Process conversation messages for daily breakdown
  conversations.forEach((conv) => {
    const convDate = conv.createdAt.toISOString().split('T')[0];
    if (!dailyUsageMap.has(convDate)) {
      dailyUsageMap.set(convDate, {
        date: convDate,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        conversationCount: 0,
        executionCount: 0,
      });
    }
    const convDay = dailyUsageMap.get(convDate);
    convDay.conversationCount += 1;

    // Extract tokens from messages
    if (conv.messages && Array.isArray(conv.messages)) {
      conv.messages.forEach((message) => {
        const messageDate = message.timestamp ? new Date(message.timestamp).toISOString().split('T')[0] : convDate;
        if (!dailyUsageMap.has(messageDate)) {
          dailyUsageMap.set(messageDate, {
            date: messageDate,
            inputTokens: 0,
            outputTokens: 0,
            totalTokens: 0,
            cost: 0,
            conversationCount: 0,
            executionCount: 0,
          });
        }
        const msgDay = dailyUsageMap.get(messageDate);

        if (message.metadata?.tokenUsage) {
          msgDay.inputTokens += message.metadata.tokenUsage.inputTokens || 0;
          msgDay.outputTokens += message.metadata.tokenUsage.outputTokens || 0;
          msgDay.totalTokens +=
            (message.metadata.tokenUsage.inputTokens || 0) + (message.metadata.tokenUsage.outputTokens || 0);
          msgDay.cost +=
            ((message.metadata.tokenUsage.inputTokens || 0) * 3) / 1000000 +
            ((message.metadata.tokenUsage.outputTokens || 0) * 15) / 1000000;
        }
      });
    }
  });

  // Add execution counts to daily usage
  executions.forEach((exec) => {
    const date = exec.createdAt.toISOString().split('T')[0];
    if (dailyUsageMap.has(date)) {
      dailyUsageMap.get(date).executionCount += 1;
    }
  });

  const dailyUsage = Array.from(dailyUsageMap.values()).sort((a, b) => a.date.localeCompare(b.date));

  // Group by month
  const monthlyUsageMap = new Map();
  conversations.forEach((conv) => {
    const month = conv.createdAt.toISOString().substring(0, 7); // YYYY-MM
    if (!monthlyUsageMap.has(month)) {
      monthlyUsageMap.set(month, {
        month,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        cost: 0,
        conversationCount: 0,
        executionCount: 0,
      });
    }
    const monthData = monthlyUsageMap.get(month);
    monthData.inputTokens += conv.inputTokens || 0;
    monthData.outputTokens += conv.outputTokens || 0;
    monthData.totalTokens += (conv.inputTokens || 0) + (conv.outputTokens || 0);
    monthData.cost += ((conv.inputTokens || 0) * 3) / 1000000 + ((conv.outputTokens || 0) * 15) / 1000000;
    monthData.conversationCount += 1;
  });

  const monthlyUsage = Array.from(monthlyUsageMap.values()).sort((a, b) => a.month.localeCompare(b.month));

  // Model breakdown (assuming Claude 3.5 Sonnet for now)
  const modelBreakdown = [
    {
      model: 'Claude 3.5 Sonnet',
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
      totalTokens,
      cost: totalCost,
      usageCount: conversations.length,
    },
  ];

  return {
    totalInputTokens,
    totalOutputTokens,
    totalTokens,
    totalCost,
    dailyUsage,
    monthlyUsage,
    modelBreakdown,
  };
};

/**
 * Calculate conversation analytics
 */
const calculateConversationAnalytics = async (conversations: any[], executions: any[]): Promise<ConversationAnalytics> => {
  const totalConversations = conversations.length;
  const activeConversations = conversations.filter((conv) => conv.status === 'generatingResponse').length;
  const completedConversations = conversations.filter((conv) => conv.status === 'done').length;
  const failedConversations = conversations.filter((conv) => conv.status === 'error').length;

  // Calculate average duration
  const conversationsWithDuration = conversations.filter((conv) => conv.startTime && conv.endTime);
  const averageConversationDuration =
    conversationsWithDuration.length > 0
      ? conversationsWithDuration.reduce((sum, conv) => {
          const duration = new Date(conv.endTime).getTime() - new Date(conv.startTime).getTime();
          return sum + duration;
        }, 0) / conversationsWithDuration.length
      : 0;

  // Group by application
  const appMap = new Map();
  conversations.forEach((conv) => {
    const appId = conv.currentApplication?._id?.toString() || 'unknown';
    const appName = conv.currentApplication?.name || 'Unknown Application';

    if (!appMap.has(appId)) {
      appMap.set(appId, {
        applicationId: appId,
        applicationName: appName,
        conversationCount: 0,
        successCount: 0,
        totalDuration: 0,
        durationsCount: 0,
        totalTokens: 0,
        lastActivity: new Date(0),
      });
    }

    const app = appMap.get(appId);
    app.conversationCount += 1;
    if (conv.status === 'done') app.successCount += 1;
    app.totalTokens += (conv.inputTokens || 0) + (conv.outputTokens || 0);

    if (conv.startTime && conv.endTime) {
      const duration = new Date(conv.endTime).getTime() - new Date(conv.startTime).getTime();
      app.totalDuration += duration;
      app.durationsCount += 1;
    }

    if (conv.createdAt > app.lastActivity) {
      app.lastActivity = conv.createdAt;
    }
  });

  const conversationsByApplication = Array.from(appMap.values()).map((app) => ({
    applicationId: app.applicationId,
    applicationName: app.applicationName,
    conversationCount: app.conversationCount,
    successRate: app.conversationCount > 0 ? (app.successCount / app.conversationCount) * 100 : 0,
    averageDuration: app.durationsCount > 0 ? app.totalDuration / app.durationsCount : 0,
    totalTokens: app.totalTokens,
    lastActivity: app.lastActivity,
  }));

  // Group by status
  const statusMap = new Map();
  conversations.forEach((conv) => {
    const status = conv.status || 'unknown';
    statusMap.set(status, (statusMap.get(status) || 0) + 1);
  });

  const conversationsByStatus = Array.from(statusMap.entries()).map(([status, count]) => ({
    status,
    count,
    percentage: totalConversations > 0 ? (count / totalConversations) * 100 : 0,
  }));

  // Recent conversations (last 10)
  const recentConversations = conversations.slice(0, 10).map((conv) => {
    const relatedExecutions = executions.filter((exec) => exec.conversationId?.toString() === conv._id.toString());
    const duration =
      conv.startTime && conv.endTime ? new Date(conv.endTime).getTime() - new Date(conv.startTime).getTime() : 0;

    return {
      conversationId: conv._id.toString(),
      applicationName: conv.currentApplication?.name || 'Unknown',
      status: conv.status || 'unknown',
      createdAt: conv.createdAt,
      duration,
      inputTokens: conv.inputTokens || 0,
      outputTokens: conv.outputTokens || 0,
      totalSteps: relatedExecutions.length,
    };
  });

  return {
    totalConversations,
    activeConversations,
    completedConversations,
    failedConversations,
    averageConversationDuration,
    conversationsByApplication,
    conversationsByStatus,
    recentConversations,
  };
};

/**
 * Calculate execution analytics
 */
const calculateExecutionAnalytics = async (executions: any[], conversations: any[]): Promise<ExecutionAnalytics> => {
  const totalExecutions = executions.length;
  const successfulExecutions = executions.filter((exec) => exec.status === 'completed').length;
  const failedExecutions = executions.filter((exec) => exec.status === 'failed').length;

  const averageExecutionTime =
    executions.length > 0 ? executions.reduce((sum, exec) => sum + (exec.duration || 0), 0) / executions.length : 0;

  // Get biggest execution maps
  const executionsByConversation = new Map();
  executions.forEach((exec) => {
    const convId = exec.conversationId?.toString();
    if (!executionsByConversation.has(convId)) {
      executionsByConversation.set(convId, []);
    }
    executionsByConversation.get(convId).push(exec);
  });

  const biggestExecutionMaps = Array.from(executionsByConversation.entries())
    .map(([convId, convExecutions]) => {
      const conversation = conversations.find((conv) => conv._id.toString() === convId);
      const totalSteps = convExecutions.length;
      const executionTime = convExecutions.reduce((sum, exec) => sum + (exec.duration || 0), 0);
      const inputTokens = conversation?.inputTokens || 0;
      const outputTokens = conversation?.outputTokens || 0;

      let complexity: 'simple' | 'moderate' | 'complex' | 'very_complex' = 'simple';
      if (totalSteps > 50) complexity = 'very_complex';
      else if (totalSteps > 20) complexity = 'complex';
      else if (totalSteps > 10) complexity = 'moderate';

      return {
        conversationId: convId,
        applicationName: conversation?.currentApplication?.name || 'Unknown',
        totalSteps,
        executionTime,
        inputTokens,
        outputTokens,
        status: conversation?.status || 'unknown',
        createdAt: conversation?.createdAt || new Date(),
        complexity,
      };
    })
    .sort((a, b) => b.totalSteps - a.totalSteps)
    .slice(0, 10);

  // Group executions by step type from detailed execution data
  const stepTypeMap = new Map();
  executions.forEach((exec) => {
    // Process tasks from executionMap
    if (exec.executionMap?.tasks) {
      exec.executionMap.tasks.forEach((task) => {
        const stepType = task.type || task.operation || 'unknown';
        if (!stepTypeMap.has(stepType)) {
          stepTypeMap.set(stepType, {
            stepType,
            count: 0,
            successCount: 0,
            totalTime: 0,
            totalTokens: 0,
            totalCost: 0,
          });
        }
        const stepData = stepTypeMap.get(stepType);
        stepData.count += 1;

        if (task.status === 'completed') stepData.successCount += 1;
        if (task.tokens) {
          stepData.totalTokens += (task.tokens.inputTokens || 0) + (task.tokens.outputTokens || 0);
        }
        if (task.cost) {
          stepData.totalCost += task.cost;
        }

        // Calculate time from startedAt and finishedAt
        if (task.startedAt && task.finishedAt) {
          const startTime = new Date(task.startedAt).getTime();
          const endTime = new Date(task.finishedAt).getTime();
          stepData.totalTime += endTime - startTime;
        }
      });
    }

    // Also process statusByTask for additional details
    if (exec.statusByTask) {
      Object.entries(exec.statusByTask).forEach(([taskId, taskRecord]: [string, any]) => {
        // Find corresponding task type from executionMap if available
        const correspondingTask = exec.executionMap?.tasks?.find((t) => t.id === taskId);
        const stepType = correspondingTask?.type || correspondingTask?.operation || 'unknown';

        if (!stepTypeMap.has(stepType)) {
          stepTypeMap.set(stepType, {
            stepType,
            count: 0,
            successCount: 0,
            totalTime: 0,
            totalTokens: 0,
            totalCost: 0,
          });
        }

        const stepData = stepTypeMap.get(stepType);

        // Update with additional details if not already counted
        if (taskRecord.tokens && !correspondingTask?.tokens) {
          stepData.totalTokens += (taskRecord.tokens.inputTokens || 0) + (taskRecord.tokens.outputTokens || 0);
        }
        if (taskRecord.cost && !correspondingTask?.cost) {
          stepData.totalCost += taskRecord.cost;
        }

        // Update timing if not already calculated
        if (taskRecord.startedAt && taskRecord.finishedAt && !correspondingTask?.startedAt) {
          const startTime = new Date(taskRecord.startedAt).getTime();
          const endTime = new Date(taskRecord.finishedAt).getTime();
          stepData.totalTime += endTime - startTime;
        }
      });
    }
  });

  const executionsByType = Array.from(stepTypeMap.values()).map((stepData) => ({
    stepType: stepData.stepType,
    count: stepData.count,
    successRate: stepData.count > 0 ? (stepData.successCount / stepData.count) * 100 : 0,
    averageTime: stepData.count > 0 ? stepData.totalTime / stepData.count : 0,
    totalTokens: stepData.totalTokens,
  }));

  // Performance metrics
  const totalSteps = executions.reduce((sum, exec) => sum + (exec.steps?.length || 0), 0);
  const averageStepsPerExecution = executions.length > 0 ? totalSteps / executions.length : 0;
  const totalTokensInSteps = Array.from(stepTypeMap.values()).reduce((sum, step) => sum + step.totalTokens, 0);
  const averageTokensPerStep = totalSteps > 0 ? totalTokensInSteps / totalSteps : 0;

  const mostUsedStepTypes = executionsByType
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map((step) => ({
      stepType: step.stepType,
      count: step.count,
      percentage: totalSteps > 0 ? (step.count / totalSteps) * 100 : 0,
    }));

  // Peak usage hours
  const hourMap = new Map();
  executions.forEach((exec) => {
    const hour = exec.createdAt.getHours();
    hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
  });

  const peakUsageHours = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, executionCount: count }))
    .sort((a, b) => b.executionCount - a.executionCount)
    .slice(0, 24);

  return {
    totalExecutions,
    successfulExecutions,
    failedExecutions,
    averageExecutionTime,
    biggestExecutionMaps,
    executionsByType,
    performanceMetrics: {
      averageStepsPerExecution,
      averageTokensPerStep,
      mostUsedStepTypes,
      peakUsageHours,
    },
  };
};

/**
 * Calculate application usage statistics
 */
const calculateApplicationStats = async (
  _userId: string,
  _conversations: any[],
  _executions: any[]
): Promise<ApplicationUsageStats[]> => [];

/**
 * Generate chart data for dashboard
 */
const generateChartData = async (conversations: any[], executions: any[], dateRange: { startDate: Date; endDate: Date }) => {
  // Daily token usage
  const dailyTokenUsage = new Map();
  conversations.forEach((conv) => {
    const date = conv.createdAt.toISOString().split('T')[0];
    if (!dailyTokenUsage.has(date)) {
      dailyTokenUsage.set(date, { date, tokens: 0, cost: 0 });
    }
    const day = dailyTokenUsage.get(date);
    const tokens = (conv.inputTokens || 0) + (conv.outputTokens || 0);
    day.tokens += tokens;
    day.cost += ((conv.inputTokens || 0) * 3) / 1000000 + ((conv.outputTokens || 0) * 15) / 1000000;
  });

  // Conversation trends
  const conversationTrends = new Map();
  conversations.forEach((conv) => {
    const date = conv.createdAt.toISOString().split('T')[0];
    if (!conversationTrends.has(date)) {
      conversationTrends.set(date, { date, count: 0, successCount: 0 });
    }
    const day = conversationTrends.get(date);
    day.count += 1;
    if (conv.status === 'done') day.successCount += 1;
  });

  // Execution performance
  const executionPerformance = new Map();
  executions.forEach((exec) => {
    const date = exec.createdAt.toISOString().split('T')[0];
    if (!executionPerformance.has(date)) {
      executionPerformance.set(date, {
        date,
        totalTime: 0,
        count: 0,
        successCount: 0,
      });
    }
    const day = executionPerformance.get(date);
    day.totalTime += exec.duration || 0;
    day.count += 1;
    if (exec.status === 'completed') day.successCount += 1;
  });

  // Top applications
  const appUsage = new Map();
  conversations.forEach((conv) => {
    const appName = conv.currentApplication?.name || 'Unknown';
    if (!appUsage.has(appName)) {
      appUsage.set(appName, { name: appName, usage: 0, tokens: 0 });
    }
    const app = appUsage.get(appName);
    app.usage += 1;
    app.tokens += (conv.inputTokens || 0) + (conv.outputTokens || 0);
  });

  return {
    dailyTokenUsage: Array.from(dailyTokenUsage.values()).sort((a, b) => a.date.localeCompare(b.date)),
    conversationTrends: Array.from(conversationTrends.values())
      .map((day) => ({
        date: day.date,
        count: day.count,
        successRate: day.count > 0 ? (day.successCount / day.count) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    executionPerformance: Array.from(executionPerformance.values())
      .map((day) => ({
        date: day.date,
        averageTime: day.count > 0 ? day.totalTime / day.count : 0,
        successRate: day.count > 0 ? (day.successCount / day.count) * 100 : 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)),
    topApplications: Array.from(appUsage.values())
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 10),
  };
};

/**
 * Generate insights and recommendations
 */
const generateInsights = async (conversations: any[], executions: any[], tokenAnalytics: TokenUsageAnalytics) => {
  const insights = {
    mostActiveDay: '',
    mostUsedApplication: '',
    averageSessionLength: 0,
    costEfficiencyTrend: 'stable' as 'improving' | 'stable' | 'declining',
    recommendations: [] as string[],
    alerts: [] as Array<{
      type: 'warning' | 'info' | 'success';
      message: string;
      actionRequired: boolean;
    }>,
  };

  // Most active day
  const dailyActivity = new Map();
  conversations.forEach((conv) => {
    const dayName = conv.createdAt.toLocaleDateString('en-US', { weekday: 'long' });
    dailyActivity.set(dayName, (dailyActivity.get(dayName) || 0) + 1);
  });
  insights.mostActiveDay = Array.from(dailyActivity.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Monday';

  // Most used application
  const appUsage = new Map();
  conversations.forEach((conv) => {
    const appName = conv.currentApplication?.name || 'Unknown';
    appUsage.set(appName, (appUsage.get(appName) || 0) + 1);
  });
  insights.mostUsedApplication = Array.from(appUsage.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No applications';

  // Average session length
  const sessionsWithDuration = conversations.filter((conv) => conv.startTime && conv.endTime);
  insights.averageSessionLength =
    sessionsWithDuration.length > 0
      ? sessionsWithDuration.reduce((sum, conv) => {
          const duration = new Date(conv.endTime).getTime() - new Date(conv.startTime).getTime();
          return sum + duration;
        }, 0) / sessionsWithDuration.length
      : 0;

  // Cost efficiency trend (simplified)
  if (tokenAnalytics.dailyUsage.length >= 7) {
    const recentCost = tokenAnalytics.dailyUsage.slice(-3).reduce((sum, day) => sum + day.cost, 0);
    const previousCost = tokenAnalytics.dailyUsage.slice(-7, -3).reduce((sum, day) => sum + day.cost, 0);

    if (recentCost < previousCost * 0.9) insights.costEfficiencyTrend = 'improving';
    else if (recentCost > previousCost * 1.1) insights.costEfficiencyTrend = 'declining';
  }

  // Recommendations
  const failedConversations = conversations.filter((conv) => conv.status === 'error').length;
  const successRate =
    conversations.length > 0 ? ((conversations.length - failedConversations) / conversations.length) * 100 : 100;

  if (successRate < 90) {
    insights.recommendations.push('Consider reviewing failed conversations to improve success rate');
  }

  if (tokenAnalytics.totalCost > 50) {
    insights.recommendations.push('Monitor token usage to optimize costs');
  }

  if (conversations.length > 100) {
    insights.recommendations.push('Consider archiving old conversations to improve performance');
  }

  // Alerts
  if (tokenAnalytics.totalCost > 100) {
    insights.alerts.push({
      type: 'warning',
      message: 'High token usage detected this month',
      actionRequired: true,
    });
  }

  if (successRate < 80) {
    insights.alerts.push({
      type: 'warning',
      message: 'Low conversation success rate detected',
      actionRequired: true,
    });
  }

  if (executions.filter((exec) => exec.status === 'failed').length > executions.length * 0.2) {
    insights.alerts.push({
      type: 'warning',
      message: 'High execution failure rate detected',
      actionRequired: true,
    });
  }

  return insights;
};
