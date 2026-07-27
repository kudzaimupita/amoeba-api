import express, { Router } from 'express';
import { auth } from '../auth';
import {
  getAnalyticsDashboard,
  getTokenAnalytics,
  getConversationAnalytics,
  getExecutionAnalytics,
  getApplicationStats,
  getInsights,
  getDetailedAnalytics,
} from './user.controller';

const router: Router = express.Router();

// Analytics routes - must be placed before any /:userId routes to avoid conflicts
/**
 * @swagger
 * /users/analytics:
 *   get:
 *     summary: Get comprehensive user analytics dashboard
 *     description: Retrieve detailed analytics including token usage, conversation stats, execution metrics, and insights for the authenticated user
 *     tags: [Users, Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period (ISO 8601 format)
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period (ISO 8601 format)
 *       - in: query
 *         name: applicationIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by specific application IDs
 *       - in: query
 *         name: timeGrouping
 *         schema:
 *           type: string
 *           enum: [hour, day, week, month]
 *         description: Time grouping for analytics data
 *       - in: query
 *         name: includeFailedExecutions
 *         schema:
 *           type: boolean
 *         description: Include failed executions in analytics
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Limit for paginated results
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Offset for paginated results
 *     responses:
 *       "200":
 *         description: Analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   description: Complete analytics dashboard data
 *                 message:
 *                   type: string
 *                   example: "User analytics retrieved successfully"
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "500":
 *         $ref: '#/components/responses/InternalError'
 */
router.get('/analytics', auth(), getAnalyticsDashboard);

/**
 * @swagger
 * /users/analytics/tokens:
 *   get:
 *     summary: Get token usage analytics
 *     description: Retrieve detailed token usage statistics including daily/monthly breakdown, costs, and model breakdown
 *     tags: [Users, Analytics, Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *     responses:
 *       "200":
 *         description: Token analytics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     tokenAnalytics:
 *                       type: object
 *                       description: Detailed token usage statistics
 *                     chartData:
 *                       type: object
 *                       properties:
 *                         dailyTokenUsage:
 *                           type: array
 *                           description: Daily token usage data for charts
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/tokens', auth(), getTokenAnalytics);

/**
 * @swagger
 * /users/analytics/conversations:
 *   get:
 *     summary: Get conversation analytics
 *     description: Retrieve conversation statistics including success rates, duration, and application breakdown
 *     tags: [Users, Analytics, Conversations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: applicationIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *     responses:
 *       "200":
 *         description: Conversation analytics retrieved successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/conversations', auth(), getConversationAnalytics);

/**
 * @swagger
 * /users/analytics/executions:
 *   get:
 *     summary: Get execution analytics
 *     description: Retrieve execution performance metrics, biggest execution maps, and step-type breakdown
 *     tags: [Users, Analytics, Executions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: includeFailedExecutions
 *         schema:
 *           type: boolean
 *     responses:
 *       "200":
 *         description: Execution analytics retrieved successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/executions', auth(), getExecutionAnalytics);

/**
 * @swagger
 * /users/analytics/applications:
 *   get:
 *     summary: Get application usage statistics
 *     description: Retrieve usage statistics for all user applications including token usage, success rates, and complexity distribution
 *     tags: [Users, Analytics, Applications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *     responses:
 *       "200":
 *         description: Application statistics retrieved successfully
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/applications', auth(), getApplicationStats);

/**
 * @swagger
 * /users/analytics/insights:
 *   get:
 *     summary: Get user insights and recommendations
 *     description: Retrieve personalized insights, recommendations, and alerts based on usage patterns
 *     tags: [Users, Analytics, Insights]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       "200":
 *         description: User insights retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     insights:
 *                       type: object
 *                       description: User insights and recommendations
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalConversations:
 *                           type: number
 *                         totalTokens:
 *                           type: number
 *                         totalCost:
 *                           type: number
 *                         successRate:
 *                           type: number
 *                         mostUsedApp:
 *                           type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/insights', auth(), getInsights);

/**
 * @swagger
 * /users/analytics/detailed:
 *   get:
 *     summary: Get detailed messages and execution steps data
 *     description: Retrieve comprehensive list of all messages and execution steps with detailed token usage, timing, and metadata
 *     tags: [Users, Analytics, Detailed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Start date for analytics period
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: End date for analytics period
 *       - in: query
 *         name: applicationIds
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: Filter by specific application IDs
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 200
 *           default: 50
 *         description: Number of items to return per page
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       "200":
 *         description: Detailed analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     messages:
 *                       type: array
 *                       description: List of detailed conversation messages with token usage
 *                     executionSteps:
 *                       type: array
 *                       description: List of detailed execution steps with performance metrics
 *                     summary:
 *                       type: object
 *                       properties:
 *                         totalMessages:
 *                           type: number
 *                         totalExecutionSteps:
 *                           type: number
 *                         totalTokensFromMessages:
 *                           type: number
 *                         totalTokensFromExecutions:
 *                           type: number
 *                         totalCostFromMessages:
 *                           type: number
 *                         totalCostFromExecutions:
 *                           type: number
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         totalMessages:
 *                           type: number
 *                         totalExecutionSteps:
 *                           type: number
 *                         limit:
 *                           type: number
 *                         offset:
 *                           type: number
 *                         hasMoreMessages:
 *                           type: boolean
 *                         hasMoreSteps:
 *                           type: boolean
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/analytics/detailed', auth(), getDetailedAnalytics);

export default router;
