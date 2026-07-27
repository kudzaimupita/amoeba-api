import express, { Router } from 'express';
import { auth, authController } from '../auth';
import { validate } from '../../utils/validate';
import * as tokenController from './token.controller';
import * as tokenValidation from './token.validation';

const router: Router = express.Router();

/**
 * @swagger
 * /tokens:
 *   get:
 *     summary: Query tokens with pagination
 *     description: Retrieve tokens with filtering and pagination. Non-admin users can only see their own tokens.
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: user
 *         schema:
 *           type: string
 *         description: Filter by user ID (ObjectId)
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [REFRESH, RESET_PASSWORD, VERIFY_EMAIL, PIN, ACCESS]
 *         description: Filter by token type
 *       - in: query
 *         name: blacklisted
 *         schema:
 *           type: boolean
 *         description: Filter by blacklisted status
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *         description: Sort field and order (e.g., createdAt:desc)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Page number
 *     responses:
 *       "200":
 *         description: Tokens retrieved successfully
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
 *                     results:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Token'
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalResults:
 *                       type: integer
 *                 message:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.get('/', auth(), validate(tokenValidation.getTokens), tokenController.getTokens);

/**
 * @swagger
 * /tokens/stats:
 *   get:
 *     summary: Get token statistics (Admin only)
 *     description: Retrieve comprehensive token statistics including counts by type, status, and user
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Token statistics retrieved successfully
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
 *                     totalTokens:
 *                       type: integer
 *                     activeTokens:
 *                       type: integer
 *                     blacklistedTokens:
 *                       type: integer
 *                     expiredTokens:
 *                       type: integer
 *                     byType:
 *                       type: object
 *                     byUser:
 *                       type: object
 *                 message:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/stats', auth('admin'), tokenController.getTokenStats);

/**
 * @swagger
 * /tokens/cleanup:
 *   delete:
 *     summary: Cleanup expired tokens (Admin only)
 *     description: Delete all expired tokens from the database
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       "200":
 *         description: Expired tokens cleaned up successfully
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
 *                     deletedCount:
 *                       type: integer
 *                 message:
 *                   type: string
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 */
router.delete('/cleanup', auth('admin'), tokenController.cleanupExpiredTokens);
router.post('/logout', authController.logout);

/**
 * @swagger
 * /tokens/blacklist:
 *   patch:
 *     summary: Blacklist multiple tokens
 *     description: Mark multiple tokens as blacklisted to prevent their use
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - tokenIds
 *             properties:
 *               tokenIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                 minItems: 1
 *                 maxItems: 100
 *                 description: Array of token IDs to blacklist
 *             example:
 *               tokenIds: ["60f7b3b3b3b3b3b3b3b3b3b3", "60f7b3b3b3b3b3b3b3b3b3b4"]
 *     responses:
 *       "200":
 *         description: Tokens blacklisted successfully
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
 *                     modifiedCount:
 *                       type: integer
 *                     blacklistedTokens:
 *                       type: array
 *                       items:
 *                         type: string
 *                 message:
 *                   type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.patch('/blacklist', auth(), validate(tokenValidation.blacklistTokens), tokenController.blacklistTokens);

/**
 * @swagger
 * /tokens/delete-many:
 *   delete:
 *     summary: Delete multiple tokens based on filter
 *     description: Delete multiple tokens that match the provided filter criteria
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - filter
 *             properties:
 *               filter:
 *                 type: object
 *                 properties:
 *                   user:
 *                     type: string
 *                     description: User ID (ObjectId)
 *                   type:
 *                     type: string
 *                     enum: [REFRESH, RESET_PASSWORD, VERIFY_EMAIL, PIN]
 *                   blacklisted:
 *                     type: boolean
 *                   expires:
 *                     type: object
 *                     properties:
 *                       $lt:
 *                         type: string
 *                         format: date-time
 *                       $lte:
 *                         type: string
 *                         format: date-time
 *                       $gt:
 *                         type: string
 *                         format: date-time
 *                       $gte:
 *                         type: string
 *                         format: date-time
 *                 description: MongoDB-style filter object
 *             example:
 *               filter:
 *                 type: "REFRESH"
 *                 expires:
 *                   $lt: "2024-01-01T00:00:00.000Z"
 *     responses:
 *       "200":
 *         description: Tokens deleted successfully
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
 *                     deletedCount:
 *                       type: integer
 *                     filter:
 *                       type: object
 *                 message:
 *                   type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 */
router.delete('/delete-many', auth(), validate(tokenValidation.deleteManyTokens), tokenController.deleteManyTokens);

/**
 * @swagger
 * /tokens/{tokenId}:
 *   get:
 *     summary: Get token by ID
 *     description: Retrieve a specific token by its ID. Non-admin users can only access their own tokens.
 *     tags: [Tokens]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: tokenId
 *         required: true
 *         schema:
 *           type: string
 *         description: Token ID (ObjectId)
 *     responses:
 *       "200":
 *         description: Token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Token'
 *                 message:
 *                   type: string
 *       "400":
 *         $ref: '#/components/responses/BadRequest'
 *       "401":
 *         $ref: '#/components/responses/Unauthorized'
 *       "403":
 *         $ref: '#/components/responses/Forbidden'
 *       "404":
 *         $ref: '#/components/responses/NotFound'
 */
router.get('/:tokenId', auth(), validate(tokenValidation.getToken), tokenController.getToken);

export default router;